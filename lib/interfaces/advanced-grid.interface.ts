import { Observable } from 'rxjs';
import { GridColumn, GridRow, GridFilter } from './grid.interface';

// ===== FEATURE 1: Advanced Column Management =====

export interface ColumnGroup<T = any> {
  id: string;
  header: string;
  children: string[]; // column IDs
  expanded?: boolean;
  level?: number;
}

export interface ColumnResizeEvent {
  columnId: string;
  newWidth: number;
  oldWidth: number;
}

export interface ColumnReorderEvent {
  columnId: string;
  newIndex: number;
  oldIndex: number;
}

export interface DynamicColumn<T = any> extends GridColumn<T> {
  resizable?: boolean;
  draggable?: boolean;
  groupable?: boolean;
  lockable?: boolean;
  locked?: 'left' | 'right' | false;
}

// ===== FEATURE 2: Smart Filtering System =====

export interface AdvancedFilter {
  columnId: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 
           'between' | 'in' | 'notIn' | 'isEmpty' | 'isNotEmpty' | 'regex' | 'custom';
  value: any;
  value2?: any; // For 'between' operator
  caseSensitive?: boolean;
  condition?: 'and' | 'or';
}

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: AdvancedFilter[];
  global?: string;
  createdAt: Date;
  isDefault?: boolean;
}

export interface FilterSuggestion {
  value: any;
  label: string;
  count?: number;
  type: 'value' | 'range' | 'date' | 'custom';
}

export interface GlobalSearchConfig {
  enabled: boolean;
  placeholder?: string;
  debounceMs?: number;
  minLength?: number;
  highlightMatches?: boolean;
  searchableColumns?: string[];
}

// ===== FEATURE 4: Intelligent Virtualization =====

export interface VariableHeightConfig {
  enabled: boolean;
  defaultHeight: number;
  minHeight: number;
  maxHeight: number;
  estimateHeight?: (row: any, index: number) => number;
  measureHeight?: (element: HTMLElement) => number;
}

export interface HorizontalVirtualizationConfig {
  enabled: boolean;
  defaultWidth: number;
  overscan: number;
  estimateWidth?: (column: DynamicColumn) => number;
}

export interface PredictiveLoadingConfig {
  enabled: boolean;
  bufferSize: number;
  prefetchOnScroll?: boolean;
  prefetchOnSort?: boolean;
  prefetchOnFilter?: boolean;
}

// ===== FEATURE 5: Data Source Adapters =====

export interface DataSourceAdapter<T = any> {
  load(params: DataSourceParams): Observable<DataSourceResult<T>>;
  update?(item: T): Observable<T>;
  delete?(id: string | number): Observable<void>;
  create?(item: Partial<T>): Observable<T>;
}

export interface DataSourceParams {
  page?: number;
  pageSize?: number;
  sort?: { field: string; direction: 'asc' | 'desc' }[];
  filters?: AdvancedFilter[];
  search?: string;
  columns?: string[];
}

export interface DataSourceResult<T> {
  data: T[];
  totalCount: number;
  page?: number;
  pageSize?: number;
  aggregations?: Record<string, any>;
}

