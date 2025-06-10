import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, Subject, interval, of, throwError, merge } from 'rxjs';
import { 
  map, 
  catchError, 
  retry, 
  timeout, 
  debounceTime, 
  distinctUntilChanged,
  switchMap,
  tap,
  shareReplay
} from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { 
  DataSourceAdapter, 
  DataSourceParams, 
  DataSourceResult, 
  RemoteDataConfig,
  WebSocketConfig,
  InfiniteScrollConfig 
} from '../interfaces/advanced-grid.interface';

// ===== Remote HTTP Data Source =====
export class RemoteDataSourceAdapter<T = any> implements DataSourceAdapter<T> {
  private cache = new Map<string, { data: DataSourceResult<T>; timestamp: number }>();
  private loadingSubject = new BehaviorSubject<boolean>(false);
  
  loading$ = this.loadingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private config: RemoteDataConfig
  ) {}

  load(params: DataSourceParams): Observable<DataSourceResult<T>> {
    const cacheKey = this.generateCacheKey(params);
    
    // Check cache first
    if (this.config.cache && this.isCacheValid(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return of(cached.data);
    }

    // Build request
    const url = this.buildUrl(params);
    const headers = new HttpHeaders(this.config.headers || {});
    const httpOptions = { headers };

    this.loadingSubject.next(true);

    let request: Observable<any>;
    
    if (this.config.method === 'POST') {
      request = this.http.post(url, this.buildBody(params), httpOptions);
    } else {
      const httpParams = this.buildParams(params);
      request = this.http.get(url, { ...httpOptions, params: httpParams });
    }

    return request.pipe(
      timeout(this.config.timeout || 30000),
      retry(this.config.retryAttempts || 0),
      map(response => this.transformResponse(response)),
      tap(result => {
        // Cache the result
        if (this.config.cache) {
          this.cache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
          });
        }
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  update?(item: T): Observable<T> {
    const url = `${this.config.endpoint}/${this.getItemId(item)}`;
    const headers = new HttpHeaders(this.config.headers || {});
    
    return this.http.put<T>(url, item, { headers }).pipe(
      tap(() => this.invalidateCache()),
      catchError(error => throwError(() => error))
    );
  }

  delete?(id: string | number): Observable<void> {
    const url = `${this.config.endpoint}/${id}`;
    const headers = new HttpHeaders(this.config.headers || {});
    
    return this.http.delete<void>(url, { headers }).pipe(
      tap(() => this.invalidateCache()),
      catchError(error => throwError(() => error))
    );
  }

  create?(item: Partial<T>): Observable<T> {
    const url = this.config.endpoint;
    const headers = new HttpHeaders(this.config.headers || {});
    
    return this.http.post<T>(url, item, { headers }).pipe(
      tap(() => this.invalidateCache()),
      catchError(error => throwError(() => error))
    );
  }

  clearCache() {
    this.cache.clear();
  }

  invalidateCache() {
    this.cache.clear();
  }

  private buildUrl(params: DataSourceParams): string {
    return this.config.endpoint;
  }

  private buildParams(params: DataSourceParams): HttpParams {
    let httpParams = new HttpParams();

    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.pageSize !== undefined) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    if (params.sort && params.sort.length > 0) {
      httpParams = httpParams.set('sort', JSON.stringify(params.sort));
    }
    if (params.filters && params.filters.length > 0) {
      httpParams = httpParams.set('filters', JSON.stringify(params.filters));
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.columns && params.columns.length > 0) {
      httpParams = httpParams.set('columns', params.columns.join(','));
    }

    return httpParams;
  }

  private buildBody(params: DataSourceParams): any {
    return {
      page: params.page,
      pageSize: params.pageSize,
      sort: params.sort,
      filters: params.filters,
      search: params.search,
      columns: params.columns
    };
  }

  private transformResponse(response: any): DataSourceResult<T> {
    // Adapt response structure - customize based on your API
    if (response.data && response.totalCount !== undefined) {
      return response as DataSourceResult<T>;
    }

    // Handle different response formats
    if (Array.isArray(response)) {
      return {
        data: response,
        totalCount: response.length
      };
    }

    // Default transformation
    return {
      data: response.items || response.data || [],
      totalCount: response.total || response.totalCount || 0,
      page: response.page,
      pageSize: response.pageSize,
      aggregations: response.aggregations
    };
  }

  private generateCacheKey(params: DataSourceParams): string {
    return JSON.stringify(params);
  }

  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;

    const ttl = this.config.cacheTTL || 5 * 60 * 1000; // 5 minutes default
    return (Date.now() - cached.timestamp) < ttl;
  }

  private getItemId(item: T): string | number {
    return (item as any).id || (item as any)._id || '';
  }
}

