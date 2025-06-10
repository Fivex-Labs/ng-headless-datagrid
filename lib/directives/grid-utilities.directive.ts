import { Directive, Input, HostListener, inject, ElementRef, Renderer2, OnInit, OnDestroy } from '@angular/core';
import { GridStateService } from '../services/grid-state.service';

@Directive({
  selector: '[hdSortable]',
  standalone: true
})
export class HdSortableDirective implements OnInit {
  @Input('hdSortable') columnId!: string;
  @Input('hdSortDirection') direction?: 'asc' | 'desc';

  private gridService = inject(GridStateService, { optional: true });
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    if (this.gridService && this.columnId) {
      this.gridService.sortBy(this.columnId, this.direction);
      this.updateAriaSort();
    }
  }

  @HostListener('keydown.enter', ['$event'])
  @HostListener('keydown.space', ['$event'])
  onKeydown(event: Event) {
    event.preventDefault();
    this.onClick(event);
  }

  ngOnInit() {
    this.setupAccessibility();
  }

  private setupAccessibility() {
    const element = this.el.nativeElement;
    this.renderer.setAttribute(element, 'role', 'button');
    this.renderer.setAttribute(element, 'tabindex', '0');
    this.renderer.setAttribute(element, 'aria-label', `Sort by ${this.columnId}`);
    this.updateAriaSort();
  }

  private updateAriaSort() {
    if (this.gridService) {
      const sortDirection = this.gridService.getSortDirection(this.columnId);
      const ariaSortValue = sortDirection === 'asc' ? 'ascending' : 
                           sortDirection === 'desc' ? 'descending' : 'none';
      this.renderer.setAttribute(this.el.nativeElement, 'aria-sort', ariaSortValue);
    }
  }
}

@Directive({
  selector: '[hdSelectable]',
  standalone: true
})
export class HdSelectableDirective implements OnInit {
  @Input('hdSelectable') rowId!: string | number;
  @Input('hdSelectMode') mode: 'single' | 'multiple' = 'multiple';

  private gridService = inject(GridStateService, { optional: true });
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    if (this.gridService && this.rowId !== undefined) {
      this.gridService.toggleRowSelection(this.rowId);
      this.updateAriaSelected();
    }
  }

  @HostListener('keydown.enter', ['$event'])
  @HostListener('keydown.space', ['$event'])
  onKeydown(event: Event) {
    event.preventDefault();
    this.onClick(event);
  }

  ngOnInit() {
    this.setupAccessibility();
  }

  private setupAccessibility() {
    const element = this.el.nativeElement;
    if (this.mode === 'single') {
      this.renderer.setAttribute(element, 'role', 'radio');
    } else {
      this.renderer.setAttribute(element, 'role', 'checkbox');
    }
    this.renderer.setAttribute(element, 'tabindex', '0');
    this.updateAriaSelected();
  }

  private updateAriaSelected() {
    if (this.gridService) {
      const state = this.gridService.state();
      const isSelected = state.selection.selectedIds.includes(this.rowId);
      this.renderer.setAttribute(this.el.nativeElement, 'aria-selected', isSelected.toString());
      
      if (this.mode === 'multiple') {
        this.renderer.setAttribute(this.el.nativeElement, 'aria-checked', isSelected.toString());
      }
    }
  }
}

@Directive({
  selector: '[hdFilterable]',
  standalone: true
})
export class HdFilterableDirective implements OnInit, OnDestroy {
  @Input('hdFilterable') columnId!: string;
  @Input('hdFilterOperator') operator: string = 'contains';
  @Input('hdFilterDebounce') debounce: number = 300;

  private gridService = inject(GridStateService, { optional: true });
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private debounceTimer?: number;

  @HostListener('input', ['$event'])
  onInput(event: any) {
    if (this.gridService && this.columnId) {
      const value = event.target.value;
      
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = window.setTimeout(() => {
        this.gridService!.setFilter(this.columnId, value, this.operator as any);
      }, this.debounce);
    }
  }

  ngOnInit() {
    this.setupAccessibility();
  }

  ngOnDestroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  private setupAccessibility() {
    const element = this.el.nativeElement;
    this.renderer.setAttribute(element, 'role', 'searchbox');
    this.renderer.setAttribute(element, 'aria-label', `Filter ${this.columnId}`);
  }
}

@Directive({
  selector: '[hdPagination]',
  standalone: true
})
export class HdPaginationDirective implements OnInit {
  @Input('hdPagination') action!: 'first' | 'prev' | 'next' | 'last' | 'page';
  @Input('hdPageNumber') pageNumber?: number;

  private gridService = inject(GridStateService, { optional: true });
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    if (!this.gridService) return;

    const pagination = this.gridService.state().pagination;

    switch (this.action) {
      case 'first':
        this.gridService.setPage(1);
        break;
      case 'prev':
        if (pagination.currentPage > 1) {
          this.gridService.setPage(pagination.currentPage - 1);
        }
        break;
      case 'next':
        if (pagination.currentPage < pagination.totalPages) {
          this.gridService.setPage(pagination.currentPage + 1);
        }
        break;
      case 'last':
        this.gridService.setPage(pagination.totalPages);
        break;
      case 'page':
        if (this.pageNumber) {
          this.gridService.setPage(this.pageNumber);
        }
        break;
    }
  }

  @HostListener('keydown.enter', ['$event'])
  @HostListener('keydown.space', ['$event'])
  onKeydown(event: Event) {
    event.preventDefault();
    this.onClick(event);
  }

  ngOnInit() {
    this.setupAccessibility();
  }

  private setupAccessibility() {
    const element = this.el.nativeElement;
    this.renderer.setAttribute(element, 'role', 'button');
    this.renderer.setAttribute(element, 'tabindex', '0');
    
    let ariaLabel = '';
    switch (this.action) {
      case 'first':
        ariaLabel = 'Go to first page';
        break;
      case 'prev':
        ariaLabel = 'Go to previous page';
        break;
      case 'next':
        ariaLabel = 'Go to next page';
        break;
      case 'last':
        ariaLabel = 'Go to last page';
        break;
      case 'page':
        ariaLabel = `Go to page ${this.pageNumber}`;
        break;
    }
    
    this.renderer.setAttribute(element, 'aria-label', ariaLabel);
  }
} 