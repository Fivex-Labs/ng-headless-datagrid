import { Injectable, signal, computed, effect, DestroyRef } from '@angular/core';
import { 
  GridColumn, 
  GridRow, 
  GridSort, 
  GridFilter, 
  GridPagination, 
  GridSelection, 
  GridState, 
  GridOptions 
} from '../interfaces/grid.interface';

@Injectable()
export class GridStateService<T = any> {
  private _data = signal<T[]>([]);
  private _columns = signal<GridColumn<T>[]>([]);
  private _sort = signal<GridSort[]>([]);
  private _filters = signal<GridFilter[]>([]);
  private _pagination = signal<GridPagination>({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    pageSizeOptions: [10, 25, 50, 100]
  });
  private _selection = signal<GridSelection<T>>({
    mode: 'none',
    selectedRows: [],
    selectedIds: [],
    selectAll: false,
    indeterminate: false
  });
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _options = signal<GridOptions<T>>({});

  // Computed rows with transformations
  rows = computed(() => {
    const data = this._data();
    return data.map((item, index) => ({
      id: this.getRowId(item, index),
      data: item,
      index,
      selected: this._selection().selectedIds.includes(this.getRowId(item, index)),
      expanded: false,
      disabled: false
    } as GridRow<T>));
  });

  // Computed processed rows (filtered, sorted, paginated)
  processedRows = computed(() => {
    let rows = this.rows();
    
    // Apply filters
    rows = this.applyFilters(rows);
    
    // Apply sorting
    rows = this.applySorting(rows);
    
    // Update pagination totals
    this.updatePaginationTotals(rows.length);
    
    // Apply pagination
    rows = this.applyPagination(rows);
    
    return rows;
  });

  // Computed state
  state = computed<GridState<T>>(() => ({
    data: this._data(),
    columns: this._columns(),
    rows: this.rows(),
    processedRows: this.processedRows(),
    sort: this._sort(),
    filters: this._filters(),
    pagination: this._pagination(),
    selection: this._selection(),
    loading: this._loading(),
    error: this._error()
  }));

  constructor(private destroyRef: DestroyRef) {
    // Auto-save state effect
    effect(() => {
      const options = this._options();
      if (options.persistState && options.stateKey) {
        const state = this.exportState();
        localStorage.setItem(options.stateKey, state);
      }
    });
  }

  initialize(data: T[], columns: GridColumn<T>[], options: GridOptions<T> = {}) {
    this._data.set(data);
    this._columns.set(columns);
    this._options.set({
      enableSorting: true,
      enableFiltering: true,
      enablePagination: true,
      enableSelection: false,
      multiSort: false,
      selectionMode: 'none',
      pageSize: 10,
      pageSizeOptions: [10, 25, 50, 100],
      debounceMs: 300,
      ...options
    });

    // Set initial pagination
    this._pagination.update(p => ({
      ...p,
      pageSize: options.pageSize || 10,
      pageSizeOptions: options.pageSizeOptions || [10, 25, 50, 100]
    }));

    // Set selection mode
    this._selection.update(s => ({
      ...s,
      mode: options.selectionMode || 'none'
    }));

    // Load persisted state if available
    if (options.persistState && options.stateKey) {
      const savedState = localStorage.getItem(options.stateKey);
      if (savedState) {
        this.importState(savedState);
      }
    }
  }

  // Sorting methods
  sortBy(columnId: string, direction?: 'asc' | 'desc') {
    const options = this._options();
    if (!options.enableSorting) return;

    this._sort.update(sorts => {
      const existingIndex = sorts.findIndex(s => s.columnId === columnId);
      const currentDirection = existingIndex >= 0 ? sorts[existingIndex].direction : null;
      
      let newDirection: 'asc' | 'desc';
      if (direction) {
        newDirection = direction;
      } else {
        newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
      }

      if (options.multiSort) {
        if (existingIndex >= 0) {
          sorts[existingIndex].direction = newDirection;
        } else {
          sorts.push({ columnId, direction: newDirection });
        }
        return [...sorts];
      } else {
        return [{ columnId, direction: newDirection }];
      }
    });
  }