// ===== WebSocket Real-time Data Source =====
export class WebSocketDataSourceAdapter<T = any> implements DataSourceAdapter<T> {
  private ws: WebSocket | null = null;
  private dataSubject = new BehaviorSubject<T[]>([]);
  private connectionSubject = new BehaviorSubject<boolean>(false);
  private messageQueue: any[] = [];
  private reconnectAttempts = 0;
  private reconnectTimer: any;

  data$ = this.dataSubject.asObservable();
  connected$ = this.connectionSubject.asObservable();

  constructor(private config: WebSocketConfig) {
    this.connect();
  }

  load(params: DataSourceParams): Observable<DataSourceResult<T>> {
    // Send parameters to WebSocket for filtering/sorting
    this.sendMessage({
      type: 'load',
      params
    });

    return this.data$.pipe(
      map(data => ({
        data: this.applyParams(data, params),
        totalCount: data.length
      }))
    );
  }

  update?(item: T): Observable<T> {
    return new Observable(observer => {
      this.sendMessage({
        type: 'update',
        data: item
      });

      // Listen for confirmation
      const messageHandler = (event: MessageEvent) => {
        const message = JSON.parse(event.data);
        if (message.type === 'updated' && message.id === this.getItemId(item)) {
          observer.next(message.data);
          observer.complete();
          this.ws?.removeEventListener('message', messageHandler);
        }
      };

      this.ws?.addEventListener('message', messageHandler);
    });
  }

  delete?(id: string | number): Observable<void> {
    return new Observable(observer => {
      this.sendMessage({
        type: 'delete',
        id
      });

      const messageHandler = (event: MessageEvent) => {
        const message = JSON.parse(event.data);
        if (message.type === 'deleted' && message.id === id) {
          observer.next();
          observer.complete();
          this.ws?.removeEventListener('message', messageHandler);
        }
      };

      this.ws?.addEventListener('message', messageHandler);
    });
  }

  create?(item: Partial<T>): Observable<T> {
    return new Observable(observer => {
      this.sendMessage({
        type: 'create',
        data: item
      });

      const messageHandler = (event: MessageEvent) => {
        const message = JSON.parse(event.data);
        if (message.type === 'created') {
          observer.next(message.data);
          observer.complete();
          this.ws?.removeEventListener('message', messageHandler);
        }
      };

      this.ws?.addEventListener('message', messageHandler);
    });
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.config.url, this.config.protocols);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.connectionSubject.next(true);
        this.reconnectAttempts = 0;
        
