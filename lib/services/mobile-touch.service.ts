import { Injectable, signal, computed, NgZone } from '@angular/core';
import { Subject, Observable, fromEvent, merge } from 'rxjs';
import { filter, map, takeUntil, switchMap } from 'rxjs/operators';
import { 
  TouchGestureConfig, 
  SwipeAction, 
  ResponsiveColumnConfig, 
  MobilePaginationConfig 
} from '../interfaces/advanced-grid.interface';

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  element: HTMLElement;
  rowData?: any;
}

interface PinchEvent {
  scale: number;
  center: { x: number; y: number };
  element: HTMLElement;
}

@Injectable()
export class MobileTouchService {
  private _currentBreakpoint = signal<'mobile' | 'tablet' | 'desktop'>('desktop');
  private _touchGestureConfig = signal<TouchGestureConfig>({
    swipeActions: true,
    pinchToZoom: false,
    pullToRefresh: false,
    swipeThreshold: 50,
    pinchSensitivity: 0.1
  });
  private _swipeActions = signal<SwipeAction[]>([]);
  private _responsiveConfig = signal<ResponsiveColumnConfig>({
    breakpoints: {
      mobile: [],
      tablet: [],
      desktop: []
    },
    hiddenColumns: {
      mobile: [],
      tablet: []
    },
    collapsedColumns: {
      mobile: [],
      tablet: []
    }
  });

  // Event subjects
  private _swipeSubject = new Subject<SwipeEvent>();
  private _pinchSubject = new Subject<PinchEvent>();
  private _pullToRefreshSubject = new Subject<void>();
  private _breakpointChangedSubject = new Subject<'mobile' | 'tablet' | 'desktop'>();

  // Touch tracking
  private touchStartPoints: TouchPoint[] = [];
  private isTracking = false;
  private initialPinchDistance = 0;
  private lastPinchScale = 1;

  // Observables
  swipe$ = this._swipeSubject.asObservable();
  pinch$ = this._pinchSubject.asObservable();
  pullToRefresh$ = this._pullToRefreshSubject.asObservable();
  breakpointChanged$ = this._breakpointChangedSubject.asObservable();

  // Computed properties
  currentBreakpoint = computed(() => this._currentBreakpoint());
  touchGestureConfig = computed(() => this._touchGestureConfig());
  swipeActions = computed(() => this._swipeActions());
  responsiveConfig = computed(() => this._responsiveConfig());

  isMobile = computed(() => this._currentBreakpoint() === 'mobile');
  isTablet = computed(() => this._currentBreakpoint() === 'tablet');
  isDesktop = computed(() => this._currentBreakpoint() === 'desktop');

  visibleColumnsForBreakpoint = computed(() => {
    const breakpoint = this._currentBreakpoint();
    const config = this._responsiveConfig();
    
    if (breakpoint === 'mobile') {
      return config.breakpoints.mobile || [];
    } else if (breakpoint === 'tablet') {
      return config.breakpoints.tablet || [];
    }
    return config.breakpoints.desktop || [];
  });

  hiddenColumnsForBreakpoint = computed(() => {
    const breakpoint = this._currentBreakpoint();
    const config = this._responsiveConfig();
    
    if (breakpoint === 'mobile') {
      return config.hiddenColumns?.mobile || [];
    } else if (breakpoint === 'tablet') {
      return config.hiddenColumns?.tablet || [];
    }
    return [];
  });

  constructor(private ngZone: NgZone) {
    this.initializeBreakpointDetection();
  }

  // ===== INITIALIZATION =====

  initialize(
    touchConfig?: Partial<TouchGestureConfig>,
    responsiveConfig?: Partial<ResponsiveColumnConfig>
  ) {
    if (touchConfig) {
      this._touchGestureConfig.update(current => ({ ...current, ...touchConfig }));
    }
    if (responsiveConfig) {
      this._responsiveConfig.update(current => ({ ...current, ...responsiveConfig }));
    }
  }

  // ===== TOUCH GESTURE MANAGEMENT =====

  enableTouchGestures(element: HTMLElement, rowData?: any) {
    if (!this.touchGestureConfig().swipeActions) return;

    this.ngZone.runOutsideAngular(() => {
      const touchStart = fromEvent<TouchEvent>(element, 'touchstart');
      const touchMove = fromEvent<TouchEvent>(element, 'touchmove');
      const touchEnd = fromEvent<TouchEvent>(element, 'touchend');

      const touchStartSubscription = touchStart.subscribe(event => {
        this.handleTouchStart(event, element, rowData);
      });

      const touchMoveSubscription = touchMove.subscribe(event => {
        this.handleTouchMove(event, element);
      });

      const touchEndSubscription = touchEnd.subscribe(event => {
        this.handleTouchEnd(event, element, rowData);
      });

      // Store cleanup functions on element
      (element as any)._touchCleanup = () => {
        touchStartSubscription.unsubscribe();
        touchMoveSubscription.unsubscribe();
        touchEndSubscription.unsubscribe();
      };
    });
  }

