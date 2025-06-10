import { Component } from '@angular/core';

@Component({
  selector: 'hd-ng-headless-datagrid',
  imports: [],
  template: `
    <p>
      ng-headless-datagrid works!
    </p>
  `,
  styles: ``
})
export class NgHeadlessDatagrid {

}

export * from './interfaces/grid.interface';
export * from './services/grid-state.service';
export * from './services/virtualization.service';
export * from './directives/ng-grid.directive';
export * from './directives/grid-utilities.directive';
