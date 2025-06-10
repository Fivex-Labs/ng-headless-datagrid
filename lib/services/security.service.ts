import { Injectable, signal, computed } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { 
  SecurityConfig, 
  FieldPermission, 
  DataMaskingRule, 
  AuditLogEntry, 
  AuditStorageAdapter 
} from '../interfaces/advanced-grid.interface';

@Injectable()
export class SecurityService<T = any> {
  private _securityConfig = signal<SecurityConfig>({
    fieldPermissions: [],
    dataMasking: [],
    auditLogging: {
      enabled: false,
      actions: ['view', 'edit', 'delete', 'export']
    }
  });
  private _currentUser = signal<any>(null);
  private _auditSubject = new Subject<AuditLogEntry>();

  // Observables
  auditLog$ = this._auditSubject.asObservable();

  // Computed properties
  securityConfig = computed(() => this._securityConfig());
  currentUser = computed(() => this._currentUser());

  constructor() {}

  // ===== INITIALIZATION =====
  
  initialize(config: SecurityConfig, currentUser?: any) {
    this._securityConfig.set(config);
    if (currentUser) {
      this._currentUser.set(currentUser);
    }
  }

  setCurrentUser(user: any) {
    this._currentUser.set(user);
  }

  // ===== FIELD PERMISSIONS =====

  canReadField(columnId: string, rowData?: T): boolean {
    const permission = this.getFieldPermission(columnId);
    if (!permission) return true;

    return this.hasPermission(permission, 'read', rowData);
  }

  canWriteField(columnId: string, rowData?: T): boolean {
    const permission = this.getFieldPermission(columnId);
    if (!permission) return true;

    return this.hasPermission(permission, 'write', rowData);
  }

  canExportField(columnId: string, rowData?: T): boolean {
    const permission = this.getFieldPermission(columnId);
    if (!permission) return true;

    return this.hasPermission(permission, 'export', rowData);
  }

  private getFieldPermission(columnId: string): FieldPermission | undefined {
    const config = this._securityConfig();
    return config.fieldPermissions?.find(p => p.columnId === columnId);
  }

  private hasPermission(
    permission: FieldPermission, 
    action: 'read' | 'write' | 'export', 
    rowData?: T
  ): boolean {
    const user = this._currentUser();
    if (!user) return false;

    // Check if action is allowed
    if (!permission.permissions.includes(action)) {
      return false;
    }

    // Check role-based permissions
    if (permission.roles?.length) {
      const userRoles = user.roles || [];
      const hasRole = permission.roles.some(role => userRoles.includes(role));
      if (!hasRole) return false;
    }

    // Check user-based permissions
    if (permission.users?.length) {
      const userId = user.id || user.userId;
      if (!permission.users.includes(userId)) return false;
    }

    // Check conditional permissions
    if (permission.condition && rowData) {
      return permission.condition(user, rowData);
    }

    return true;
  }

  // ===== DATA MASKING =====

  maskFieldValue(columnId: string, value: any, rowData?: T): any {
    const maskingRule = this.getDataMaskingRule(columnId);
    if (!maskingRule) return value;

    const user = this._currentUser();
    
    // Check if masking condition applies
    if (maskingRule.condition && rowData) {
      if (!maskingRule.condition(user, rowData)) {
        return value; // Don't mask if condition is false
      }
    }

    return this.applyMasking(value, maskingRule);
  }

  private getDataMaskingRule(columnId: string): DataMaskingRule | undefined {
    const config = this._securityConfig();
    return config.dataMasking?.find(rule => rule.columnId === columnId);
  }

  private applyMasking(value: any, rule: DataMaskingRule): any {
    if (value == null) return value;

    const stringValue = String(value);

    switch (rule.maskType) {
      case 'full':
        return rule.maskChar?.repeat(stringValue.length) || '*'.repeat(stringValue.length);

      case 'partial':
        const visibleChars = rule.visibleChars || 4;
        const maskChar = rule.maskChar || '*';
        
        if (stringValue.length <= visibleChars) {
          return maskChar.repeat(stringValue.length);
        }
        
        const start = stringValue.substring(0, Math.floor(visibleChars / 2));
        const end = stringValue.substring(stringValue.length - Math.floor(visibleChars / 2));
        const maskLength = stringValue.length - visibleChars;
        
        return start + maskChar.repeat(maskLength) + end;

      case 'custom':
        if (rule.pattern) {
          return this.applyCustomPattern(stringValue, rule.pattern);
        }
        return stringValue;

      default:
        return value;
    }
  }

  private applyCustomPattern(value: string, pattern: string): string {
    let result = '';
    let valueIndex = 0;

    for (let i = 0; i < pattern.length && valueIndex < value.length; i++) {
      const patternChar = pattern[i];
      
      if (patternChar === '*') {
        result += '*';
        valueIndex++;
      } else if (patternChar === '#') {
        result += value[valueIndex];
        valueIndex++;
      } else {
        result += patternChar;
      }
    }

    return result;
  }

  // ===== AUDIT LOGGING =====

  logAction(
    action: AuditLogEntry['action'], 
    resource: string, 
    resourceId?: string, 
    details?: Record<string, any>
  ) {
    const config = this._securityConfig();
    
    if (!config.auditLogging?.enabled) return;
    if (!config.auditLogging.actions.includes(action)) return;

    const user = this._currentUser();
    if (!user) return;

    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      userId: user.id || user.userId || 'unknown',
      action,
      resource,
      resourceId,
      details,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    };

