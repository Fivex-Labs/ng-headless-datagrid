import { Injectable, signal, computed } from '@angular/core';
import { Subject, Observable, BehaviorSubject, debounceTime, distinctUntilChanged } from 'rxjs';
import { 
  AdvancedFilter, 
  FilterPreset, 
  FilterSuggestion, 
  GlobalSearchConfig 
} from '../interfaces/advanced-grid.interface';

@Injectable()
export class SmartFilteringService<T = any> {
  private _advancedFilters = signal<AdvancedFilter[]>([]);
  private _filterPresets = signal<FilterPreset[]>([]);
  private _globalSearch = signal<string>('');
  private _globalSearchConfig = signal<GlobalSearchConfig>({
    enabled: true,
    placeholder: 'Search...',
    debounceMs: 300,
    minLength: 1,
    highlightMatches: true,
    searchableColumns: []
  });

  // Subjects for real-time features
  private _globalSearchSubject = new BehaviorSubject<string>('');
  private _filterSuggestionsSubject = new Subject<{ columnId: string; query: string }>();

  // Debounced global search
  globalSearch$ = this._globalSearchSubject.pipe(
    debounceTime(this._globalSearchConfig().debounceMs || 300),
    distinctUntilChanged()
  );

  // Events
  private _filterChanged = new Subject<{ type: 'add' | 'update' | 'remove'; filter: AdvancedFilter }>();
  private _presetLoaded = new Subject<FilterPreset>();
  private _globalSearchChanged = new Subject<string>();

  // Public observables
  filterChanged$ = this._filterChanged.asObservable();
  presetLoaded$ = this._presetLoaded.asObservable();
  globalSearchChanged$ = this._globalSearchChanged.asObservable();

  // Computed states
  advancedFilters = computed(() => this._advancedFilters());
  filterPresets = computed(() => this._filterPresets());
  globalSearch = computed(() => this._globalSearch());
  globalSearchConfig = computed(() => this._globalSearchConfig());

  activeFiltersCount = computed(() => {
    const filters = this._advancedFilters();
    const globalSearch = this._globalSearch();
    return filters.length + (globalSearch.length > 0 ? 1 : 0);
  });

  hasActiveFilters = computed(() => this.activeFiltersCount() > 0);

  // Initialization
  initialize(config?: Partial<GlobalSearchConfig>) {
    if (config) {
      this._globalSearchConfig.update(current => ({ ...current, ...config }));
    }

    // Setup global search debouncing
    this.globalSearch$.subscribe(searchTerm => {
      this._globalSearch.set(searchTerm);
      this._globalSearchChanged.next(searchTerm);
    });
  }

  // Advanced Filtering
  addFilter(filter: AdvancedFilter) {
    const filters = [...this._advancedFilters()];
    const existingIndex = filters.findIndex(f => 
      f.columnId === filter.columnId && f.operator === filter.operator
    );

    if (existingIndex >= 0) {
      filters[existingIndex] = filter;
      this._filterChanged.next({ type: 'update', filter });
    } else {
      filters.push(filter);
      this._filterChanged.next({ type: 'add', filter });
    }

    this._advancedFilters.set(filters);
  }

  removeFilter(columnId: string, operator?: string) {
    const filters = this._advancedFilters();
    let removedFilter: AdvancedFilter | undefined;

    const newFilters = filters.filter(f => {
      const matches = f.columnId === columnId && (!operator || f.operator === operator);
      if (matches) {
        removedFilter = f;
      }
      return !matches;
    });

    this._advancedFilters.set(newFilters);
    
    if (removedFilter) {
      this._filterChanged.next({ type: 'remove', filter: removedFilter });
    }
  }

  updateFilter(columnId: string, operator: string, updates: Partial<AdvancedFilter>) {
    const filters = this._advancedFilters().map(f => 
      f.columnId === columnId && f.operator === operator
        ? { ...f, ...updates }
        : f
    );
    
    this._advancedFilters.set(filters);
    
    const updatedFilter = filters.find(f => f.columnId === columnId && f.operator === operator);
    if (updatedFilter) {
      this._filterChanged.next({ type: 'update', filter: updatedFilter });
    }
  }

  getFilter(columnId: string, operator?: string): AdvancedFilter | undefined {
    return this._advancedFilters().find(f => 
      f.columnId === columnId && (!operator || f.operator === operator)
    );
  }

  getFiltersForColumn(columnId: string): AdvancedFilter[] {
    return this._advancedFilters().filter(f => f.columnId === columnId);
  }

  clearAllFilters() {
    const filters = this._advancedFilters();
    this._advancedFilters.set([]);
    this._globalSearch.set('');
    this._globalSearchSubject.next('');

    // Emit remove events for all filters
    filters.forEach(filter => {
      this._filterChanged.next({ type: 'remove', filter });
    });
  }

