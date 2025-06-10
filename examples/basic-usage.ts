import { Component } from '@angular/core';
import { NgGridDirective } from '@fivexlabs/ng-headless-datagrid';
import { CommonModule } from '@angular/common';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

@Component({
  selector: 'app-basic-grid-example',
  standalone: true,
  imports: [CommonModule, NgGridDirective],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-4">Basic Headless Data Grid Example</h2>
      
      <div *ngGrid="let grid of users; columns: columnDefs; options: gridOptions" 
           class="bg-white shadow-lg rounded-lg overflow-hidden">
        
        <!-- Filter Controls -->
        <div class="p-4 bg-gray-50 border-b">
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text"
                     [value]="grid.getFilterValue('name')"
                     (input)="grid.setFilter('name', $event.target.value)"
                     placeholder="Filter by name..."
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select [value]="grid.getFilterValue('role')"
                      (change)="grid.setFilter('role', $event.target.value)"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="User">User</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select [value]="grid.getFilterValue('status')"
                      (change)="grid.setFilter('status', $event.target.value)"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Data Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th *ngFor="let col of grid.columns"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    (click)="grid.sortBy(col.id)">
                  <div class="flex items-center space-x-1">
                    <span>{{ col.header }}</span>
                    <span class="text-gray-400">
                      <ng-container [ngSwitch]="grid.getSortDirection(col.id)">
                        <span *ngSwitchCase="'asc'" class="text-blue-500">↑</span>
                        <span *ngSwitchCase="'desc'" class="text-blue-500">↓</span>
                        <span *ngSwitchDefault>↕</span>
                      </ng-container>
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let row of grid.rows; trackBy: trackByUserId"
                  class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ row.data.name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ row.data.email }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                        [class.bg-blue-100]="row.data.role === 'Admin'"
                        [class.text-blue-800]="row.data.role === 'Admin'"
                        [class.bg-green-100]="row.data.role === 'User'"
                        [class.text-green-800]="row.data.role === 'User'"
                        [class.bg-purple-100]="row.data.role === 'Manager'"
                        [class.text-purple-800]="row.data.role === 'Manager'">
                    {{ row.data.role }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                        [class.bg-green-100]="row.data.status === 'active'"
                        [class.text-green-800]="row.data.status === 'active'"
                        [class.bg-red-100]="row.data.status === 'inactive'"
                        [class.text-red-800]="row.data.status === 'inactive'">
                    {{ row.data.status | titlecase }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ row.data.createdAt | date:'short' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Showing 
            <span class="font-medium">{{ getStartIndex(grid.pagination) }}</span>
            to 
            <span class="font-medium">{{ getEndIndex(grid.pagination) }}</span>
            of 
            <span class="font-medium">{{ grid.pagination.totalItems }}</span>
            results
          </div>
          
          <div class="flex items-center space-x-2">
            <button (click)="grid.setPage(grid.pagination.currentPage - 1)"
                    [disabled]="grid.pagination.currentPage === 1"
                    class="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            
            <div class="flex space-x-1">
              <button *ngFor="let page of getVisiblePages(grid.pagination)"
                      (click)="grid.setPage(page)"
                      [class.bg-blue-500]="page === grid.pagination.currentPage"
                      [class.text-white]="page === grid.pagination.currentPage"
                      [class.border-blue-500]="page === grid.pagination.currentPage"
                      class="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                {{ page }}
              </button>
            </div>
            
            <button (click)="grid.setPage(grid.pagination.currentPage + 1)"
                    [disabled]="grid.pagination.currentPage === grid.pagination.totalPages"
                    class="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BasicGridExampleComponent {
  users: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active', createdAt: new Date('2023-01-15') },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active', createdAt: new Date('2023-02-20') },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'Manager', status: 'inactive', createdAt: new Date('2023-03-10') },
    { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', role: 'User', status: 'active', createdAt: new Date('2023-04-05') },
    { id: 5, name: 'David Brown', email: 'david@example.com', role: 'Admin', status: 'active', createdAt: new Date('2023-05-12') },
    { id: 6, name: 'Lisa Davis', email: 'lisa@example.com', role: 'Manager', status: 'inactive', createdAt: new Date('2023-06-18') },
    { id: 7, name: 'Tom Anderson', email: 'tom@example.com', role: 'User', status: 'active', createdAt: new Date('2023-07-22') },
    { id: 8, name: 'Emily Taylor', email: 'emily@example.com', role: 'User', status: 'active', createdAt: new Date('2023-08-30') },
    { id: 9, name: 'Chris Martin', email: 'chris@example.com', role: 'Manager', status: 'active', createdAt: new Date('2023-09-14') },
    { id: 10, name: 'Anna Garcia', email: 'anna@example.com', role: 'Admin', status: 'inactive', createdAt: new Date('2023-10-08') },
    // Add more sample data...
    { id: 11, name: 'Robert Lee', email: 'robert@example.com', role: 'User', status: 'active', createdAt: new Date('2023-11-03') },
    { id: 12, name: 'Michelle White', email: 'michelle@example.com', role: 'Manager', status: 'active', createdAt: new Date('2023-12-01') },
  ];

  columnDefs = [
    { id: 'name', header: 'Full Name', sortable: true, filterable: true },
    { id: 'email', header: 'Email Address', sortable: true, filterable: true },
    { id: 'role', header: 'Role', sortable: true, filterable: true },
    { id: 'status', header: 'Status', sortable: true, filterable: true },
    { id: 'createdAt', header: 'Created Date', sortable: true }
  ];

  gridOptions = {
    enableSorting: true,
    enableFiltering: true,
    enablePagination: true,
    pageSize: 5,
    multiSort: false,
    debounceMs: 300
  };

  trackByUserId(index: number, row: any): number {
    return row.id;
  }

  getStartIndex(pagination: any): number {
    return (pagination.currentPage - 1) * pagination.pageSize + 1;
  }

  getEndIndex(pagination: any): number {
    return Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems);
  }

  getVisiblePages(pagination: any): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const current = pagination.currentPage;
    const total = pagination.totalPages;

    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }
} 