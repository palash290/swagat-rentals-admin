import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonService } from '../../services/common.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressBarModule } from 'primeng/progressbar';
import { SliderModule } from 'primeng/slider';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { LazyLoadEvent } from 'primeng/api';

@Component({
  selector: 'app-inatalled-devices',
  imports: [RouterLink, CommonModule, FormsModule,
    ButtonModule, SelectModule, IconFieldModule, InputIconModule, MultiSelectModule, ProgressBarModule, SliderModule, TableModule, TagModule, InputTextModule
  ],
  templateUrl: './inatalled-devices.component.html',
  styleUrl: './inatalled-devices.component.css'
})
export class InatalledDevicesComponent {

  deviceList: any[] = [];
  clientList: any[] = [];
  loading: boolean = false;

  // server params
  page: number = 1;
  limit: number = 10;
  totalRecords: number = 0;

  selectedClientId: string = '';
  searchText: string = '';

  constructor(private apiService: CommonService) { }

  ngOnInit() {
    this.getClientList();
      // initial load
  this.getAllTasks();
  }

  // 🔹 Load Clients for dropdown filter
  getClientList() {
    this.apiService.get(`admin/clients`).subscribe({
      next: (resp: any) => {
        this.clientList = resp.data.items;
      }
    });
  }

  // 🔹 PrimeNG Lazy Load (pagination + sorting + filtering)
loadDevices(event: any) {
  this.loading = true;

  // ✅ update page + limit from primeng event
  this.page = (event.first / event.rows) + 1;
  this.limit = event.rows;

  const filters = event.filters || {};

  this.getAllTasks(filters);
}

  // 🔹 API call
  getAllTasks(filters: any = {}) {
    let params = new URLSearchParams();

    // 🔥 collect all text filters into ONE array
    const searchParts: string[] = [];

    // global search input
    if (this.searchText?.trim()) {
      searchParts.push(this.searchText.trim());
    }

    // column filters you want to include in global search
    if (filters['device_uid']?.value) {
      searchParts.push(filters['device_uid'].value);
    }

    if (filters['device_type']?.value) {
      searchParts.push(filters['device_type'].value);
    }

    if (filters['client_name']?.value) {
      searchParts.push(filters['client_name'].value);
    }

    if (filters['client_unique_id']?.value) {
      searchParts.push(filters['client_unique_id'].value);
    }

    // 🔗 merge everything into single search string
    if (searchParts.length > 0) {
      params.append('search', searchParts.join(' '));
    }

    // 🎯 normal filters (not part of search)
    if (filters['status']?.value) {
      params.append('status', filters['status'].value);
    }

    if (this.selectedClientId) {
      params.append('client_id', this.selectedClientId);
    }

    // pagination
    params.append('page', this.page.toString());
    params.append('limit', this.limit.toString());

    this.apiService.get(`devices?${params.toString()}`).subscribe({
      next: (resp: any) => {
        this.deviceList = resp.data.items;
        this.totalRecords = resp.data.pagination.total;
        this.loading = false;
      },
      error: () => {
        this.deviceList = [];
        this.loading = false;
      }
    });
  }

  // 🔹 Global search
  onSearch(event: any, table: any) {
    this.searchText = event.target.value;
    table.reset(); // go back to page 1
  }

  // 🔹 Client filter
  onClientChange() {
    this.page = 1;
    this.getAllTasks();
  }

  // 🔹 Status badge color
  getStatusClass(status: string) {
    switch (status) {
      case 'active':
        return 'ct_accepted_badge';
      case 'pending':
      case 'under_service':
        return 'ct_pending_badge';
      case 'inactive':
        return 'ct_rejected_badge';
      default:
        return '';
    }
  }

  // customerService = inject(CommonService);
  // customers = signal<any[]>([]);
  // representatives = signal<any[]>([]);
  // statuses = signal<any[]>([]);
  // loading = signal(true);
  // searchValue = signal('');
  // activityValues = signal<number[]>([0, 100]);

  // ngOnInit() {
  //   this.customerService.getCustomersLarge().then((customers) => {
  //     customers.forEach((customer: any) => (customer.date = new Date(customer.date as string)));
  //     this.customers.set(customers);
  //     this.loading.set(false);
  //   });
  //   this.representatives.set([
  //     { name: 'Amy Elsner', image: 'amyelsner.png' },
  //     { name: 'Anna Fali', image: 'annafali.png' },
  //     { name: 'Asiya Javayant', image: 'asiyajavayant.png' },
  //     { name: 'Bernardo Dominic', image: 'bernardodominic.png' },
  //     { name: 'Elwin Sharvill', image: 'elwinsharvill.png' },
  //     { name: 'Ioni Bowcher', image: 'ionibowcher.png' },
  //     { name: 'Ivan Magalhaes', image: 'ivanmagalhaes.png' },
  //     { name: 'Onyama Limba', image: 'onyamalimba.png' },
  //     { name: 'Stephen Shaw', image: 'stephenshaw.png' },
  //     { name: 'Xuxue Feng', image: 'xuxuefeng.png' }
  //   ]);
  //   this.statuses.set([
  //     { label: 'Unqualified', value: 'unqualified' },
  //     { label: 'Qualified', value: 'qualified' },
  //     { label: 'New', value: 'new' },
  //     { label: 'Negotiation', value: 'negotiation' },
  //     { label: 'Renewal', value: 'renewal' },
  //     { label: 'Proposal', value: 'proposal' }
  //   ]);
  // }

  // clear(table: Table) {
  //   table.clear();
  //   this.searchValue.set('');
  // }

  // getSeverity(status: string): any | null {
  //   switch (status) {
  //     case 'unqualified':
  //       return 'danger';

  //     case 'qualified':
  //       return 'success';

  //     case 'new':
  //       return 'info';

  //     case 'negotiation':
  //       return 'warn';

  //     case 'renewal':
  //       return null;

  //     default:
  //       return null;   // ✅ fallback for safety
  //   }
  // }


}