  clearSort(columnId?: string) {
    this._sort.update(sorts => {
      if (columnId) {
        return sorts.filter(s => s.columnId !== columnId);
      } else {
        return [];
      }
    });
  }

  getSortDirection(columnId: string): 'asc' | 'desc' | null {
    const sort = this._sort().find(s => s.columnId === columnId);
    return sort ? sort.direction : null;
  }

  // Filtering methods
  setFilter(columnId: string, value: any, operator: GridFilter['operator'] = 'contains') {
    const options = this._options();
    if (!options.enableFiltering) return;

    this._filters.update(filters => {
      const existingIndex = filters.findIndex(f => f.columnId === columnId);
      const newFilter: GridFilter = { columnId, value, operator };

      if (value === null || value === undefined || value === '') {
        // Remove filter if value is empty
        return filters.filter(f => f.columnId !== columnId);
      }

      if (existingIndex >= 0) {
        filters[existingIndex] = newFilter;
        return [...filters];
      } else {
        return [...filters, newFilter];
      }
    });

    // Reset to first page when filtering
    this._pagination.update(p => ({ ...p, currentPage: 1 }));
  }

  clearFilter(columnId?: string) {
    this._filters.update(filters => {
      if (columnId) {
        return filters.filter(f => f.columnId !== columnId);
      } else {
        return [];
      }
    });
  }

  getFilterValue(columnId: string): any {
    const filter = this._filters().find(f => f.columnId === columnId);
    return filter ? filter.value : null;
  }

  // Pagination methods
  setPage(page: number) {
    const pagination = this._pagination();
    if (page >= 1 && page <= pagination.totalPages) {
      this._pagination.update(p => ({ ...p, currentPage: page }));
    }
  }

  setPageSize(size: number) {
    this._pagination.update(p => ({
      ...p,
      pageSize: size,
      currentPage: 1 // Reset to first page
    }));
  }

  // Selection methods
  selectRow(rowId: string | number, selected: boolean = true) {
    const selectionMode = this._selection().mode;
    if (selectionMode === 'none') return;

    this._selection.update(selection => {
      let selectedIds = [...selection.selectedIds];
      let selectedRows = [...selection.selectedRows];

      if (selected) {
        if (selectionMode === 'single') {
          selectedIds = [rowId];
          selectedRows = this.rows().filter(row => row.id === rowId);
        } else {
          if (!selectedIds.includes(rowId)) {
            selectedIds.push(rowId);
            const row = this.rows().find(r => r.id === rowId);
            if (row) selectedRows.push(row);
          }
        }
      } else {
        selectedIds = selectedIds.filter(id => id !== rowId);
        selectedRows = selectedRows.filter(row => row.id !== rowId);
      }

      const allRowIds = this.rows().map(r => r.id);
      const selectAll = allRowIds.length > 0 && allRowIds.every(id => selectedIds.includes(id));
      const indeterminate = selectedIds.length > 0 && !selectAll;

      return {
        ...selection,
        selectedIds,
        selectedRows,
        selectAll,
        indeterminate
      };
    });
  }

  selectAllRows(selected: boolean = true) {
    const selectionMode = this._selection().mode;
    if (selectionMode !== 'multiple') return;

    this._selection.update(selection => {
      if (selected) {
        const allRows = this.rows();
        return {
          ...selection,
          selectedIds: allRows.map(r => r.id),
          selectedRows: allRows,
          selectAll: true,
          indeterminate: false
        };
      } else {
        return {
          ...selection,
          selectedIds: [],
          selectedRows: [],
          selectAll: false,
          indeterminate: false
        };
      }
    });
  }

  toggleRowSelection(rowId: string | number) {
    const isSelected = this._selection().selectedIds.includes(rowId);
    this.selectRow(rowId, !isSelected);
  }

  clearSelection() {
    this._selection.update(selection => ({
      ...selection,
      selectedIds: [],
      selectedRows: [],
      selectAll: false,
      indeterminate: false
    }));
  }

  // Utility methods
  refresh() {
    // Force recomputation by updating a signal
    this._data.update(data => [...data]);
  }

