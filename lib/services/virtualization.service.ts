import { Injectable, signal, computed } from '@angular/core';
import { GridRow } from '../interfaces/grid.interface';

export interface VirtualizationState {
  containerHeight: number;
  itemHeight: number;
  overscan: number;
  scrollTop: number;
  totalItems: number;
  visibleStartIndex: number;
  visibleEndIndex: number;
  visibleItems: number;
  totalHeight: number;
  offsetY: number;
}

@Injectable()
export class VirtualizationService<T = any> {
  private _containerHeight = signal<number>(400);
  private _itemHeight = signal<number>(40);
  private _overscan = signal<number>(5);
  private _scrollTop = signal<number>(0);
  private _totalItems = signal<number>(0);

  // Computed values for virtualization
  private visibleItems = computed(() => 
    Math.ceil(this._containerHeight() / this._itemHeight())
  );

  private visibleStartIndex = computed(() => {
    const startIndex = Math.floor(this._scrollTop() / this._itemHeight());
    return Math.max(0, startIndex - this._overscan());
  });

  private visibleEndIndex = computed(() => {
    const endIndex = this.visibleStartIndex() + this.visibleItems() + (this._overscan() * 2);
    return Math.min(this._totalItems() - 1, endIndex);
  });

  private totalHeight = computed(() => 
    this._totalItems() * this._itemHeight()
  );

  private offsetY = computed(() => 
    this.visibleStartIndex() * this._itemHeight()
  );

  // Public computed state
  state = computed<VirtualizationState>(() => ({
    containerHeight: this._containerHeight(),
    itemHeight: this._itemHeight(),
    overscan: this._overscan(),
    scrollTop: this._scrollTop(),
    totalItems: this._totalItems(),
    visibleStartIndex: this.visibleStartIndex(),
    visibleEndIndex: this.visibleEndIndex(),
    visibleItems: this.visibleItems(),
    totalHeight: this.totalHeight(),
    offsetY: this.offsetY()
  }));

  // Configuration methods
  setContainerHeight(height: number) {
    this._containerHeight.set(height);
  }

  setItemHeight(height: number) {
    this._itemHeight.set(height);
  }

  setOverscan(overscan: number) {
    this._overscan.set(overscan);
  }

  setTotalItems(count: number) {
    this._totalItems.set(count);
  }

  // Scroll handling
  handleScroll(scrollTop: number) {
    this._scrollTop.set(scrollTop);
  }

  // Get visible slice of items
  getVisibleItems<T>(items: GridRow<T>[]): GridRow<T>[] {
    const start = this.visibleStartIndex();
    const end = this.visibleEndIndex() + 1;
    return items.slice(start, end);
  }

  // Get the styles for the container
  getContainerStyles(): Record<string, string> {
    return {
      height: `${this._containerHeight()}px`,
      overflow: 'auto',
      position: 'relative'
    };
  }

  // Get the styles for the inner content
  getContentStyles(): Record<string, string> {
    return {
      height: `${this.totalHeight()}px`,
      position: 'relative'
    };
  }

  // Get the styles for the visible items wrapper
  getVisibleItemsStyles(): Record<string, string> {
    return {
      transform: `translateY(${this.offsetY()}px)`,
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0'
    };
  }

  // Calculate which item is at a given scroll position
  getItemAtPosition(position: number): number {
    return Math.floor(position / this._itemHeight());
  }

  // Scroll to a specific item
  scrollToItem(index: number): number {
    const position = index * this._itemHeight();
    this._scrollTop.set(position);
    return position;
  }

  // Scroll to ensure an item is visible
  scrollToItemIfNeeded(index: number): number | null {
    const currentStart = this.visibleStartIndex();
    const currentEnd = this.visibleEndIndex();
    
    if (index < currentStart || index > currentEnd) {
      return this.scrollToItem(index);
    }
    
    return null; // No scroll needed
  }

  // Reset virtualization state
  reset() {
    this._scrollTop.set(0);
    this._totalItems.set(0);
  }

  // Estimate total height based on sample items
  estimateTotalHeight(sampleItems: any[], estimatedItemHeight?: number): number {
    if (estimatedItemHeight) {
      this._itemHeight.set(estimatedItemHeight);
    }
    
    const totalHeight = sampleItems.length * this._itemHeight();
    return totalHeight;
  }

  // Dynamic height calculation (for variable height items)
  calculateDynamicHeight(items: any[], getItemHeight: (item: any, index: number) => number): number {
    let totalHeight = 0;
    const itemHeights: number[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(items[i], i);
      itemHeights.push(height);
      totalHeight += height;
    }
    
    // Store heights for later use if needed
    return totalHeight;
  }

  // Performance optimization: check if re-render is needed
  shouldUpdate(newScrollTop: number): boolean {
    const currentScrollTop = this._scrollTop();
    const itemHeight = this._itemHeight();
    const threshold = itemHeight / 2;
    
    return Math.abs(newScrollTop - currentScrollTop) >= threshold;
  }

  // Debug information
  getDebugInfo(): any {
    const state = this.state();
    return {
      'Container Height': state.containerHeight,
      'Item Height': state.itemHeight,
      'Overscan': state.overscan,
      'Scroll Top': state.scrollTop,
      'Total Items': state.totalItems,
      'Visible Start': state.visibleStartIndex,
      'Visible End': state.visibleEndIndex,
      'Visible Count': state.visibleItems,
      'Total Height': state.totalHeight,
      'Offset Y': state.offsetY
    };
  }
} 