import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { 
  ExportConfig, 
  ExportResult, 
  ImportConfig, 
  ImportResult, 
  ImportValidationRule,
  ImportError,
  ImportWarning
} from '../interfaces/advanced-grid.interface';

// Note: For production use, you'd want to install proper libraries:
// - xlsx for Excel support
// - jspdf for PDF generation
// - csv-parser for robust CSV parsing

@Injectable()
export class ExportImportService<T = any> {
  
  // ===== EXPORT FUNCTIONALITY =====
  
  export(data: T[], config: ExportConfig): Observable<ExportResult> {
    try {
      switch (config.format) {
        case 'csv':
          return this.exportToCsv(data, config);
        case 'json':
          return this.exportToJson(data, config);
        case 'excel':
          return this.exportToExcel(data, config);
        case 'pdf':
          return this.exportToPdf(data, config);
        case 'xml':
          return this.exportToXml(data, config);
        default:
          return throwError(() => new Error(`Unsupported export format: ${config.format}`));
      }
    } catch (error) {
      return throwError(() => error);
    }
  }

  private exportToCsv(data: T[], config: ExportConfig): Observable<ExportResult> {
    try {
      const columns = this.getExportColumns(data, config);
      const headers = config.includeHeaders !== false ? 
        columns.map(col => this.escapeCSV(col)) : [];
      
      const rows = data.map(item => 
        columns.map(col => {
          const value = this.getFieldValue(item, col);
          return this.escapeCSV(this.formatValue(value, config));
        })
      );

      const csvContent = [
        ...(headers.length > 0 ? [headers.join(',')] : []),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });

      const result: ExportResult = {
        success: true,
        data: blob,
        downloadUrl: this.createDownloadUrl(blob, config.filename || 'export.csv')
      };

      return of(result);
    } catch (error) {
      return of({
        success: false,
        error: error instanceof Error ? error.message : 'CSV export failed'
      });
    }
  }

  private exportToJson(data: T[], config: ExportConfig): Observable<ExportResult> {
    try {
      const exportData = config.columns?.length
        ? data.map(item => this.filterObjectByColumns(item, config.columns!))
        : data;

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { 
        type: 'application/json' 
      });

      const result: ExportResult = {
        success: true,
        data: blob,
        downloadUrl: this.createDownloadUrl(blob, config.filename || 'export.json')
      };

      return of(result);
    } catch (error) {
      return of({
        success: false,
        error: error instanceof Error ? error.message : 'JSON export failed'
      });
    }
  }

  private exportToExcel(data: T[], config: ExportConfig): Observable<ExportResult> {
    // This is a simplified implementation
    // For production, use libraries like 'xlsx' or 'exceljs'
    try {
      console.warn('Excel export requires xlsx library. Falling back to CSV format.');
      return this.exportToCsv(data, { ...config, format: 'csv' });
    } catch (error) {
      return of({
        success: false,
        error: 'Excel export not implemented. Install xlsx library for full support.'
      });
    }
  }

  private exportToPdf(data: T[], config: ExportConfig): Observable<ExportResult> {
    // This is a simplified implementation
    // For production, use libraries like 'jspdf' with 'jspdf-autotable'
    try {
      console.warn('PDF export requires jsPDF library. Falling back to JSON format.');
      return this.exportToJson(data, { ...config, format: 'json' });
    } catch (error) {
      return of({
        success: false,
        error: 'PDF export not implemented. Install jsPDF library for full support.'
      });
    }
  }

  private exportToXml(data: T[], config: ExportConfig): Observable<ExportResult> {
    try {
      const xmlContent = this.convertToXml(data, config);
      const blob = new Blob([xmlContent], { 
        type: 'application/xml' 
      });

      const result: ExportResult = {
        success: true,
        data: blob,
        downloadUrl: this.createDownloadUrl(blob, config.filename || 'export.xml')
      };

      return of(result);
    } catch (error) {
      return of({
        success: false,
        error: error instanceof Error ? error.message : 'XML export failed'
      });
    }
  }

  private convertToXml(data: T[], config: ExportConfig): string {
    const indent = '  ';
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n';
    
    data.forEach(item => {
      xml += `${indent}<item>\n`;
      
      const columns = config.columns || Object.keys(item as any);
      columns.forEach(col => {
        const value = this.getFieldValue(item, col);
        const escapedValue = this.escapeXml(String(value || ''));
        xml += `${indent}${indent}<${col}>${escapedValue}</${col}>\n`;
      });
      
      xml += `${indent}</item>\n`;
    });
    
    xml += '</data>';
    return xml;
  }

  // ===== IMPORT FUNCTIONALITY =====

  import(file: File, config: ImportConfig): Observable<ImportResult<T>> {
    return new Observable(observer => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          let result: ImportResult<T>;

          switch (config.format) {
            case 'csv':
              result = this.importFromCsv(content, config);
              break;
            case 'json':
              result = this.importFromJson(content, config);
              break;
            case 'xml':
              result = this.importFromXml(content, config);
              break;
            case 'excel':
              result = {
                success: false,
                errors: [{ row: 0, message: 'Excel import requires xlsx library' }]
              };
              break;
            default:
              result = {
                success: false,
                errors: [{ row: 0, message: `Unsupported format: ${config.format}` }]
              };
          }

          observer.next(result);
          observer.complete();
        } catch (error) {
          observer.next({
            success: false,
            errors: [{ 
              row: 0, 
              message: error instanceof Error ? error.message : 'Import failed' 
            }]
          });
          observer.complete();
        }
      };

      reader.onerror = () => {
        observer.next({
          success: false,
          errors: [{ row: 0, message: 'Failed to read file' }]
        });
        observer.complete();
      };

      reader.readAsText(file, config.encoding || 'UTF-8');
    });
  }

  private importFromCsv(content: string, config: ImportConfig): ImportResult<T> {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];
    const data: T[] = [];

    if (lines.length === 0) {
      return {
        success: false,
        errors: [{ row: 0, message: 'Empty file' }],
        totalRows: 0,
        validRows: 0
      };
    }

    const delimiter = config.delimiter || ',';
    let headers: string[] = [];
    let startRow = 0;

    // Parse headers
    if (config.hasHeaders !== false) {
      headers = this.parseCsvRow(lines[0], delimiter);
      startRow = 1;
    } else {
      // Generate default headers
      const firstRow = this.parseCsvRow(lines[0], delimiter);
      headers = firstRow.map((_, index) => `Column${index + 1}`);
    }

    // Parse data rows
    for (let i = startRow; i < lines.length; i++) {
      const rowData = this.parseCsvRow(lines[i], delimiter);
      const rowIndex = i + 1;

      if (rowData.length !== headers.length) {
        warnings.push({
          row: rowIndex,
          message: `Column count mismatch. Expected ${headers.length}, got ${rowData.length}`
        });
      }

      const item: any = {};
      
      // Map columns
      headers.forEach((header, index) => {
        const value = rowData[index] || '';
        const mappedColumn = config.columnMapping?.[header] || header;
        item[mappedColumn] = this.parseValue(value);
      });

      // Validate row
      const validationResult = this.validateRow(item, config.validation || [], rowIndex);
      errors.push(...validationResult.errors);
      warnings.push(...validationResult.warnings);

      if (validationResult.isValid) {
        data.push(item);
      }
    }

    return {
      success: errors.length === 0,
      data,
      errors,
      warnings,
      totalRows: lines.length - startRow,
      validRows: data.length
    };
  }

  private importFromJson(content: string, config: ImportConfig): ImportResult<T> {
    try {
      const jsonData = JSON.parse(content);
      const errors: ImportError[] = [];
      const warnings: ImportWarning[] = [];
      const data: T[] = [];

      if (!Array.isArray(jsonData)) {
        return {
          success: false,
          errors: [{ row: 0, message: 'JSON must contain an array of objects' }],
          totalRows: 0,
          validRows: 0
        };
      }

      jsonData.forEach((item, index) => {
        const rowIndex = index + 1;
        
        // Apply column mapping
        if (config.columnMapping) {
          const mappedItem: any = {};
          Object.entries(config.columnMapping).forEach(([original, mapped]) => {
            if (item.hasOwnProperty(original)) {
              mappedItem[mapped] = item[original];
            }
          });
          item = { ...item, ...mappedItem };
        }

        // Validate row
        const validationResult = this.validateRow(item, config.validation || [], rowIndex);
        errors.push(...validationResult.errors);
        warnings.push(...validationResult.warnings);

        if (validationResult.isValid) {
          data.push(item);
        }
      });

      return {
        success: errors.length === 0,
        data,
        errors,
        warnings,
        totalRows: jsonData.length,
        validRows: data.length
      };
    } catch (error) {
      return {
        success: false,
        errors: [{ 
          row: 0, 
          message: `Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}` 
        }],
        totalRows: 0,
        validRows: 0
      };
    }
  }

  private importFromXml(content: string, config: ImportConfig): ImportResult<T> {
    // Basic XML parsing - for production use DOMParser or xml2js
    try {
      const errors: ImportError[] = [];
      const warnings: ImportWarning[] = [];
      const data: T[] = [];

      // Simple regex-based XML parsing (not robust for complex XML)
      const itemMatches = content.match(/<item[^>]*>([\s\S]*?)<\/item>/g);
      
      if (!itemMatches) {
        return {
          success: false,
          errors: [{ row: 0, message: 'No <item> elements found in XML' }],
          totalRows: 0,
          validRows: 0
        };
      }

      itemMatches.forEach((itemXml, index) => {
        const rowIndex = index + 1;
        const item: any = {};

        // Extract field values
        const fieldMatches = itemXml.match(/<(\w+)>(.*?)<\/\1>/g);
        if (fieldMatches) {
          fieldMatches.forEach(fieldXml => {
            const match = fieldXml.match(/<(\w+)>(.*?)<\/\1>/);
            if (match) {
              const [, fieldName, fieldValue] = match;
              const mappedColumn = config.columnMapping?.[fieldName] || fieldName;
              item[mappedColumn] = this.parseValue(this.unescapeXml(fieldValue));
            }
          });
        }

        // Validate row
        const validationResult = this.validateRow(item, config.validation || [], rowIndex);
        errors.push(...validationResult.errors);
        warnings.push(...validationResult.warnings);

        if (validationResult.isValid) {
          data.push(item);
        }
      });

      return {
        success: errors.length === 0,
        data,
        errors,
        warnings,
        totalRows: itemMatches.length,
        validRows: data.length
      };
    } catch (error) {
      return {
        success: false,
        errors: [{ 
          row: 0, 
          message: `XML parsing error: ${error instanceof Error ? error.message : 'Parse error'}` 
        }],
        totalRows: 0,
        validRows: 0
      };
    }
  }

  // ===== VALIDATION =====

  private validateRow(
    item: any, 
    rules: ImportValidationRule[], 
    rowIndex: number
  ): { isValid: boolean; errors: ImportError[]; warnings: ImportWarning[] } {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];

    rules.forEach(rule => {
      const value = item[rule.column];
      
      // Required check
      if (rule.required && (value == null || value === '')) {
        errors.push({
          row: rowIndex,
          column: rule.column,
          message: `${rule.column} is required`,
          value
        });
        return;
      }

      // Skip further validation if value is empty and not required
      if (value == null || value === '') return;

      // Type validation
      if (rule.type) {
        const isValidType = this.validateType(value, rule.type);
        if (!isValidType) {
          errors.push({
            row: rowIndex,
            column: rule.column,
            message: `${rule.column} must be of type ${rule.type}`,
            value
          });
          return;
        }
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string') {
        if (!rule.pattern.test(value)) {
          errors.push({
            row: rowIndex,
            column: rule.column,
            message: `${rule.column} does not match required pattern`,
            value
          });
        }
      }

      // Min/Max validation for numbers
      if (rule.type === 'number' && typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push({
            row: rowIndex,
            column: rule.column,
            message: `${rule.column} must be at least ${rule.min}`,
            value
          });
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push({
            row: rowIndex,
            column: rule.column,
            message: `${rule.column} must be at most ${rule.max}`,
            value
          });
        }
      }

      // Custom validation
      if (rule.customValidator) {
        const result = rule.customValidator(value);
        if (result !== true) {
          const message = typeof result === 'string' ? result : `${rule.column} failed custom validation`;
          errors.push({
            row: rowIndex,
            column: rule.column,
            message,
            value
          });
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateType(value: any, type: 'string' | 'number' | 'date' | 'boolean'): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'date':
        return value instanceof Date || !isNaN(new Date(value).getTime());
      case 'boolean':
        return typeof value === 'boolean';
      default:
        return true;
    }
  }

  // ===== UTILITY METHODS =====

  private getExportColumns(data: T[], config: ExportConfig): string[] {
    if (config.columns?.length) {
      return config.columns;
    }
    
    if (data.length === 0) {
      return [];
    }

    return Object.keys(data[0] as any);
  }

  private getFieldValue(item: T, field: string): any {
    return (item as any)[field];
  }

  private filterObjectByColumns(obj: T, columns: string[]): Partial<T> {
    const filtered: any = {};
    columns.forEach(col => {
      if ((obj as any).hasOwnProperty(col)) {
        filtered[col] = (obj as any)[col];
      }
    });
    return filtered;
  }

  private formatValue(value: any, config: ExportConfig): string {
    if (value == null) return '';
    
    if (value instanceof Date) {
      return config.dateFormat 
        ? this.formatDate(value, config.dateFormat)
        : value.toISOString();
    }
    
    return String(value);
  }

  private formatDate(date: Date, format: string): string {
    // Simple date formatting - for production use date-fns or moment.js
    return format
      .replace('YYYY', date.getFullYear().toString())
      .replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
      .replace('DD', date.getDate().toString().padStart(2, '0'))
      .replace('HH', date.getHours().toString().padStart(2, '0'))
      .replace('mm', date.getMinutes().toString().padStart(2, '0'))
      .replace('ss', date.getSeconds().toString().padStart(2, '0'));
  }

  private parseCsvRow(row: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < row.length) {
      const char = row[i];
      
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private parseValue(value: string): any {
    // Try to parse as number
    const num = Number(value);
    if (!isNaN(num) && isFinite(num) && value.trim() !== '') {
      return num;
    }

    // Try to parse as boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Try to parse as date
    if (!isNaN(Date.parse(value))) {
      return new Date(value);
    }

    return value;
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private unescapeXml(value: string): string {
    return value
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
  }

  private createDownloadUrl(blob: Blob, filename: string): string {
    const url = window.URL.createObjectURL(blob);
    
    // Auto-download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return url;
  }

  // Clean up blob URLs to prevent memory leaks
  cleanupDownloadUrl(url: string) {
    window.URL.revokeObjectURL(url);
  }
} 