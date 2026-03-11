import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { FormsModule } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-client-devices',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './client-devices.component.html',
  styleUrl: './client-devices.component.css'
})
export class ClientDevicesComponent {

  clientId: any;
  clientData: any;

  search: string = '';
  searchTimeout: any;
  status: string = '';

  page: number = 1;
  limit: number = 10;
  pagination: any;

  selectedClientId: any = '';
  clientList: any;
  selectedDeviceIds = new Set<number | string>();
  loading: boolean = false;


  constructor(private route: ActivatedRoute, private service: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.clientId = params['clientId'];
    });
    this.getClientDetails();
    this.getClientList();
  }

  getClientList() {
    this.service.get(`admin/clients`).subscribe({
      next: (resp: any) => {
        // this.clientList = resp.data.items;
        const list = resp.data.items || [];

        // remove clientId from list
        this.clientList = list.filter((client: any) => client.id != this.clientId);
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  getClientDetails() {

    const params = new URLSearchParams({
      search: this.search || '',
      status: this.status || '',
      page: this.page.toString(),
      limit: this.limit.toString()
    });

    this.service.get(`admin/clients/${this.clientId}/devices?${params.toString()}`).subscribe({
      next: (resp: any) => {
        this.clientData = resp.data.items;
        this.pagination = resp.data.pagination;
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  onSearchChange() {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1; // reset to first page on search
      this.getClientDetails();
    }, 500); // 500ms debounce
  }

  changePage(page: number) {
    this.page = page;
    this.getClientDetails();
  }

  toggleRowSelection(event: Event, id: number | string): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedDeviceIds.add(id);
      return;
    }
    this.selectedDeviceIds.delete(id);
  }

  get canAssignDevices(): boolean {
    return !!this.selectedClientId && this.selectedDeviceIds.size > 0;
  }

  onAssignDevicesClick(event: Event): void {
    if (this.selectedDeviceIds.size === 0) {
      event.preventDefault();
      this.toastr.warning('Please select at least one system.');
      return;
    }

    if (!this.selectedClientId) {
      event.preventDefault();
      this.toastr.warning('Please select a client.');
    }
  }

  @ViewChild('closeModalAssign1') closeModalAssign1!: ElementRef;

  confirmAssignDevices(): void {
    if (!this.canAssignDevices) {
      this.toastr.warning('Please select a client and at least one system.');
      return;
    }

    this.loading = true;
    const payload = {
      client_id: this.selectedClientId,
      system_ids: Array.from(this.selectedDeviceIds)
    };

    this.service.post('systems/bulk-assign', payload).subscribe({
      next: (resp: any) => {
        this.loading = false;
        this.toastr.success(resp?.message || 'Systems assigned successfully.');
        this.closeModalAssign1?.nativeElement?.click();
        this.selectedDeviceIds.clear();
        this.selectedClientId = '';
        this.getClientDetails();
      },
      error: () => {
        this.loading = false;
        this.toastr.warning('Something went wrong.');
      }
    });
  }


}
