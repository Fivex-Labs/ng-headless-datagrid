export interface GridColumn<T = any> {
  id: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  accessor?: keyof T | ((row: T) => any);
  formatter?: (value: any, row: T) => string;
  sortCompareFn?: (a: any, b: any) => number;
  filterFn?: (value: any, filterValue: any) => boolean;
  hidden?: boolean;
  pinned?: 'left' | 'right';
}

export interface GridRow<T = any> {
  id: string | number;
  data: T;
  selected?: boolean;
  expanded?: boolean;
  disabled?: boolean;
  index: number;
}

export interface GridSort {
  columnId: string;
  direction: 'asc' | 'desc';
}

export interface GridFilter {
  columnId: string;
  value: any;
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'custom';
}

export interface GridPagination {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  pageSizeOptions?: number[];
}

export interface GridSelection<T = any> {
  mode: 'single' | 'multiple' | 'none';
  selectedRows: GridRow<T>[];
  selectedIds: (string | number)[];
  selectAll?: boolean;
  indeterminate?: boolean;
}

export interface GridState<T = any> {
  data: T[];
  columns: GridColumn<T>[];
  rows: GridRow<T>[];
  processedRows: GridRow<T>[];
  sort: GridSort[];
  filters: GridFilter[];
  pagination: GridPagination;
  selection: GridSelection<T>;
  loading: boolean;
  error: string | null;
  virtualization?: {
    enabled: boolean;
    itemHeight: number;
    overscan: number;
    startIndex: number;
    endIndex: number;
    visibleRange: [number, number];
  };
}

export interface GridOptions<T = any> {
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  enableSelection?: boolean;
  enableVirtualization?: boolean;
  multiSort?: boolean;
  selectionMode?: 'single' | 'multiple' | 'none';
  pageSize?: number;
  pageSizeOptions?: number[];
  virtualItemHeight?: number;
  virtualOverscan?: number;
  persistState?: boolean;
  stateKey?: string;
  debounceMs?: number;
  sortCompareFn?: (a: any, b: any, column: GridColumn<T>) => number;
  filterFn?: (row: T, filters: GridFilter[]) => boolean;
}

export interface GridContext<T = any> {
  state: GridState<T>;
  columns: GridColumn<T>[];
  rows: GridRow<T>[];
  sortBy: (columnId: string, direction?: 'asc' | 'desc') => void;
  clearSort: (columnId?: string) => void;
  getSortDirection: (columnId: string) => 'asc' | 'desc' | null;
  setFilter: (columnId: string, value: any, operator?: string) => void;
  clearFilter: (columnId?: string) => void;
  getFilterValue: (columnId: string) => any;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  selectRow: (rowId: string | number, selected?: boolean) => void;
  selectAllRows: (selected?: boolean) => void;
  toggleRowSelection: (rowId: string | number) => void;
  clearSelection: () => void;
  refresh: () => void;
  exportState: () => string;
  importState: (state: string) => void;
  pagination: GridPagination;
} 