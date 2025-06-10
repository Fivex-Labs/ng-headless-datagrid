import { 
  Directive, 
  Input, 
  TemplateRef, 
  ViewContainerRef, 
  OnInit, 
  OnDestroy, 
  OnChanges, 
  SimpleChanges,
  computed,
  effect,
  DestroyRef,
  inject
} from '@angular/core';
import { GridStateService } from '../services/grid-state.service';
import { GridColumn, GridOptions, GridContext } from '../interfaces/grid.interface';

export class NgGridContext<T = any> implements GridContext<T> {
  constructor(
    private gridService: GridStateService<T>
  ) {}

  get state() { return this.gridService.state(); }
  get columns() { return this.state.columns; }
  get rows() { return this.state.processedRows; }
  get pagination() { return this.state.pagination; }

  sortBy = (columnId: string, direction?: 'asc' | 'desc') => 
    this.gridService.sortBy(columnId, direction);
  
  clearSort = (columnId?: string) => 
    this.gridService.clearSort(columnId);
  
  getSortDirection = (columnId: string) => 
    this.gridService.getSortDirection(columnId);
  
  setFilter = (columnId: string, value: any, operator?: any) => 
    this.gridService.setFilter(columnId, value, operator);
  
  clearFilter = (columnId?: string) => 
    this.gridService.clearFilter(columnId);
  
  getFilterValue = (columnId: string) => 
    this.gridService.getFilterValue(columnId);
  
  setPage = (page: number) => 
    this.gridService.setPage(page);
  
  setPageSize = (size: number) => 
    this.gridService.setPageSize(size);
  
  selectRow = (rowId: string | number, selected?: boolean) => 
    this.gridService.selectRow(rowId, selected);
  
  selectAllRows = (selected?: boolean) => 
    this.gridService.selectAllRows(selected);
  
  toggleRowSelection = (rowId: string | number) => 
    this.gridService.toggleRowSelection(rowId);
  
  clearSelection = () => 
    this.gridService.clearSelection();
  
  refresh = () => 
    this.gridService.refresh();
  
  exportState = () => 
    this.gridService.exportState();
  
  importState = (state: string) => 
    this.gridService.importState(state);
}

@Directive({
  selector: '[ngGrid]',
  standalone: true,
  providers: [GridStateService]
})
export class NgGridDirective<T = any> implements OnInit, OnChanges, OnDestroy {
  @Input('ngGridOf') data: T[] = [];
  @Input('ngGridColumns') columns: GridColumn<T>[] = [];
  @Input('ngGridOptions') options: GridOptions<T> = {};

  private context: NgGridContext<T>;
  private destroyRef = inject(DestroyRef);

  constructor(
    private templateRef: TemplateRef<NgGridContext<T>>,
    private viewContainer: ViewContainerRef,
    private gridService: GridStateService<T>
  ) {
    this.context = new NgGridContext(this.gridService);
  }

  ngOnInit() {
    this.initialize();
    this.setupAutoRender();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] || changes['columns'] || changes['options']) {
      this.initialize();
    }
  }

  ngOnDestroy() {
    this.viewContainer.clear();
  }

  private initialize() {
    if (this.data && this.columns.length > 0) {
      this.gridService.initialize(this.data, this.columns, this.options);
    }
  }

  private setupAutoRender() {
    // Auto-render when state changes
    effect(() => {
      const state = this.gridService.state();
      if (state.data.length > 0 && state.columns.length > 0) {
        this.render();
      }
    });
  }

  private render() {
    this.viewContainer.clear();
    this.viewContainer.createEmbeddedView(this.templateRef, this.context);
  }

  static ngTemplateContextGuard<T>(
    dir: NgGridDirective<T>, 
    ctx: unknown
  ): ctx is NgGridContext<T> {
    return true;
  }
} 