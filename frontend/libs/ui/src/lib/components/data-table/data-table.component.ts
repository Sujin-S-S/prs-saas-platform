import { Component, Input, Output, EventEmitter, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'currency' | 'date' | 'badge' | 'actions';
}

@Component({
  selector: 'ui-data-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="table-container mat-elevation-z1">
      <table mat-table [dataSource]="dataSource" matSort (matSortChange)="onSortChange($event)">
        <!-- Dynamic Columns -->
        <ng-container *ngFor="let col of columns" [matColumnDef]="col.key">
          <!-- Header Cell -->
          <th mat-header-cell *matHeaderCellDef 
              [mat-sort-header]="col.key" 
              [disabled]="!col.sortable">
            {{ col.label }}
          </th>
          
          <!-- Data Cell -->
          <td mat-cell *matCellDef="let element">
            <ng-container [ngSwitch]="col.type">
              <!-- Currency Formatting -->
              <span *ngSwitchCase="'currency'">
                {{ element[col.key] | currency }}
              </span>
              
              <!-- Date Formatting -->
              <span *ngSwitchCase="'date'">
                {{ element[col.key] | date:'short' }}
              </span>
              
              <!-- Badge Formatting -->
              <span *ngSwitchCase="'badge'" 
                    class="badge" 
                    [ngClass]="getBadgeClass(element[col.key])">
                {{ element[col.key] }}
              </span>

              <!-- Action Buttons -->
              <div *ngSwitchCase="'actions'" class="action-buttons">
                <button mat-icon-button color="primary" (click)="onEditClick(element, $event)" title="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="onDeleteClick(element, $event)" title="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
              
              <!-- Standard Text -->
              <span *ngSwitchDefault>
                {{ element[col.key] }}
              </span>
            </ng-container>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumnKeys"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumnKeys;"></tr>

        <!-- Row shown when there is no matching data. -->
        <tr class="mat-row no-data-row" *matNoDataRow>
          <td class="mat-cell" [attr.colspan]="columns.length">No data matching filters or records found.</td>
        </tr>
      </table>

      <!-- Paginator -->
      <mat-paginator 
        *ngIf="showPaginator"
        [length]="totalItems"
        [pageSize]="pageSize"
        [pageSizeOptions]="pageSizeOptions"
        [pageIndex]="pageIndex"
        (page)="onPageChange($event)"
        showFirstLastButtons>
      </mat-paginator>
    </div>
  `,
  styles: [`
    .table-container {
      width: 100%;
      overflow-x: auto;
      border-radius: 8px;
      background: white;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      font-weight: 600;
      color: #555;
      font-size: 13px;
      font-family: 'Inter', sans-serif;
    }
    td {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      color: #333;
    }
    .action-buttons {
      display: flex;
      gap: 4px;
    }
    .no-data-row {
      text-align: center;
      height: 60px;
      font-style: italic;
      color: #888;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: capitalize;
    }
    .badge-success { background-color: #e6f4ea; color: #137333; }
    .badge-warning { background-color: #fef7e0; color: #b06000; }
    .badge-danger { background-color: #fce8e6; color: #c5221f; }
    .badge-info { background-color: #e8f0fe; color: #1a73e8; }
    .badge-default { background-color: #f1f3f4; color: #5f6368; }
  `]
})
export class DataTableComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() totalItems = 0;
  @Input() pageSize = 10;
  @Input() pageIndex = 0;
  @Input() pageSizeOptions = [5, 10, 20, 50];
  @Input() showPaginator = true;

  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() page = new EventEmitter<PageEvent>();
  @Output() sort = new EventEmitter<Sort>();

  dataSource = new MatTableDataSource<any>([]);
  displayedColumnKeys: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.dataSource.data = this.data;
    }
    if (changes['columns']) {
      this.displayedColumnKeys = this.columns.map((c) => c.key);
    }
  }

  onSortChange(sort: Sort): void {
    this.sort.emit(sort);
  }

  onPageChange(event: PageEvent): void {
    this.page.emit(event);
  }

  onEditClick(row: any, event: MouseEvent): void {
    event.stopPropagation();
    this.edit.emit(row);
  }

  onDeleteClick(row: any, event: MouseEvent): void {
    event.stopPropagation();
    this.delete.emit(row);
  }

  getBadgeClass(val: string): string {
    const value = String(val).toLowerCase();
    if (value === 'active' || value === 'completed' || value === 'delivered' || value === 'true') {
      return 'badge-success';
    }
    if (value === 'pending' || value === 'processing' || value === 'shipped') {
      return 'badge-warning';
    }
    if (value === 'inactive' || value === 'failed' || value === 'cancelled' || value === 'false') {
      return 'badge-danger';
    }
    return 'badge-default';
  }
}