  clearColumnFilters(columnId: string) {
    const filters = this._advancedFilters();
    const removedFilters = filters.filter(f => f.columnId === columnId);
    const remainingFilters = filters.filter(f => f.columnId !== columnId);
    
    this._advancedFilters.set(remainingFilters);
    
    removedFilters.forEach(filter => {
      this._filterChanged.next({ type: 'remove', filter });
    });
  }

  // Global Search
  setGlobalSearch(searchTerm: string) {
    const config = this._globalSearchConfig();
    if (searchTerm.length >= (config.minLength || 1) || searchTerm.length === 0) {
      this._globalSearchSubject.next(searchTerm);
    }
  }

  clearGlobalSearch() {
    this._globalSearch.set('');
    this._globalSearchSubject.next('');
  }

  updateGlobalSearchConfig(config: Partial<GlobalSearchConfig>) {
    this._globalSearchConfig.update(current => ({ ...current, ...config }));
  }

  // Filter Data Logic
  applyFilters(data: T[], columns: { id: string; accessor?: any }[]): T[] {
    const filters = this._advancedFilters();
    const globalSearch = this._globalSearch();
    const config = this._globalSearchConfig();

    if (filters.length === 0 && !globalSearch) {
      return data;
    }

    return data.filter(row => {
      // Apply advanced filters
      const passesAdvancedFilters = this.evaluateAdvancedFilters(row, filters);
      
      // Apply global search
      const passesGlobalSearch = !globalSearch || 
        this.evaluateGlobalSearch(row, globalSearch, columns, config);

      return passesAdvancedFilters && passesGlobalSearch;
    });
  }

  private evaluateAdvancedFilters(row: T, filters: AdvancedFilter[]): boolean {
    if (filters.length === 0) return true;

    // Group filters by condition (AND/OR)
    const andFilters = filters.filter(f => !f.condition || f.condition === 'and');
    const orFilters = filters.filter(f => f.condition === 'or');

    // All AND filters must pass
    const passesAndFilters = andFilters.every(filter => 
      this.evaluateFilter(row, filter)
    );

    // At least one OR filter must pass (if any exist)
    const passesOrFilters = orFilters.length === 0 || 
      orFilters.some(filter => this.evaluateFilter(row, filter));

    return passesAndFilters && passesOrFilters;
  }

  private evaluateFilter(row: T, filter: AdvancedFilter): boolean {
    const value = this.getFieldValue(row, filter.columnId);
    const filterValue = filter.value;
    const filterValue2 = filter.value2;

    if (value == null && filter.operator !== 'isEmpty' && filter.operator !== 'isNotEmpty') {
      return false;
    }

    switch (filter.operator) {
      case 'equals':
        return this.compareValues(value, filterValue, 'equals', filter.caseSensitive);
      
      case 'contains':
        return this.compareValues(value, filterValue, 'contains', filter.caseSensitive);
      
      case 'startsWith':
        return this.compareValues(value, filterValue, 'startsWith', filter.caseSensitive);
      
      case 'endsWith':
        return this.compareValues(value, filterValue, 'endsWith', filter.caseSensitive);
      
      case 'greaterThan':
        return this.compareNumeric(value, filterValue, '>');
      
      case 'lessThan':
        return this.compareNumeric(value, filterValue, '<');
      
      case 'between':
        return this.compareNumeric(value, filterValue, '>=') && 
               this.compareNumeric(value, filterValue2, '<=');
      
      case 'in':
        return Array.isArray(filterValue) && 
               filterValue.some(v => this.compareValues(value, v, 'equals', filter.caseSensitive));
      
      case 'notIn':
        return !Array.isArray(filterValue) || 
               !filterValue.some(v => this.compareValues(value, v, 'equals', filter.caseSensitive));
      
      case 'isEmpty':
        return value == null || value === '' || 
               (Array.isArray(value) && value.length === 0);
      
      case 'isNotEmpty':
        return value != null && value !== '' && 
               (!Array.isArray(value) || value.length > 0);
      
      case 'regex':
        try {
          const regex = new RegExp(filterValue, filter.caseSensitive ? 'g' : 'gi');
          return regex.test(String(value));
        } catch {
          return false;
        }
      
      default:
        return true;
    }
  }

  private evaluateGlobalSearch(
    row: T, 
    searchTerm: string, 
    columns: { id: string; accessor?: any }[], 
    config: GlobalSearchConfig
  ): boolean {
    const searchColumns = config.searchableColumns?.length 
      ? columns.filter(col => config.searchableColumns!.includes(col.id))
      : columns;

    const searchLower = searchTerm.toLowerCase();

    return searchColumns.some(column => {
      const value = this.getFieldValue(row, column.id);
      if (value == null) return false;
      
      const stringValue = String(value).toLowerCase();
      return stringValue.includes(searchLower);
    });
  }

