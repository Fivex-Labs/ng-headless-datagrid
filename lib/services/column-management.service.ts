import { Injectable, signal, computed } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { 
  DynamicColumn, 
  ColumnGroup, 
  ColumnResizeEvent, 
  ColumnReorderEvent 
} from '../interfaces/advanced-grid.interface';

@Injectable()
export class ColumnManagementService<T = any> {
  private _columns = signal<DynamicColumn<T>[]>([]);
  private _columnGroups = signal<ColumnGroup<T>[]>([]);
  private _columnOrder = signal<string[]>([]);
  private _columnWidths = signal<Record<string, number>>({});
  private _lockedColumns = signal<{ left: string[]; right: string[] }>({ left: [], right: [] });
  private _hiddenColumns = signal<string[]>([]);

  // Events
  private _columnResized = new Subject<ColumnResizeEvent>();
  private _columnReordered = new Subject<ColumnReorderEvent>();
  private _columnToggled = new Subject<{ columnId: string; visible: boolean }>();

  // Public observables
  columnResized$ = this._columnResized.asObservable();
  columnReordered$ = this._columnReordered.asObservable();
  columnToggled$ = this._columnToggled.asObservable();

  // Computed states
  columns = computed(() => this._columns());
  columnGroups = computed(() => this._columnGroups());
  orderedColumns = computed(() => {
    const order = this._columnOrder();
    const columns = this._columns();
    
    if (order.length === 0) {
      return columns;
    }

    const orderedCols = order
      .map(id => columns.find(col => col.id === id))
      .filter(Boolean) as DynamicColumn<T>[];
    
    // Add any columns not in the order
    const remainingCols = columns.filter(col => !order.includes(col.id));
    
    return [...orderedCols, ...remainingCols];
  });

  visibleColumns = computed(() => {
    const hidden = this._hiddenColumns();
    return this.orderedColumns().filter(col => !hidden.includes(col.id) && !col.hidden);
  });

  lockedLeftColumns = computed(() => {
    const locked = this._lockedColumns().left;
    const columns = this.visibleColumns();
    return columns.filter(col => locked.includes(col.id));
  });

  lockedRightColumns = computed(() => {
    const locked = this._lockedColumns().right;
    const columns = this.visibleColumns();
    return columns.filter(col => locked.includes(col.id));
  });

  centerColumns = computed(() => {
    const lockedLeft = this._lockedColumns().left;
    const lockedRight = this._lockedColumns().right;
    const columns = this.visibleColumns();
    return columns.filter(col => 
      !lockedLeft.includes(col.id) && !lockedRight.includes(col.id)
    );
  });

  columnWidths = computed(() => this._columnWidths());

  // Initialization
  initialize(columns: DynamicColumn<T>[], groups?: ColumnGroup<T>[]) {
    this._columns.set(columns);
    this._columnOrder.set(columns.map(c => c.id));
    
    if (groups) {
      this._columnGroups.set(groups);
    }

    // Set default widths
    const widths: Record<string, number> = {};
    columns.forEach(col => {
      if (col.width) {
        widths[col.id] = typeof col.width === 'number' ? col.width : 150;
      }
    });
    this._columnWidths.set(widths);
  }

  // Column Operations
  addColumn(column: DynamicColumn<T>, position?: number) {
    const columns = [...this._columns()];
    const order = [...this._columnOrder()];
    
    if (position !== undefined && position >= 0 && position <= columns.length) {
      columns.splice(position, 0, column);
      order.splice(position, 0, column.id);
    } else {
      columns.push(column);
      order.push(column.id);
    }
    
    this._columns.set(columns);
    this._columnOrder.set(order);

    // Set default width if specified
    if (column.width) {
      this.updateColumnWidth(column.id, typeof column.width === 'number' ? column.width : 150);
    }
  }

  removeColumn(columnId: string) {
    const columns = this._columns().filter(col => col.id !== columnId);
    const order = this._columnOrder().filter(id => id !== columnId);
    
    this._columns.set(columns);
    this._columnOrder.set(order);
    
    // Clean up related data
    this.removeColumnWidth(columnId);
    this.unlockColumn(columnId);
    this.showColumn(columnId);
  }

  updateColumn(columnId: string, updates: Partial<DynamicColumn<T>>) {
    const columns = this._columns().map(col => 
      col.id === columnId ? { ...col, ...updates } : col
    );
    this._columns.set(columns);
  }

  // Column Reordering
  reorderColumns(newOrder: string[]) {
    // Validate that all column IDs exist
    const existingIds = this._columns().map(c => c.id);
    const validOrder = newOrder.filter(id => existingIds.includes(id));
    
    // Add any missing columns to the end
    const missingIds = existingIds.filter(id => !validOrder.includes(id));
    const finalOrder = [...validOrder, ...missingIds];
    
    this._columnOrder.set(finalOrder);
    
    // Emit reorder events for each moved column
    const oldOrder = this._columnOrder();
    newOrder.forEach((columnId, newIndex) => {
      const oldIndex = oldOrder.indexOf(columnId);
      if (oldIndex !== newIndex) {
        this._columnReordered.next({ columnId, newIndex, oldIndex });
      }
    });
  }

  moveColumn(columnId: string, newIndex: number) {
    const order = [...this._columnOrder()];
    const oldIndex = order.indexOf(columnId);
    
    if (oldIndex === -1 || oldIndex === newIndex) return;
    
    // Remove from old position and insert at new position
    order.splice(oldIndex, 1);
    order.splice(newIndex, 0, columnId);
    
    this._columnOrder.set(order);
    this._columnReordered.next({ columnId, newIndex, oldIndex });
  }