  exportState(): string {
    const exportData = {
      sort: this._sort(),
      filters: this._filters(),
      pagination: this._pagination(),
      selection: this._selection()
    };
    return JSON.stringify(exportData);
  }

  importState(stateJson: string) {
    try {
      const state = JSON.parse(stateJson);
      if (state.sort) this._sort.set(state.sort);
      if (state.filters) this._filters.set(state.filters);
      if (state.pagination) this._pagination.set(state.pagination);
      if (state.selection) this._selection.set(state.selection);
    } catch (error) {
      console.error('Failed to import grid state:', error);
    }
  }

  // Private helper methods
  private getRowId(item: T, index: number): string | number {
    // Try to find an id field, otherwise use index
    if (typeof item === 'object' && item !== null) {
      const obj = item as any;
      return obj.id ?? obj._id ?? obj.uuid ?? index;
    }
    return index;
  }

  private applyFilters(rows: GridRow<T>[]): GridRow<T>[] {
    const filters = this._filters();
    const columns = this._columns();
    
    if (filters.length === 0) return rows;

    return rows.filter(row => {
      return filters.every(filter => {
        const column = columns.find(c => c.id === filter.columnId);
        if (!column) return true;

        const value = this.getCellValue(row.data, column);
        
        // Use custom filter function if provided
        if (column.filterFn) {
          return column.filterFn(value, filter.value);
        }

        // Default filtering logic
        return this.defaultFilter(value, filter.value, filter.operator || 'contains');
      });
    });
  }

  private applySorting(rows: GridRow<T>[]): GridRow<T>[] {
    const sorts = this._sort();
    const columns = this._columns();
    
    if (sorts.length === 0) return rows;

    return [...rows].sort((a, b) => {
      for (const sort of sorts) {
        const column = columns.find(c => c.id === sort.columnId);
        if (!column) continue;

        const aValue = this.getCellValue(a.data, column);
        const bValue = this.getCellValue(b.data, column);

        let comparison = 0;
        
        // Use custom sort function if provided
        if (column.sortCompareFn) {
          comparison = column.sortCompareFn(aValue, bValue);
        } else {
          comparison = this.defaultSort(aValue, bValue);
        }

        if (comparison !== 0) {
          return sort.direction === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });
  }

  private applyPagination(rows: GridRow<T>[]): GridRow<T>[] {
    const options = this._options();
    if (!options.enablePagination) return rows;

    const pagination = this._pagination();
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    
    return rows.slice(startIndex, endIndex);
  }

  private updatePaginationTotals(totalFilteredItems: number) {
    this._pagination.update(p => ({
      ...p,
      totalItems: totalFilteredItems,
      totalPages: Math.ceil(totalFilteredItems / p.pageSize)
    }));
  }

  private getCellValue(data: T, column: GridColumn<T>): any {
    if (column.accessor) {
      if (typeof column.accessor === 'function') {
        return column.accessor(data);
      } else {
        return (data as any)[column.accessor];
      }
    }
    return (data as any)[column.id];
  }

  private defaultFilter(value: any, filterValue: any, operator: string): boolean {
    if (value == null) return false;
    
    const strValue = String(value).toLowerCase();
    const strFilter = String(filterValue).toLowerCase();

    switch (operator) {
      case 'equals':
        return strValue === strFilter;
      case 'contains':
        return strValue.includes(strFilter);
      case 'startsWith':
        return strValue.startsWith(strFilter);
      case 'endsWith':
        return strValue.endsWith(strFilter);
      case 'greaterThan':
        return Number(value) > Number(filterValue);
      case 'lessThan':
        return Number(value) < Number(filterValue);
      default:
        return strValue.includes(strFilter);
    }
  }

  private defaultSort(a: any, b: any): number {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;

    if (typeof a === 'string' && typeof b === 'string') {
      return a.localeCompare(b);
    }

    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }

    if (a instanceof Date && b instanceof Date) {
      return a.getTime() - b.getTime();
    }

    return String(a).localeCompare(String(b));
  }
} 