# @fivexlabs/ng-headless-datagrid

<div align="center">
  <img src="https://fivexlabs.com/assets/icon/logos/icon-logo-square.jpeg" alt="Fivex Labs" width="80" height="80" />
  
  <h3>Angular Headless Data Grid Library</h3>
  <p>Core logic and state management for custom data grids without UI constraints</p>
  
  <p>Made with ❤️ by <a href="https://fivexlabs.com">Fivex Labs</a></p>

  [![npm version](https://badge.fury.io/js/@fivexlabs%2Fng-headless-datagrid.svg)](https://www.npmjs.com/package/@fivexlabs/ng-headless-datagrid)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
</div>

## 💡 Why ng-headless-datagrid?

### 🚨 **The Problem**
Developers often find styling existing Angular UI libraries "tricky" and difficult because:

- 🎨 **Styling Conflicts**: Angular's component selector and view encapsulation interfere with global or utility-first CSS frameworks
- 🔒 **Design Lock-in**: Default styles lock you into specific design aesthetics, hindering unique UI creation
- 🤼 **Fighting Defaults**: Must constantly override library styles instead of building from scratch
- 🚫 **Limited Customization**: Existing libraries don't provide the flexibility needed for complex, custom data grids
- 🧩 **Framework Friction**: Difficult integration with modern CSS frameworks like Tailwind CSS

### ✅ **The Solution**
**ng-headless-datagrid** eliminates these issues by providing:

- **🎯 Complete Styling Freedom**: No default UI components or styles - you control 100% of the markup and styling
- **🚀 Seamless Integration**: Perfect compatibility with utility-first CSS frameworks like Tailwind CSS
- **⚡ Core Logic Only**: Provides sorting, filtering, pagination, selection, and virtualization logic without any UI constraints
- **🛡️ Type Safety**: Full TypeScript support with comprehensive type definitions
- **🏗️ Flexible Architecture**: Use with any Angular template structure - tables, divs, cards, or custom components

## ✨ Features

### 🎯 **Core Features**
- **📊 Data Processing**: Advanced sorting (single/multi-column), filtering (global/per-column), and pagination
- **🧠 State Management**: Centralized state service with Angular signals for reactive updates
- **🎛️ Selection Logic**: Single and multi-row selection with full keyboard accessibility
- **⚡ Virtualization**: Built-in virtualization for efficiently rendering massive datasets
- **💾 State Persistence**: Export/import grid state as JSON for bookmarkable URLs and user preferences
- **♿ Accessibility**: Complete ARIA support and keyboard navigation patterns

### 🔥 **Enhanced Features**
- **🔄 Real-time Updates**: Reactive state management using Angular signals
- **🎨 Headless Design**: Zero UI constraints - build any design you can imagine
- **📱 Responsive Ready**: Works with any responsive design approach
- **🔍 Advanced Filtering**: Custom filter operators and functions per column
- **📈 Performance Optimized**: Efficient algorithms for large datasets with minimal re-renders
- **🧪 Testing Friendly**: Easy to test with injectable services and pure logic

### 🔧 **Advanced Features**

**NEW: 7 Powerful Advanced Features Added!**

#### 1. **🏗️ Advanced Column Management**
- Dynamic column operations (add, remove, reorder, resize)
- Column locking (freeze left/right) and grouping
- Auto-sizing and responsive column visibility

#### 2. **🔍 Smart Filtering System**
- Advanced operators (contains, between, regex, etc.)
- Global search and filter presets
- Real-time filter suggestions with AND/OR logic

#### 3. **⚡ Intelligent Virtualization**
- Variable height rows and horizontal virtualization
- Predictive loading for 100k+ rows
- Performance-optimized scrolling

#### 4. **🔌 Data Source Adapters**
- Remote HTTP data with intelligent caching
- WebSocket real-time updates
- Infinite scrolling with progressive loading

#### 5. **📤 Export & Import System**
- Multiple formats (CSV, Excel, PDF, JSON, XML)
- Import validation and error reporting
- Custom export processors

#### 6. **📱 Mobile-First Features**
- Touch gestures (swipe actions, pinch-to-zoom)
- Responsive column management
- Mobile-optimized pagination

#### 7. **🔒 Data Security Features**
- Field-level permissions and role-based access
- Data masking for sensitive information
- Comprehensive audit logging

**Legacy Features:**
- **🔄 Batch Operations**: Support for batch editing and operations on multiple rows
- **🎯 Custom Accessors**: Flexible data access with custom accessor functions
- **🔍 Debug Tools**: Built-in debugging utilities for development
- **⚙️ Configurable**: Extensive configuration options for every aspect of grid behavior

## 📦 Installation

```bash
npm install @fivexlabs/ng-headless-datagrid
# or
yarn add @fivexlabs/ng-headless-datagrid
```

> **Note**: This library requires Angular 19+ and works best with modern CSS frameworks like Tailwind CSS.

## 🚀 Advanced Features Quick Start

```typescript
import { 
  ColumnManagementService, 
  SmartFilteringService, 
  ExportImportService,
  MobileTouchService, 
  SecurityService 
} from '@fivexlabs/ng-headless-datagrid';

@Component({
  providers: [
    ColumnManagementService,
    SmartFilteringService, 
    ExportImportService,
    MobileTouchService,
    SecurityService
  ]
})
export class AdvancedGridComponent {
  columnService = inject(ColumnManagementService);
  filterService = inject(SmartFilteringService);
  exportService = inject(ExportImportService);
  mobileService = inject(MobileTouchService);
  securityService = inject(SecurityService);

  ngOnInit() {
    // Advanced column management
    this.columnService.lockColumn('name', 'left');
    this.columnService.addSwipeAction({
      id: 'edit',
      direction: 'right',
      action: (row) => this.editRow(row)
    });

    // Smart filtering with presets
    this.filterService.addFilter({
      columnId: 'salary',
      operator: 'between',
      value: 50000,
      value2: 100000
    });

    // Export data in multiple formats
    this.exportService.export(this.data, {
      format: 'excel',
      filename: 'report.xlsx'
    });

    // Security with field-level permissions
    this.securityService.initialize({
      fieldPermissions: [{
        columnId: 'salary',
        roles: ['manager'],
        permissions: ['read', 'export']
      }]
    });
  }
}
```

📖 **[See Advanced Features Documentation](docs/ADVANCED_FEATURES.md)** for complete guides and examples.

## 🚀 Quick Start

### Basic Usage

Transform your data into a fully functional grid with complete styling control:

```typescript
import { Component } from '@angular/core';
import { NgGridDirective } from '@fivexlabs/ng-headless-datagrid';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [NgGridDirective],
  template: `
    <div *ngGrid="let grid of users; columns: columnDefs; options: gridOptions">
      <!-- Your custom table markup with full styling control -->
      <table class="w-full text-sm text-left text-gray-500">
        <thead class="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th *ngFor="let col of grid.columns"
                scope="col"
                class="px-6 py-3 cursor-pointer hover:bg-gray-100"
                (click)="grid.sortBy(col.id)">
              {{ col.header }}
              
              <!-- Custom sort indicator -->
              <span class="ml-1">
                <ng-container [ngSwitch]="grid.getSortDirection(col.id)">
                  <span *ngSwitchCase="'asc'" class="text-blue-500">↑</span>
                  <span *ngSwitchCase="'desc'" class="text-blue-500">↓</span>
                  <span *ngSwitchDefault class="text-gray-300">↕</span>
                </ng-container>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of grid.rows" 
              class="bg-white border-b hover:bg-gray-50"
              [class.bg-blue-50]="row.selected">
            <td *ngFor="let col of grid.columns" class="px-6 py-4">
              {{ getValue(row.data, col) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Custom pagination with your styling -->
      <div class="flex items-center justify-between mt-4">
        <div class="text-sm text-gray-700">
          Showing {{ (grid.pagination.currentPage - 1) * grid.pagination.pageSize + 1 }} 
          to {{ Math.min(grid.pagination.currentPage * grid.pagination.pageSize, grid.pagination.totalItems) }} 
          of {{ grid.pagination.totalItems }} results
        </div>
        
        <div class="flex space-x-1">
          <button (click)="grid.setPage(grid.pagination.currentPage - 1)"
                  [disabled]="grid.pagination.currentPage === 1"
                  class="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50">
            Previous
          </button>
          
          <button *ngFor="let page of getPageNumbers(grid.pagination)"
                  (click)="grid.setPage(page)"
                  [class.bg-blue-500]="page === grid.pagination.currentPage"
                  [class.text-white]="page === grid.pagination.currentPage"
                  class="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50">
            {{ page }}
          </button>
          
          <button (click)="grid.setPage(grid.pagination.currentPage + 1)"
                  [disabled]="grid.pagination.currentPage === grid.pagination.totalPages"
                  class="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50">
            Next
          </button>
        </div>
      </div>
    </div>
  `
})
export class UserTableComponent {
  users: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', createdAt: new Date() },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', createdAt: new Date() },
    // ... more users
  ];

  columnDefs = [
    { id: 'name', header: 'Full Name', sortable: true, filterable: true },
    { id: 'email', header: 'Email Address', sortable: true, filterable: true },
    { id: 'role', header: 'Role', sortable: true },
    { 
      id: 'createdAt', 
      header: 'Created', 
      sortable: true,
      formatter: (value: Date) => value.toLocaleDateString()
    }
  ];

  gridOptions = {
    enableSorting: true,
    enableFiltering: true,
    enablePagination: true,
    pageSize: 10,
    multiSort: false
  };

  getValue(data: User, column: any): any {
    const value = data[column.id as keyof User];
    return column.formatter ? column.formatter(value, data) : value;
  }

  getPageNumbers(pagination: any): number[] {
    // Custom pagination logic
    const pages = [];
    for (let i = 1; i <= pagination.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
}
```

## 🔥 Enhanced Features

### 🎛️ Advanced Filtering

Create powerful filtering interfaces with complete control:

```typescript
@Component({
  template: `
    <div *ngGrid="let grid of data; columns: columns; options: options">
      <!-- Custom filter controls -->
      <div class="mb-4 grid grid-cols-3 gap-4">
        <div *ngFor="let col of grid.columns">
          <label class="block text-sm font-medium text-gray-700">
            {{ col.header }}
          </label>
          <input type="text"
                 [value]="grid.getFilterValue(col.id)"
                 (input)="grid.setFilter(col.id, $event.target.value)"
                 class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                 [placeholder]="'Filter ' + col.header">
        </div>
      </div>
      
      <!-- Your grid markup here -->
    </div>
  `
})
export class AdvancedFilteringComponent {
  options = {
    enableFiltering: true,
    debounceMs: 300, // Debounce filter input
  };
}
```

### 🎯 Selection Management

Implement complex selection patterns:

```typescript
@Component({
  template: `
    <div *ngGrid="let grid of data; columns: columns; options: selectionOptions">
      <table class="w-full">
        <thead>
          <tr>
            <!-- Select all checkbox -->
            <th class="w-12">
              <input type="checkbox"
                     [checked]="grid.state.selection.selectAll"
                     [indeterminate]="grid.state.selection.indeterminate"
                     (change)="grid.selectAllRows($event.target.checked)"
                     class="rounded border-gray-300">
            </th>
            <th *ngFor="let col of grid.columns">{{ col.header }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of grid.rows" 
              [class.bg-blue-50]="row.selected">
            <!-- Row selection checkbox -->
            <td>
              <input type="checkbox"
                     [checked]="row.selected"
                     (change)="grid.selectRow(row.id, $event.target.checked)"
                     class="rounded border-gray-300">
            </td>
            <td *ngFor="let col of grid.columns">
              {{ getValue(row.data, col) }}
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Selection summary -->
      <div class="mt-4 text-sm text-gray-600">
        {{ grid.state.selection.selectedIds.length }} of {{ grid.rows.length }} items selected
      </div>
    </div>
  `
})
export class SelectableGridComponent {
  selectionOptions = {
    enableSelection: true,
    selectionMode: 'multiple' as const
  };
}
```

### ⚡ Virtualization for Large Datasets

Handle thousands of rows efficiently:

```typescript
import { VirtualizationService } from '@fivexlabs/ng-headless-datagrid';

@Component({
  template: `
    <div *ngGrid="let grid of largeDataset; columns: columns; options: virtualOptions">
      <div class="virtual-container"
           [style.height.px]="400"
           (scroll)="onScroll($event)">
        <div class="virtual-content" [style.height.px]="totalHeight">
          <div class="virtual-items" [style.transform]="'translateY(' + offsetY + 'px)'">
            <div *ngFor="let row of visibleRows; trackBy: trackByRowId"
                 class="virtual-row h-10 flex items-center border-b">
              <div *ngFor="let col of grid.columns" class="flex-1 px-4">
                {{ getValue(row.data, col) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  providers: [VirtualizationService]
})
export class VirtualizedGridComponent {
  largeDataset = Array.from({ length: 100000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    value: Math.random() * 1000
  }));

  virtualOptions = {
    enableVirtualization: true,
    virtualItemHeight: 40,
    virtualOverscan: 5
  };

  constructor(private virtualizationService: VirtualizationService) {}

  onScroll(event: Event) {
    const target = event.target as HTMLElement;
    this.virtualizationService.handleScroll(target.scrollTop);
  }

  get visibleRows() {
    return this.virtualizationService.getVisibleItems(this.grid.rows);
  }

  get totalHeight() {
    return this.virtualizationService.state().totalHeight;
  }

  get offsetY() {
    return this.virtualizationService.state().offsetY;
  }

  trackByRowId(index: number, row: any) {
    return row.id;
  }
}
```

### 💾 State Persistence

Save and restore grid state:

```typescript
@Component({
  template: `
    <div *ngGrid="let grid of data; columns: columns; options: persistentOptions">
      <!-- State management controls -->
      <div class="mb-4 flex space-x-2">
        <button (click)="saveState(grid)" 
                class="px-4 py-2 bg-blue-500 text-white rounded">
          Save State
        </button>
        <button (click)="loadState(grid)" 
                class="px-4 py-2 bg-green-500 text-white rounded">
          Load State
        </button>
        <button (click)="resetState(grid)" 
                class="px-4 py-2 bg-gray-500 text-white rounded">
          Reset
        </button>
      </div>
      
      <!-- Grid content -->
    </div>
  `
})
export class PersistentGridComponent {
  persistentOptions = {
    persistState: true,
    stateKey: 'my-grid-state'
  };

  saveState(grid: any) {
    const state = grid.exportState();
    localStorage.setItem('manual-grid-state', state);
    console.log('State saved:', state);
  }

  loadState(grid: any) {
    const state = localStorage.getItem('manual-grid-state');
    if (state) {
      grid.importState(state);
    }
  }

  resetState(grid: any) {
    localStorage.removeItem('manual-grid-state');
    window.location.reload();
  }
}
```

### 🎨 Utility Directives

Use helper directives for common patterns:

```typescript
import { 
  HdSortableDirective, 
  HdSelectableDirective, 
  HdFilterableDirective,
  HdPaginationDirective
} from '@fivexlabs/ng-headless-datagrid';

@Component({
  imports: [
    NgGridDirective,
    HdSortableDirective,
    HdSelectableDirective,
    HdFilterableDirective,
    HdPaginationDirective
  ],
  template: `
    <div *ngGrid="let grid of data; columns: columns; options: options">
      <table>
        <thead>
          <tr>
            <th *ngFor="let col of grid.columns"
                [hdSortable]="col.id"
                class="cursor-pointer hover:bg-gray-100">
              {{ col.header }}
              <!-- Sorting handled automatically with accessibility -->
            </th>
          </tr>
          <tr>
            <th *ngFor="let col of grid.columns">
              <input [hdFilterable]="col.id"
                     hdFilterOperator="contains"
                     hdFilterDebounce="500"
                     class="w-full p-1 border rounded">
              <!-- Filtering handled automatically -->
            </th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of grid.rows">
            <td [hdSelectable]="row.id" class="cursor-pointer">
              <!-- Row selection handled automatically -->
              {{ row.data.name }}
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Pagination with helper directives -->
      <div class="flex space-x-2">
        <button hdPagination="first">First</button>
        <button hdPagination="prev">Previous</button>
        <button hdPagination="next">Next</button>
        <button hdPagination="last">Last</button>
      </div>
    </div>
  `
})
export class DirectiveExampleComponent {
  // Component implementation
}
```

## 📚 Complete API Reference

### Core Interfaces

| Interface | Description |
|-----------|-------------|
| `GridColumn<T>` | Column definition with sorting, filtering, and formatting options |
| `GridRow<T>` | Row wrapper with selection and expansion state |
| `GridState<T>` | Complete grid state including data, sorting, filtering, pagination |
| `GridOptions<T>` | Configuration options for grid behavior |
| `GridContext<T>` | Template context exposed by the ngGrid directive |

### Services

| Service | Key Methods | Description |
|---------|-------------|-------------|
| `GridStateService<T>` | `sortBy()`, `setFilter()`, `setPage()`, `selectRow()` | Core state management service |
| `VirtualizationService<T>` | `handleScroll()`, `getVisibleItems()` | Virtualization for large datasets |

### Directives

| Directive | Selector | Description |
|-----------|----------|-------------|
| `NgGridDirective` | `[ngGrid]` | Main structural directive providing grid context |
| `HdSortableDirective` | `[hdSortable]` | Makes elements sortable with accessibility |
| `HdSelectableDirective` | `[hdSelectable]` | Makes rows selectable with keyboard support |
| `HdFilterableDirective` | `[hdFilterable]` | Adds filtering to input elements |
| `HdPaginationDirective` | `[hdPagination]` | Pagination button functionality |

### Grid Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableSorting` | `boolean` | `true` | Enable/disable sorting functionality |
| `enableFiltering` | `boolean` | `true` | Enable/disable filtering functionality |
| `enablePagination` | `boolean` | `true` | Enable/disable pagination |
| `enableSelection` | `boolean` | `false` | Enable/disable row selection |
| `selectionMode` | `'single' \| 'multiple' \| 'none'` | `'none'` | Row selection mode |
| `multiSort` | `boolean` | `false` | Allow sorting by multiple columns |
| `pageSize` | `number` | `10` | Number of items per page |
| `persistState` | `boolean` | `false` | Auto-save state to localStorage |
| `debounceMs` | `number` | `300` | Debounce time for filter inputs |

## 🧪 Testing

```bash
npm test
```

The library includes comprehensive testing utilities and examples for testing headless grid implementations.

## 📖 Examples

Check out the `/examples` directory for complete implementations showing:

- Basic table with Tailwind CSS
- Advanced filtering and sorting
- Virtualized grids for large datasets
- Selection and batch operations
- State persistence and URL synchronization
- Integration with Angular Material
- Custom cell renderers and formatters

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏢 About Fivex Labs

[Fivex Labs](https://fivexlabs.com) is a technology company focused on building innovative tools and libraries for modern web development. We believe in creating solutions that are both powerful and developer-friendly.

### Other Libraries by Fivex Labs

- [**@fivexlabs/ng-terminus**](https://github.com/Fivex-Labs/ng-terminus) - Angular subscription management library preventing memory leaks
- [**conform-react**](https://github.com/fivex-labs/conform-react) - Dynamic, conditional forms for React with JSON schemas
- [**react-use-file-system**](https://github.com/fivex-labs/react-use-file-system) - File System Access API hook for React with TypeScript support

Visit us at [fivexlabs.com](https://fivexlabs.com) to learn more about our work and other open-source projects.

---

<div align="center">
  <p>Made with ❤️ by <a href="https://fivexlabs.com">Fivex Labs</a></p>
  <p>© 2025 Fivex Labs. All rights reserved.</p>
</div>