    // Store the audit entry
    this.storeAuditEntry(entry);
    
    // Emit the audit event
    this._auditSubject.next(entry);
  }

  private storeAuditEntry(entry: AuditLogEntry) {
    const config = this._securityConfig();
    const adapter = config.auditLogging?.storageAdapter;

    if (adapter) {
      adapter.store(entry).catch(error => {
        console.error('Failed to store audit entry:', error);
      });
    } else {
      // Default storage to localStorage (for demo purposes)
      this.storeToLocalStorage(entry);
    }
  }

  private storeToLocalStorage(entry: AuditLogEntry) {
    try {
      const existing = localStorage.getItem('grid-audit-log');
      const entries: AuditLogEntry[] = existing ? JSON.parse(existing) : [];
      
      entries.push(entry);
      
      // Keep only last 1000 entries
      if (entries.length > 1000) {
        entries.splice(0, entries.length - 1000);
      }
      
      localStorage.setItem('grid-audit-log', JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to store audit entry to localStorage:', error);
    }
  }

  getAuditLog(params?: {
    userId?: string;
    action?: AuditLogEntry['action'];
    resource?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  }): Observable<AuditLogEntry[]> {
    return new Observable(observer => {
      const config = this._securityConfig();
      const adapter = config.auditLogging?.storageAdapter;

      if (adapter) {
        adapter.query(params || {}).then(entries => {
          observer.next(entries);
          observer.complete();
        }).catch(error => {
          observer.error(error);
        });
      } else {
        // Get from localStorage
        try {
          const existing = localStorage.getItem('grid-audit-log');
          let entries: AuditLogEntry[] = existing ? JSON.parse(existing) : [];
          
          // Apply filters
          if (params) {
            entries = this.filterAuditEntries(entries, params);
          }
          
          observer.next(entries);
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      }
    });
  }

  private filterAuditEntries(
    entries: AuditLogEntry[], 
    params: any
  ): AuditLogEntry[] {
    return entries.filter(entry => {
      if (params.userId && entry.userId !== params.userId) return false;
      if (params.action && entry.action !== params.action) return false;
      if (params.resource && entry.resource !== params.resource) return false;
      
      if (params.dateFrom && new Date(entry.timestamp) < params.dateFrom) return false;
      if (params.dateTo && new Date(entry.timestamp) > params.dateTo) return false;
      
      return true;
    }).slice(0, params.limit || 100);
  }

  // ===== DATA PROCESSING =====

  processRowForSecurity(row: T, columns: string[]): T {
    const processedRow = { ...row };

    columns.forEach(columnId => {
      const fieldValue = (processedRow as any)[columnId];
      
      // Check read permission
      if (!this.canReadField(columnId, row)) {
        (processedRow as any)[columnId] = '[RESTRICTED]';
        return;
      }

      // Apply data masking
      (processedRow as any)[columnId] = this.maskFieldValue(columnId, fieldValue, row);
    });

    return processedRow;
  }

  filterExportableColumns(columns: string[], data?: T[]): string[] {
    return columns.filter(columnId => {
      // Check if any row allows export for this field
      if (data?.length) {
        return data.some(row => this.canExportField(columnId, row));
      }
      return this.canExportField(columnId);
    });
  }

  validateFieldAccess(columnId: string, action: 'read' | 'write' | 'export', rowData?: T): {
    allowed: boolean;
    reason?: string;
  } {
    const permission = this.getFieldPermission(columnId);
    
    if (!permission) {
      return { allowed: true };
    }

    const user = this._currentUser();
    if (!user) {
      return { 
        allowed: false, 
        reason: 'User not authenticated' 
      };
    }

    if (!permission.permissions.includes(action)) {
      return { 
        allowed: false, 
        reason: `Action '${action}' not permitted for field '${columnId}'` 
      };
    }

    if (permission.roles?.length) {
      const userRoles = user.roles || [];
      const hasRole = permission.roles.some(role => userRoles.includes(role));
      if (!hasRole) {
        return { 
          allowed: false, 
          reason: `User does not have required role for field '${columnId}'` 
        };
      }
    }

    if (permission.users?.length) {
      const userId = user.id || user.userId;
      if (!permission.users.includes(userId)) {
        return { 
          allowed: false, 
          reason: `User not authorized for field '${columnId}'` 
        };
      }
    }

    if (permission.condition && rowData && !permission.condition(user, rowData)) {
      return { 
        allowed: false, 
        reason: `Conditional access denied for field '${columnId}'` 
      };
    }

    return { allowed: true };
  }

  // ===== UTILITY METHODS =====

  private getClientIP(): string {
    // This is a simplified implementation
    // In a real application, you'd get this from the server
    return 'unknown';
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // ===== STATE MANAGEMENT =====

  exportState() {
    return {
      securityConfig: this._securityConfig(),
      currentUser: this._currentUser()
    };
  }

  importState(state: any) {
    if (state.securityConfig) this._securityConfig.set(state.securityConfig);
    if (state.currentUser) this._currentUser.set(state.currentUser);
  }

  updateSecurityConfig(updates: Partial<SecurityConfig>) {
    this._securityConfig.update(current => ({ ...current, ...updates }));
  }
} 