  private compareValues(
    value: any, 
    filterValue: any, 
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith',
    caseSensitive?: boolean
  ): boolean {
    const valueStr = String(value);
    const filterStr = String(filterValue);
    
    const compareValue = caseSensitive ? valueStr : valueStr.toLowerCase();
    const compareFilter = caseSensitive ? filterStr : filterStr.toLowerCase();

    switch (operator) {
      case 'equals':
        return compareValue === compareFilter;
      case 'contains':
        return compareValue.includes(compareFilter);
      case 'startsWith':
        return compareValue.startsWith(compareFilter);
      case 'endsWith':
        return compareValue.endsWith(compareFilter);
      default:
        return false;
    }
  }

  private compareNumeric(value: any, filterValue: any, operator: '>' | '<' | '>=' | '<='): boolean {
    const numValue = Number(value);
    const numFilter = Number(filterValue);
    
    if (isNaN(numValue) || isNaN(numFilter)) return false;

    switch (operator) {
      case '>':
        return numValue > numFilter;
      case '<':
        return numValue < numFilter;
      case '>=':
        return numValue >= numFilter;
      case '<=':
        return numValue <= numFilter;
      default:
        return false;
    }
  }

  private getFieldValue(row: T, fieldPath: string): any {
    return (row as any)[fieldPath];
  }

  // Filter Presets
  saveFilterPreset(name: string, description?: string): FilterPreset {
    const preset: FilterPreset = {
      id: this.generateId(),
      name,
      description,
      filters: [...this._advancedFilters()],
      global: this._globalSearch(),
      createdAt: new Date()
    };

    const presets = [...this._filterPresets(), preset];
    this._filterPresets.set(presets);
    
    return preset;
  }

  loadFilterPreset(presetId: string) {
    const preset = this._filterPresets().find(p => p.id === presetId);
    if (!preset) return;

    this._advancedFilters.set([...preset.filters]);
    this._globalSearch.set(preset.global || '');
    this._globalSearchSubject.next(preset.global || '');
    
    this._presetLoaded.next(preset);
  }

  deleteFilterPreset(presetId: string) {
    const presets = this._filterPresets().filter(p => p.id !== presetId);
    this._filterPresets.set(presets);
  }

  updateFilterPreset(presetId: string, updates: Partial<FilterPreset>) {
    const presets = this._filterPresets().map(p => 
      p.id === presetId ? { ...p, ...updates } : p
    );
    this._filterPresets.set(presets);
  }

  setDefaultPreset(presetId: string) {
    const presets = this._filterPresets().map(p => ({
      ...p,
      isDefault: p.id === presetId
    }));
    this._filterPresets.set(presets);
  }

  getDefaultPreset(): FilterPreset | undefined {
    return this._filterPresets().find(p => p.isDefault);
  }

  // Filter Suggestions
  getFilterSuggestions(
    columnId: string, 
    data: T[], 
    query?: string, 
    maxSuggestions = 10
  ): FilterSuggestion[] {
    const values = data
      .map(row => this.getFieldValue(row, columnId))
      .filter(value => value != null);

    // Count occurrences
    const valueCounts = new Map<string, number>();
    values.forEach(value => {
      const key = String(value);
      valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
    });

    // Convert to suggestions
    let suggestions: FilterSuggestion[] = Array.from(valueCounts.entries())
      .map(([value, count]) => ({
        value: this.parseValue(value),
        label: value,
        count,
        type: this.detectValueType(value) as FilterSuggestion['type']
      }))
      .sort((a, b) => b.count - a.count);

    // Filter by query if provided
    if (query) {
      const queryLower = query.toLowerCase();
      suggestions = suggestions.filter(s => 
        s.label.toLowerCase().includes(queryLower)
      );
    }

    return suggestions.slice(0, maxSuggestions);
  }

  private parseValue(value: string): any {
    // Try to parse as number
    const num = Number(value);
    if (!isNaN(num) && isFinite(num)) {
      return num;
    }

    // Try to parse as boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Try to parse as date
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }

    return value;
  }

  private detectValueType(value: string): string {
    if (!isNaN(Number(value))) return 'value';
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') return 'value';
    if (!isNaN(new Date(value).getTime())) return 'date';
    return 'value';
  }

  // State Management
  exportState() {
    return {
      advancedFilters: this._advancedFilters(),
      filterPresets: this._filterPresets(),
      globalSearch: this._globalSearch(),
      globalSearchConfig: this._globalSearchConfig()
    };
  }

  importState(state: any) {
    if (state.advancedFilters) this._advancedFilters.set(state.advancedFilters);
    if (state.filterPresets) this._filterPresets.set(state.filterPresets);
    if (state.globalSearch) {
      this._globalSearch.set(state.globalSearch);
      this._globalSearchSubject.next(state.globalSearch);
    }
    if (state.globalSearchConfig) this._globalSearchConfig.set(state.globalSearchConfig);
  }

  reset() {
    this._advancedFilters.set([]);
    this._globalSearch.set('');
    this._globalSearchSubject.next('');
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
} 