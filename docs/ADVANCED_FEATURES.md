# 🚀 Advanced Features Guide

This guide covers the 7 advanced features implemented in the Angular Headless Data Grid library.

## Table of Contents

1. [Advanced Column Management](#1-advanced-column-management)
2. [Smart Filtering System](#2-smart-filtering-system) 
3. [Intelligent Virtualization](#4-intelligent-virtualization)
4. [Data Source Adapters](#5-data-source-adapters)
5. [Export & Import System](#10-export--import-system)
6. [Mobile-First Features](#13-mobile-first-features)
7. [Data Security Features](#14-data-security-features)

## 1. Advanced Column Management

### Overview
Dynamic column operations including add, remove, reorder, resize, toggle visibility, grouping, and locking.

### Key Features
- ✅ **Dynamic Columns**: Add/remove columns at runtime
- ✅ **Column Reordering**: Drag & drop support
- ✅ **Resizable Columns**: Manual and auto-sizing
- ✅ **Column Locking**: Pin columns to left/right
- ✅ **Column Grouping**: Organize related columns
- ✅ **Visibility Toggle**: Show/hide columns

### Usage

```typescript
import { ColumnManagementService, DynamicColumn } from '@fivexlabs/ng-headless-datagrid';

// Define advanced columns
const columns: DynamicColumn[] = [
  {
    id: 'name',
    header: 'Name',
    width: 150,
    resizable: true,
    draggable: true,
    lockable: true,
    sortable: true
  },
  {
    id: 'email',
    header: 'Email',
    width: 200,
    resizable: true,
    groupable: true
  }
];

// Initialize column management
columnService.initialize(columns);

// Dynamic operations
columnService.addColumn({
  id: 'newColumn',
  header: 'New Column',
  width: 120
}, 2); // Insert at position 2

columnService.lockColumn('name', 'left');
columnService.updateColumnWidth('email', 250);
columnService.autoSizeAllColumns();
```

### Column Grouping

```typescript
// Add column groups
columnService.addColumnGroup({
  id: 'personal',
  header: 'Personal Info',
  children: ['firstName', 'lastName', 'email'],
  expanded: true
});

// Get grouped columns
const groupedColumns = columnService.getGroupedColumns();
```

### State Management

```typescript
// Export column state
const columnState = columnService.exportState();

// Import column state
columnService.importState(columnState);

// Reset to defaults
columnService.reset();
```

## 2. Smart Filtering System

### Overview
Advanced filtering with operators, global search, filter presets, and real-time suggestions.

### Key Features
- ✅ **Advanced Operators**: equals, contains, between, regex, etc.
- ✅ **Global Search**: Search across all columns
- ✅ **Filter Presets**: Save and load filter combinations
- ✅ **Real-time Suggestions**: Dynamic filter value suggestions
- ✅ **Conditional Logic**: AND/OR conditions

### Usage

```typescript
import { SmartFilteringService, AdvancedFilter } from '@fivexlabs/ng-headless-datagrid';

// Initialize smart filtering
filterService.initialize({
  enabled: true,
  placeholder: 'Search everything...',
  debounceMs: 300,
  minLength: 2,
  searchableColumns: ['name', 'email', 'department']
});

// Add advanced filters
const filter: AdvancedFilter = {
  columnId: 'salary',
  operator: 'between',
  value: 50000,
  value2: 100000,
  condition: 'and'
};
filterService.addFilter(filter);

// Global search
filterService.setGlobalSearch('john doe');

// Filter presets
const preset = filterService.saveFilterPreset('High Earners', 'Employees with salary > 80k');
filterService.loadFilterPreset(preset.id);
```

### Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Exact match | `name equals "John"` |
| `contains` | Contains text | `email contains "@gmail"` |
| `startsWith` | Starts with | `name startsWith "J"` |
| `endsWith` | Ends with | `email endsWith ".com"` |
| `greaterThan` | Numeric > | `salary greaterThan 50000` |
| `lessThan` | Numeric < | `age lessThan 30` |
| `between` | Range | `salary between 40000 and 80000` |
| `in` | In list | `department in ["IT", "Sales"]` |
| `isEmpty` | Null/empty | `notes isEmpty` |
| `regex` | Pattern match | `phone regex "^\d{3}-\d{3}-\d{4}$"` |

### Filter Suggestions

```typescript
// Get suggestions for a column
const suggestions = filterService.getFilterSuggestions(
  'department', 
  data, 
  'eng', // query
  10    // max results
);
// Returns: [{ value: 'Engineering', label: 'Engineering', count: 25 }]
```

## 4. Intelligent Virtualization

Enhanced virtualization in the existing `VirtualizationService` with variable height support and horizontal virtualization.

### Key Features
- ✅ **Variable Height Rows**: Dynamic row sizing
- ✅ **Horizontal Virtualization**: Large column sets
- ✅ **Predictive Loading**: Smart prefetching
- ✅ **Performance Optimized**: Handles 100k+ rows

### Usage

```typescript
import { VirtualizationService } from '@fivexlabs/ng-headless-datagrid';

// Configure advanced virtualization
const virtualizationConfig = {
  enableVariableHeight: true,
  enableHorizontalVirtualization: true,
  enablePredictiveLoading: true,
  
  vertical: {
    enabled: true,
    defaultHeight: 40,
    minHeight: 30,
    maxHeight: 200,
    estimateHeight: (row, index) => {
      // Dynamic height based on content
      return row.notes?.length > 100 ? 80 : 40;
    }
  },
  
  horizontal: {
    enabled: true,
    defaultWidth: 150,
    overscan: 5
  }
};
```

## 5. Data Source Adapters

### Overview
Flexible data source adapters for remote APIs, WebSocket real-time data, and infinite scrolling.

### Key Features
- ✅ **Remote HTTP Data**: REST API integration
- ✅ **WebSocket Real-time**: Live data updates
- ✅ **Infinite Scrolling**: Progressive loading
- ✅ **Caching Strategy**: Intelligent data caching
- ✅ **Error Handling**: Robust retry mechanisms

### Remote Data Source

```typescript
import { RemoteDataSourceAdapter, HttpClient } from '@fivexlabs/ng-headless-datagrid';

const remoteAdapter = new RemoteDataSourceAdapter(
  httpClient,
  {
    endpoint: 'https://api.example.com/employees',
    method: 'GET',
    headers: { 'Authorization': 'Bearer token' },
    cache: true,
    cacheTTL: 300000, // 5 minutes
    retryAttempts: 3,
    timeout: 10000
  }
);

// Use with grid
gridService.setDataSourceAdapter(remoteAdapter);
```

### WebSocket Real-time Data

```typescript
import { WebSocketDataSourceAdapter } from '@fivexlabs/ng-headless-datagrid';

const wsAdapter = new WebSocketDataSourceAdapter({
  url: 'wss://api.example.com/employees/live',
  reconnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 10
});

// Listen for real-time updates
wsAdapter.data$.subscribe(liveData => {
  console.log('Real-time data update:', liveData);
});
```

### Infinite Scroll Data

```typescript
import { InfiniteScrollDataSourceAdapter } from '@fivexlabs/ng-headless-datagrid';

const infiniteAdapter = new InfiniteScrollDataSourceAdapter(
  baseAdapter, // Any other adapter
  {
    enabled: true,
    pageSize: 50,
    threshold: 100, // pixels from bottom
    prefetchPages: 2,
    loadingIndicator: true
  }
);

// Load more data
infiniteAdapter.loadMore().subscribe();
```

## 10. Export & Import System

### Overview
Multi-format data export/import with validation and custom processors.

### Key Features
- ✅ **Multiple Formats**: CSV, Excel, PDF, JSON, XML
- ✅ **Custom Exporters**: Extensible export system
- ✅ **Import Validation**: Schema validation and error reporting
- ✅ **Data Transformation**: Custom field processing

### Export Data

```typescript
import { ExportImportService, ExportConfig } from '@fivexlabs/ng-headless-datagrid';

const exportConfig: ExportConfig = {
  format: 'excel',
  filename: 'employees-2024.xlsx',
  columns: ['name', 'email', 'department', 'salary'],
  includeHeaders: true,
  dateFormat: 'YYYY-MM-DD',
  customOptions: {
    sheetName: 'Employee Data',
    author: 'HR Department'
  }
};

exportService.export(data, exportConfig).subscribe(result => {
  if (result.success) {
    console.log('Export completed:', result.downloadUrl);
  } else {
    console.error('Export failed:', result.error);
  }
});
```

### Import Data with Validation

```typescript
import { ImportConfig, ImportValidationRule } from '@fivexlabs/ng-headless-datagrid';

const importConfig: ImportConfig = {
  format: 'csv',
  hasHeaders: true,
  delimiter: ',',
  encoding: 'UTF-8',
  columnMapping: {
    'Full Name': 'name',
    'Email Address': 'email'
  },
  validation: [
    {
      column: 'name',
      required: true,
      type: 'string',
      min: 2,
      max: 50
    },
    {
      column: 'email',
      required: true,
      type: 'string',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    {
      column: 'salary',
      type: 'number',
      min: 0,
      max: 1000000,
      customValidator: (value) => {
        return value % 1000 === 0 || 'Salary must be in thousands';
      }
    }
  ]
};

exportService.import(file, importConfig).subscribe(result => {
  if (result.success) {
    console.log(`Imported ${result.validRows}/${result.totalRows} rows`);
    console.log('Data:', result.data);
  } else {
    console.log('Errors:', result.errors);
    console.log('Warnings:', result.warnings);
  }
});
```

## 13. Mobile-First Features

### Overview
Touch gestures, responsive column management, and mobile-optimized interactions.

### Key Features
- ✅ **Touch Gestures**: Swipe actions, pinch to zoom, pull to refresh
- ✅ **Responsive Columns**: Breakpoint-based column visibility
- ✅ **Mobile Pagination**: Touch-friendly pagination
- ✅ **Gesture Recognition**: Custom swipe actions

### Touch Gestures

```typescript
import { MobileTouchService, SwipeAction } from '@fivexlabs/ng-headless-datagrid';

// Configure touch gestures
mobileService.initialize({
  swipeActions: true,
  pinchToZoom: true,
  pullToRefresh: true,
  swipeThreshold: 80,
  pinchSensitivity: 0.1
});

// Add swipe actions
const editAction: SwipeAction = {
  id: 'edit',
  label: 'Edit',
  icon: '✏️',
  color: '#007bff',
  direction: 'right',
  action: (row) => editRecord(row)
};

const deleteAction: SwipeAction = {
  id: 'delete',
  label: 'Delete',
  icon: '🗑️',
  color: '#dc3545',
  direction: 'left',
  action: (row) => deleteRecord(row)
};

mobileService.addSwipeAction(editAction);
mobileService.addSwipeAction(deleteAction);
```

### Responsive Columns

```typescript
import { ResponsiveColumnConfig } from '@fivexlabs/ng-headless-datagrid';

const responsiveConfig: ResponsiveColumnConfig = {
  breakpoints: {
    mobile: ['name', 'status'],           // Show only essential columns
    tablet: ['name', 'email', 'status'], // Add email on tablet
    desktop: ['id', 'name', 'email', 'department', 'status', 'salary'] // Full view
  },
  hiddenColumns: {
    mobile: ['id', 'email', 'department', 'salary'],
    tablet: ['id', 'department', 'salary']
  },
  collapsedColumns: {
    mobile: ['department'], // Show as expandable
    tablet: []
  }
};

// Check responsive state
if (mobileService.isMobile()) {
  // Mobile-specific logic
}

// Listen for breakpoint changes
mobileService.breakpointChanged$.subscribe(breakpoint => {
  console.log('Breakpoint changed to:', breakpoint);
});
```

### Mobile Pagination

```typescript
// Get mobile-optimized pagination config
const paginationConfig = mobileService.getMobilePaginationConfig();

// Returns different configs based on breakpoint:
// Mobile: { type: 'load-more', showPageNumbers: false }
// Tablet: { type: 'standard', maxVisiblePages: 5 }
// Desktop: { type: 'standard', maxVisiblePages: 7 }
```

## 14. Data Security Features

### Overview
Field-level permissions, data masking, and comprehensive audit logging.

### Key Features
- ✅ **Field Permissions**: Role-based column access
- ✅ **Data Masking**: Sensitive data protection
- ✅ **Audit Logging**: Complete action tracking
- ✅ **Conditional Security**: Dynamic permission logic

### Field Permissions

```typescript
import { SecurityService, SecurityConfig, FieldPermission } from '@fivexlabs/ng-headless-datagrid';

const securityConfig: SecurityConfig = {
  fieldPermissions: [
    {
      columnId: 'salary',
      roles: ['manager', 'hr'],
      permissions: ['read', 'export'],
      condition: (user, row) => {
        // Managers can only see their team's salaries
        return user.role === 'hr' || row.managerId === user.id;
      }
    },
    {
      columnId: 'ssn',
      roles: ['hr'],
      permissions: ['read'],
      users: ['hr-admin', 'payroll-manager'] // Specific users
    },
    {
      columnId: 'personalNotes',
      permissions: ['read', 'write'],
      condition: (user, row) => {
        // Users can only see their own notes
        return row.employeeId === user.id;
      }
    }
  ]
};

securityService.initialize(securityConfig, currentUser);

// Check permissions
const canRead = securityService.canReadField('salary', rowData);
const canExport = securityService.canExportField('ssn', rowData);
```

### Data Masking

```typescript
import { DataMaskingRule } from '@fivexlabs/ng-headless-datagrid';

const maskingRules: DataMaskingRule[] = [
  {
    columnId: 'ssn',
    maskType: 'partial',
    visibleChars: 4,
    maskChar: '*',
    // Shows: ***-**-6789
  },
  {
    columnId: 'creditCard',
    maskType: 'custom',
    pattern: '****-****-****-####',
    // Shows: ****-****-****-1234
  },
  {
    columnId: 'password',
    maskType: 'full',
    maskChar: '•'
    // Shows: ••••••••
  }
];

// Apply masking
const maskedValue = securityService.maskFieldValue('ssn', '123-45-6789', rowData);
// Result: ***-**-6789
```

### Audit Logging

```typescript
// Configure audit logging
const auditConfig = {
  enabled: true,
  actions: ['view', 'edit', 'delete', 'export', 'filter', 'sort'],
  storageAdapter: customAuditAdapter // Optional custom storage
};

// Manual logging
securityService.logAction('export', 'employees', undefined, {
  format: 'excel',
  recordCount: 1500,
  columns: ['name', 'email', 'department']
});

// Query audit log
securityService.getAuditLog({
  userId: 'john.doe',
  action: 'export',
  dateFrom: new Date('2024-01-01'),
  dateTo: new Date('2024-12-31'),
  limit: 100
}).subscribe(entries => {
  console.log('Audit entries:', entries);
});
```

### Security Processing Pipeline

```typescript
// Process data through security layer
const processedData = rawData.map(row => 
  securityService.processRowForSecurity(row, visibleColumnIds)
);

// Filter exportable columns based on permissions
const exportableColumns = securityService.filterExportableColumns(
  allColumns, 
  selectedData
);

// Validate field access
const validation = securityService.validateFieldAccess('salary', 'read', rowData);
if (!validation.allowed) {
  console.log('Access denied:', validation.reason);
}
```

## 🔧 Integration Example

Here's how to integrate all advanced features:

```typescript
@Component({
  selector: 'app-advanced-grid',
  template: `
    <div *ngGrid="
      data: processedData(); 
      columns: visibleColumns();
      let gridContext
    ">
      <!-- Your custom template using all features -->
    </div>
  `,
  providers: [
    GridStateService,
    ColumnManagementService,
    SmartFilteringService,
    ExportImportService,
    MobileTouchService,
    SecurityService
  ]
})
export class AdvancedGridComponent implements OnInit {
  gridService = inject(GridStateService);
  columnService = inject(ColumnManagementService);
  filterService = inject(SmartFilteringService);
  exportService = inject(ExportImportService);
  mobileService = inject(MobileTouchService);
  securityService = inject(SecurityService);

  // Computed properties combining all services
  visibleColumns = computed(() => {
    return this.columnService.visibleColumns()
      .filter(col => this.mobileService.shouldShowColumn(col.id, this.responsiveConfig))
      .filter(col => this.securityService.canReadField(col.id));
  });

  processedData = computed(() => {
    let data = this.gridService.data();
    
    // Apply filtering
    data = this.filterService.applyFilters(data, this.visibleColumns());
    
    // Apply security
    data = data.map(row => 
      this.securityService.processRowForSecurity(row, this.visibleColumns().map(c => c.id))
    );
    
    return data;
  });

  ngOnInit() {
    this.initializeAllFeatures();
  }

  private initializeAllFeatures() {
    // Initialize all services with coordinated configuration
    // ... (see previous examples)
  }
}
```

## 📚 Best Practices

### Performance
- Use virtualization for datasets > 1000 rows
- Enable caching for remote data sources
- Implement progressive loading for large datasets
- Optimize column rendering with OnPush strategy

### Security
- Always validate user permissions server-side
- Use data masking for sensitive information
- Implement comprehensive audit logging
- Regular security reviews of field permissions

### Mobile
- Design mobile-first responsive layouts
- Implement touch-friendly interactions
- Optimize for various screen sizes
- Test on actual devices

### Accessibility
- Ensure keyboard navigation support
- Implement proper ARIA labels
- Provide screen reader support
- Follow WCAG guidelines

## 🎯 Advanced Use Cases

### Enterprise Dashboard
- Real-time data updates via WebSocket
- Role-based data access and masking
- Advanced filtering and export capabilities
- Mobile executive summaries

### Financial Data Grid
- Strict field-level permissions
- Comprehensive audit trails
- Encrypted data masking
- Multi-format reporting

### E-commerce Admin Panel
- Infinite scroll product lists
- Advanced column management
- Bulk operations with security checks
- Mobile inventory management

---

This comprehensive guide covers all advanced features of the Angular Headless Data Grid. Each feature is designed to work independently or in combination with others, providing maximum flexibility for your specific use cases. 