        // Send queued messages
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift();
          this.ws?.send(JSON.stringify(message));
        }
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.connectionSubject.next(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connectionSubject.next(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.config.reconnect) return;

    const maxAttempts = this.config.maxReconnectAttempts || 5;
    if (this.reconnectAttempts >= maxAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const interval = this.config.reconnectInterval || 5000;
    this.reconnectTimer = setTimeout(() => {
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts + 1})`);
      this.reconnectAttempts++;
      this.connect();
    }, interval);
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case 'data':
        this.dataSubject.next(message.data);
        break;
      case 'update':
        this.updateItem(message.data);
        break;
      case 'delete':
        this.deleteItem(message.id);
        break;
      case 'create':
        this.addItem(message.data);
        break;
    }
  }

  private sendMessage(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  private updateItem(updatedItem: T) {
    const currentData = this.dataSubject.value;
    const index = currentData.findIndex(item => 
      this.getItemId(item) === this.getItemId(updatedItem)
    );
    
    if (index >= 0) {
      const newData = [...currentData];
      newData[index] = updatedItem;
      this.dataSubject.next(newData);
    }
  }

  private deleteItem(id: string | number) {
    const currentData = this.dataSubject.value;
    const newData = currentData.filter(item => this.getItemId(item) !== id);
    this.dataSubject.next(newData);
  }

  private addItem(newItem: T) {
    const currentData = this.dataSubject.value;
    this.dataSubject.next([...currentData, newItem]);
  }

  private applyParams(data: T[], params: DataSourceParams): T[] {
    let result = [...data];

    // Apply search/filters (basic implementation)
    if (params.search) {
      const search = params.search.toLowerCase();
      result = result.filter(item => 
        JSON.stringify(item).toLowerCase().includes(search)
      );
    }

    // Apply sorting
    if (params.sort && params.sort.length > 0) {
      const sortConfig = params.sort[0];
      result.sort((a, b) => {
        const aVal = (a as any)[sortConfig.field];
        const bVal = (b as any)[sortConfig.field];
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    if (params.page !== undefined && params.pageSize !== undefined) {
      const start = params.page * params.pageSize;
      result = result.slice(start, start + params.pageSize);
    }

    return result;
  }

  private getItemId(item: T): string | number {
    return (item as any).id || (item as any)._id || '';
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.ws?.close();
    this.ws = null;
  }
}

// ===== Infinite Scroll Data Source =====
export class InfiniteScrollDataSourceAdapter<T = any> implements DataSourceAdapter<T> {
  private allData: T[] = [];
  private loadedPages = new Set<number>();
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private hasMoreSubject = new BehaviorSubject<boolean>(true);

  loading$ = this.loadingSubject.asObservable();
  hasMore$ = this.hasMoreSubject.asObservable();

  constructor(
    private baseAdapter: DataSourceAdapter<T>,
    private config: InfiniteScrollConfig
  ) {}

  load(params: DataSourceParams): Observable<DataSourceResult<T>> {
    const page = params.page || 0;
    
    // If we've already loaded this page, return cached data
    if (this.loadedPages.has(page)) {
      const start = page * this.config.pageSize;
      const end = start + this.config.pageSize;
      const pageData = this.allData.slice(start, end);
      
      return of({
        data: pageData,
        totalCount: this.allData.length,
        page,
        pageSize: this.config.pageSize
      });
    }

    // Load new page
    this.loadingSubject.next(true);
    
    const loadParams = {
      ...params,
      page,
      pageSize: this.config.pageSize
    };

    return this.baseAdapter.load(loadParams).pipe(
      tap(result => {
        // Append new data
        const start = page * this.config.pageSize;
        
        // Ensure array is large enough
        while (this.allData.length < start + result.data.length) {
          this.allData.push(undefined as any);
        }
        
        // Insert data at correct position
        result.data.forEach((item, index) => {
          this.allData[start + index] = item;
        });
        
        this.loadedPages.add(page);
        
        // Check if there's more data
        const hasMore = result.data.length === this.config.pageSize;
        this.hasMoreSubject.next(hasMore);
        
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  loadMore(): Observable<DataSourceResult<T>> {
    const nextPage = Math.max(...Array.from(this.loadedPages), -1) + 1;
    return this.load({ page: nextPage, pageSize: this.config.pageSize });
  }

  preloadPages(currentPage: number) {
    const pagesToPreload = this.config.prefetchPages || 1;
    
    for (let i = 1; i <= pagesToPreload; i++) {
      const pageToLoad = currentPage + i;
      if (!this.loadedPages.has(pageToLoad) && this.hasMoreSubject.value) {
        this.load({ page: pageToLoad, pageSize: this.config.pageSize }).subscribe();
      }
    }
  }

  reset() {
    this.allData = [];
    this.loadedPages.clear();
    this.hasMoreSubject.next(true);
  }

  update?(item: T): Observable<T> {
    return this.baseAdapter.update!(item).pipe(
      tap(updatedItem => {
        // Update in cache
        const index = this.allData.findIndex(cached => 
          this.getItemId(cached) === this.getItemId(updatedItem)
        );
        if (index >= 0) {
          this.allData[index] = updatedItem;
        }
      })
    );
  }

  delete?(id: string | number): Observable<void> {
    return this.baseAdapter.delete!(id).pipe(
      tap(() => {
        // Remove from cache
        const index = this.allData.findIndex(item => 
          this.getItemId(item) === id
        );
        if (index >= 0) {
          this.allData.splice(index, 1);
        }
      })
    );
  }

  create?(item: Partial<T>): Observable<T> {
    return this.baseAdapter.create!(item).pipe(
      tap(newItem => {
        // Add to cache
        this.allData.unshift(newItem);
      })
    );
  }

  private getItemId(item: T): string | number {
    return (item as any).id || (item as any)._id || '';
  }
} 