export interface RemoteDataConfig {
  endpoint: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  cache?: boolean;
  cacheTTL?: number;
  retryAttempts?: number;
  timeout?: number;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface InfiniteScrollConfig {
  enabled: boolean;
  pageSize: number;
  threshold?: number;
  prefetchPages?: number;
  loadingIndicator?: boolean;
}

// ===== FEATURE 10: Export & Import System =====

export interface ExportConfig {
  format: 'csv' | 'excel' | 'pdf' | 'json' | 'xml' | 'custom';
  filename?: string;
  columns?: string[];
  includeHeaders?: boolean;
  dateFormat?: string;
  encoding?: string;
  customOptions?: Record<string, any>;
}

export interface ExportResult {
  success: boolean;
  data?: Blob | string;
  error?: string;
  downloadUrl?: string;
}

export interface ImportConfig {
  format: 'csv' | 'excel' | 'json' | 'xml';
  hasHeaders?: boolean;
  delimiter?: string;
  encoding?: string;
  columnMapping?: Record<string, string>;
  validation?: ImportValidationRule[];
}

export interface ImportValidationRule {
  column: string;
  required?: boolean;
  type?: 'string' | 'number' | 'date' | 'boolean';
  pattern?: RegExp;
  min?: number;
  max?: number;
  customValidator?: (value: any) => boolean | string;
}

export interface ImportResult<T> {
  success: boolean;
  data?: T[];
  errors?: ImportError[];
  warnings?: ImportWarning[];
  totalRows?: number;
  validRows?: number;
}

export interface ImportError {
  row: number;
  column?: string;
  message: string;
  value?: any;
}

export interface ImportWarning {
  row: number;
  column?: string;
  message: string;
  value?: any;
}

// ===== FEATURE 13: Mobile-First Features =====

export interface TouchGestureConfig {
  swipeActions?: boolean;
  pinchToZoom?: boolean;
  pullToRefresh?: boolean;
  swipeThreshold?: number;
  pinchSensitivity?: number;
}

export interface SwipeAction {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  direction: 'left' | 'right';
  action: (row: any) => void;
}

export interface ResponsiveColumnConfig {
  breakpoints: {
    mobile?: string[];
    tablet?: string[];
    desktop?: string[];
  };
  hiddenColumns?: {
    mobile?: string[];
    tablet?: string[];
  };
  collapsedColumns?: {
    mobile?: string[];
    tablet?: string[];
  };
}

export interface MobilePaginationConfig {
  type: 'standard' | 'infinite' | 'load-more';
  showPageNumbers?: boolean;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
  loadMoreText?: string;
  loadingText?: string;
}

// ===== FEATURE 14: Data Security Features =====

export interface FieldPermission {
  columnId: string;
  roles?: string[];
  users?: string[];
  permissions: ('read' | 'write' | 'export')[];
  condition?: (user: any, row: any) => boolean;
}

export interface DataMaskingRule {
  columnId: string;
  maskType: 'partial' | 'full' | 'custom';
  pattern?: string; // e.g., '***-**-****' for SSN
  visibleChars?: number;
  maskChar?: string;
  condition?: (user: any, row: any) => boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: 'view' | 'edit' | 'delete' | 'export' | 'filter' | 'sort';
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface SecurityConfig {
  fieldPermissions?: FieldPermission[];
  dataMasking?: DataMaskingRule[];
  auditLogging?: {
    enabled: boolean;
    actions: AuditLogEntry['action'][];
    storageAdapter?: AuditStorageAdapter;
  };
  encryptionKey?: string;
  sessionTimeout?: number;
}

export interface AuditStorageAdapter {
  store(entry: AuditLogEntry): Promise<void>;
  query(params: AuditQueryParams): Promise<AuditLogEntry[]>;
}

export interface AuditQueryParams {
  userId?: string;
  action?: AuditLogEntry['action'];
  resource?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

// ===== Combined Advanced Grid State =====

export interface AdvancedGridState<T = any> {
  // Existing state properties...
  
  // Column management
  columnGroups?: ColumnGroup<T>[];
  columnOrder?: string[];
  columnWidths?: Record<string, number>;
  lockedColumns?: { left: string[]; right: string[] };
  
  // Advanced filtering
  advancedFilters?: AdvancedFilter[];
  filterPresets?: FilterPreset[];
  globalSearch?: string;
  
  // Virtualization
  virtualization?: {
    vertical?: VariableHeightConfig;
    horizontal?: HorizontalVirtualizationConfig;
    predictiveLoading?: PredictiveLoadingConfig;
  };
  
  // Mobile
  currentBreakpoint?: 'mobile' | 'tablet' | 'desktop';
  touchGestures?: TouchGestureConfig;
  
  // Security
  userPermissions?: string[];
  maskedFields?: string[];
  auditEnabled?: boolean;
}

// ===== Advanced Grid Options =====

export interface AdvancedGridOptions<T = any> {
  // Column management
  enableColumnManagement?: boolean;
  enableColumnResizing?: boolean;
  enableColumnReordering?: boolean;
  enableColumnGrouping?: boolean;
  enableColumnLocking?: boolean;
  
  // Smart filtering
  enableAdvancedFiltering?: boolean;
  enableGlobalSearch?: boolean;
  enableFilterPresets?: boolean;
  enableFilterSuggestions?: boolean;
  globalSearchConfig?: GlobalSearchConfig;
  
  // Virtualization
  enableVariableHeight?: boolean;
  enableHorizontalVirtualization?: boolean;
  enablePredictiveLoading?: boolean;
  
  // Data source
  dataSourceAdapter?: DataSourceAdapter<T>;
  remoteDataConfig?: RemoteDataConfig;
  webSocketConfig?: WebSocketConfig;
  infiniteScrollConfig?: InfiniteScrollConfig;
  
  // Export/Import
  enableExport?: boolean;
  enableImport?: boolean;
  exportFormats?: ExportConfig['format'][];
  importFormats?: ImportConfig['format'][];
  
  // Mobile
  enableTouchGestures?: boolean;
  responsiveColumns?: ResponsiveColumnConfig;
  mobilePagination?: MobilePaginationConfig;
  
  // Security
  securityConfig?: SecurityConfig;
  currentUser?: any;
} 