  disableTouchGestures(element: HTMLElement) {
    if ((element as any)._touchCleanup) {
      (element as any)._touchCleanup();
      delete (element as any)._touchCleanup;
    }
  }

  addSwipeAction(action: SwipeAction) {
    const actions = [...this._swipeActions(), action];
    this._swipeActions.set(actions);
  }

  removeSwipeAction(actionId: string) {
    const actions = this._swipeActions().filter(a => a.id !== actionId);
    this._swipeActions.set(actions);
  }

  private handleTouchStart(event: TouchEvent, element: HTMLElement, rowData?: any) {
    this.touchStartPoints = Array.from(event.touches).map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }));

    this.isTracking = true;

    // Handle pinch start
    if (event.touches.length === 2 && this.touchGestureConfig().pinchToZoom) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      this.initialPinchDistance = this.getDistance(
        { x: touch1.clientX, y: touch1.clientY },
        { x: touch2.clientX, y: touch2.clientY }
      );
      this.lastPinchScale = 1;
    }

    event.preventDefault();
  }

  private handleTouchMove(event: TouchEvent, element: HTMLElement) {
    if (!this.isTracking) return;

    // Handle pinch
    if (event.touches.length === 2 && this.touchGestureConfig().pinchToZoom) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const currentDistance = this.getDistance(
        { x: touch1.clientX, y: touch1.clientY },
        { x: touch2.clientX, y: touch2.clientY }
      );

      const scale = currentDistance / this.initialPinchDistance;
      const scaleDiff = Math.abs(scale - this.lastPinchScale);

      if (scaleDiff > (this.touchGestureConfig().pinchSensitivity || 0.1)) {
        const center = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2
        };

        this.ngZone.run(() => {
          this._pinchSubject.next({ scale, center, element });
        });

        this.lastPinchScale = scale;
      }
    }

    event.preventDefault();
  }

  private handleTouchEnd(event: TouchEvent, element: HTMLElement, rowData?: any) {
    if (!this.isTracking || this.touchStartPoints.length === 0) return;

    const endTime = Date.now();
    const startPoint = this.touchStartPoints[0];
    const changedTouch = event.changedTouches[0];
    
    if (!changedTouch) {
      this.isTracking = false;
      return;
    }

    const endPoint: TouchPoint = {
      x: changedTouch.clientX,
      y: changedTouch.clientY,
      timestamp: endTime
    };

    // Calculate swipe metrics
    const deltaX = endPoint.x - startPoint.x;
    const deltaY = endPoint.y - startPoint.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = endTime - startPoint.timestamp;
    const velocity = distance / duration;

    const threshold = this.touchGestureConfig().swipeThreshold || 50;

    // Determine swipe direction
    if (distance > threshold) {
      let direction: SwipeEvent['direction'];
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      // Check for pull-to-refresh
      if (direction === 'down' && this.touchGestureConfig().pullToRefresh) {
        const elementRect = element.getBoundingClientRect();
        if (startPoint.y < elementRect.top + 50) { // Near top of element
          this.ngZone.run(() => {
            this._pullToRefreshSubject.next();
          });
          this.isTracking = false;
          return;
        }
      }

      // Emit swipe event
      this.ngZone.run(() => {
        const swipeEvent: SwipeEvent = {
          direction,
          distance,
          velocity,
          element,
          rowData
        };
        this._swipeSubject.next(swipeEvent);

        // Execute matching swipe actions
        this.executeSwipeActions(swipeEvent);
      });
    }

    this.isTracking = false;
    this.touchStartPoints = [];
  }

  private executeSwipeActions(swipeEvent: SwipeEvent) {
    const matchingActions = this._swipeActions().filter(
      action => action.direction === swipeEvent.direction
    );

    matchingActions.forEach(action => {
      try {
        action.action(swipeEvent.rowData);
      } catch (error) {
        console.error('Error executing swipe action:', error);
      }
    });
  }

  private getDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ===== BREAKPOINT MANAGEMENT =====

  private initializeBreakpointDetection() {
    if (typeof window === 'undefined') return;
    
    this.updateBreakpoint();
    window.addEventListener('resize', () => this.updateBreakpoint());
  }

  private updateBreakpoint() {
    if (typeof window === 'undefined') return;

    let newBreakpoint: 'mobile' | 'tablet' | 'desktop' = 'desktop';

    if (window.innerWidth <= 767) {
      newBreakpoint = 'mobile';
    } else if (window.innerWidth <= 1023) {
      newBreakpoint = 'tablet';
    }

    const oldBreakpoint = this._currentBreakpoint();
    if (oldBreakpoint !== newBreakpoint) {
      this._currentBreakpoint.set(newBreakpoint);
      this._breakpointChangedSubject.next(newBreakpoint);
    }
  }

  setBreakpoint(breakpoint: 'mobile' | 'tablet' | 'desktop') {
    this._currentBreakpoint.set(breakpoint);
    this._breakpointChangedSubject.next(breakpoint);
  }

  // ===== RESPONSIVE COLUMN MANAGEMENT =====

  updateResponsiveConfig(config: Partial<ResponsiveColumnConfig>) {
    this._responsiveConfig.update(current => ({
      ...current,
      ...config,
      breakpoints: { ...current.breakpoints, ...config.breakpoints },
      hiddenColumns: { ...current.hiddenColumns, ...config.hiddenColumns },
      collapsedColumns: { ...current.collapsedColumns, ...config.collapsedColumns }
    }));
  }

  shouldShowColumn(columnId: string): boolean {
    const breakpoint = this._currentBreakpoint();
    const config = this._responsiveConfig();
    
    // Check if column should be shown for current breakpoint
    const visibleColumns = this.visibleColumnsForBreakpoint();
    if (visibleColumns.length > 0 && !visibleColumns.includes(columnId)) {
      return false;
    }

    // Check if column is hidden for current breakpoint
    const hiddenColumns = this.hiddenColumnsForBreakpoint();
    return !hiddenColumns.includes(columnId);
  }

  isColumnCollapsed(columnId: string): boolean {
    const breakpoint = this._currentBreakpoint();
    const config = this._responsiveConfig();
    
    if (breakpoint === 'mobile') {
      return config.collapsedColumns?.mobile?.includes(columnId) || false;
    } else if (breakpoint === 'tablet') {
      return config.collapsedColumns?.tablet?.includes(columnId) || false;
    }
    
    return false;
  }

  getOptimalColumnWidth(baseWidth: number): number {
    const breakpoint = this._currentBreakpoint();
    
    switch (breakpoint) {
      case 'mobile':
        return Math.min(baseWidth, 120); // Max 120px on mobile
      case 'tablet':
        return Math.min(baseWidth, 200); // Max 200px on tablet
      default:
        return baseWidth;
    }
  }

  // ===== MOBILE PAGINATION HELPERS =====

  getMobilePaginationConfig(): MobilePaginationConfig {
    const breakpoint = this._currentBreakpoint();
    
    if (breakpoint === 'mobile') {
      return {
        type: 'load-more',
        showPageNumbers: false,
        showFirstLast: false,
        maxVisiblePages: 3
      };
    }
    
    return {
      type: 'standard',
      showPageNumbers: true,
      showFirstLast: true,
      maxVisiblePages: 7
    };
  }

  // ===== UTILITY METHODS =====

  enableHapticFeedback() {
    if ('vibrate' in navigator) {
      navigator.vibrate(50); // Short vibration
    }
  }

  preventScrollBounce(element: HTMLElement) {
    let startY: number;
    
    element.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    });

    element.addEventListener('touchmove', (e) => {
      const y = e.touches[0].clientY;
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight;
      const height = element.clientHeight;
      const deltaY = y - startY;

      // Prevent overscroll
      if (
        (scrollTop <= 0 && deltaY > 0) || // Top of scroll
        (scrollTop >= scrollHeight - height && deltaY < 0) // Bottom of scroll
      ) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  optimizeScrolling(element: HTMLElement) {
    // Add momentum scrolling for iOS
    (element.style as any).webkitOverflowScrolling = 'touch';
    
    // Optimize scrolling performance
    element.style.transform = 'translateZ(0)';
    element.style.willChange = 'scroll-position';
  }

  // ===== STATE MANAGEMENT =====

  exportState() {
    return {
      currentBreakpoint: this._currentBreakpoint(),
      touchGestureConfig: this._touchGestureConfig(),
      swipeActions: this._swipeActions(),
      responsiveConfig: this._responsiveConfig()
    };
  }

  importState(state: any) {
    if (state.currentBreakpoint) this._currentBreakpoint.set(state.currentBreakpoint);
    if (state.touchGestureConfig) this._touchGestureConfig.set(state.touchGestureConfig);
    if (state.swipeActions) this._swipeActions.set(state.swipeActions);
    if (state.responsiveConfig) this._responsiveConfig.set(state.responsiveConfig);
  }

  destroy() {
    // Cleanup any remaining touch event listeners
    // This would be called when the service is destroyed
  }
} 