  // Column Resizing
  updateColumnWidth(columnId: string, width: number) {
    const oldWidth = this._columnWidths()[columnId] || 150;
    const widths = { ...this._columnWidths(), [columnId]: width };
    this._columnWidths.set(widths);
    
    this._columnResized.next({ columnId, newWidth: width, oldWidth });
  }

  removeColumnWidth(columnId: string) {
    const widths = { ...this._columnWidths() };
    delete widths[columnId];
    this._columnWidths.set(widths);
  }

  getColumnWidth(columnId: string): number {
    return this._columnWidths()[columnId] || 150;
  }

  autoSizeColumn(columnId: string, element?: HTMLElement) {
    // Basic auto-sizing logic - can be enhanced with actual measurement
    const column = this._columns().find(c => c.id === columnId);
    if (!column) return;

    let width = 150; // default
    
    if (element) {
      // Measure actual content width
      width = element.scrollWidth + 20; // padding
    } else {
      // Estimate based on header length
      width = Math.max(column.header.length * 8 + 40, 100);
    }

    this.updateColumnWidth(columnId, width);
  }

  autoSizeAllColumns() {
    this._columns().forEach(col => {
      this.autoSizeColumn(col.id);
    });
  }

  // Column Visibility
  hideColumn(columnId: string) {
    const hidden = [...this._hiddenColumns()];
    if (!hidden.includes(columnId)) {
      hidden.push(columnId);
      this._hiddenColumns.set(hidden);
      this._columnToggled.next({ columnId, visible: false });
    }
  }

  showColumn(columnId: string) {
    const hidden = this._hiddenColumns().filter(id => id !== columnId);
    this._hiddenColumns.set(hidden);
    this._columnToggled.next({ columnId, visible: true });
  }

  toggleColumn(columnId: string) {
    const isHidden = this._hiddenColumns().includes(columnId);
    if (isHidden) {
      this.showColumn(columnId);
    } else {
      this.hideColumn(columnId);
    }
  }

  isColumnVisible(columnId: string): boolean {
    return !this._hiddenColumns().includes(columnId);
  }

  // Column Locking
  lockColumn(columnId: string, position: 'left' | 'right') {
    const locked = { ...this._lockedColumns() };
    
    // Remove from other positions first
    locked.left = locked.left.filter(id => id !== columnId);
    locked.right = locked.right.filter(id => id !== columnId);
    
    // Add to new position
    if (position === 'left') {
      locked.left.push(columnId);
    } else {
      locked.right.push(columnId);
    }
    
    this._lockedColumns.set(locked);
  }

  unlockColumn(columnId: string) {
    const locked = { ...this._lockedColumns() };
    locked.left = locked.left.filter(id => id !== columnId);
    locked.right = locked.right.filter(id => id !== columnId);
    this._lockedColumns.set(locked);
  }

  isColumnLocked(columnId: string): 'left' | 'right' | false {
    const locked = this._lockedColumns();
    if (locked.left.includes(columnId)) return 'left';
    if (locked.right.includes(columnId)) return 'right';
    return false;
  }

  // Column Grouping
  addColumnGroup(group: ColumnGroup<T>) {
    const groups = [...this._columnGroups(), group];
    this._columnGroups.set(groups);
  }

  removeColumnGroup(groupId: string) {
    const groups = this._columnGroups().filter(g => g.id !== groupId);
    this._columnGroups.set(groups);
  }

  updateColumnGroup(groupId: string, updates: Partial<ColumnGroup<T>>) {
    const groups = this._columnGroups().map(g => 
      g.id === groupId ? { ...g, ...updates } : g
    );
    this._columnGroups.set(groups);
  }

  toggleGroupExpansion(groupId: string) {
    const groups = this._columnGroups().map(g => 
      g.id === groupId ? { ...g, expanded: !g.expanded } : g
    );
    this._columnGroups.set(groups);
  }

  getGroupedColumns(): Array<{ group?: ColumnGroup<T>; columns: DynamicColumn<T>[] }> {
    const groups = this._columnGroups();
    const columns = this.visibleColumns();
    const result: Array<{ group?: ColumnGroup<T>; columns: DynamicColumn<T>[] }> = [];

    // Add grouped columns
    groups.forEach(group => {
      const groupColumns = columns.filter(col => group.children.includes(col.id));
      if (groupColumns.length > 0) {
        result.push({ group, columns: groupColumns });
      }
    });

    // Add ungrouped columns
    const groupedColumnIds = groups.flatMap(g => g.children);
    const ungroupedColumns = columns.filter(col => !groupedColumnIds.includes(col.id));
    if (ungroupedColumns.length > 0) {
      result.push({ columns: ungroupedColumns });
    }

    return result;
  }

  // State Management
  exportState() {
    return {
      columnOrder: this._columnOrder(),
      columnWidths: this._columnWidths(),
      lockedColumns: this._lockedColumns(),
      hiddenColumns: this._hiddenColumns(),
      columnGroups: this._columnGroups()
    };
  }

  importState(state: any) {
    if (state.columnOrder) this._columnOrder.set(state.columnOrder);
    if (state.columnWidths) this._columnWidths.set(state.columnWidths);
    if (state.lockedColumns) this._lockedColumns.set(state.lockedColumns);
    if (state.hiddenColumns) this._hiddenColumns.set(state.hiddenColumns);
    if (state.columnGroups) this._columnGroups.set(state.columnGroups);
  }

  reset() {
    this._columnOrder.set(this._columns().map(c => c.id));
    this._columnWidths.set({});
    this._lockedColumns.set({ left: [], right: [] });
    this._hiddenColumns.set([]);
    this._columnGroups.set([]);
  }
} 