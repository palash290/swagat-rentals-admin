import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonService } from '../../services/common.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-inatalled-devices',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './inatalled-devices.component.html',
  styleUrl: './inatalled-devices.component.css'
})
export class InatalledDevicesComponent {

  page: number = 1;
  limit: number = 50;

  deviceList: any;
  selectedClientId: any = '';
  searchText: string = '';
  clientList: any;
  pagination: any;

  filters = {
    system_uid: '',
    deviceType: ''
  };

  loading: boolean = false;

  systemUidList: string[] = [];
  deviceTypeList: string[] = [];

  originalList: any[] = [];
  selectedDeviceIds = new Set<number | string>();

  constructor(private apiService: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    this.getClientList();
    this.getAllSystems();
  }

  getClientList() {
    this.apiService.get(`admin/clients`).subscribe({
      next: (resp: any) => {
        this.clientList = resp.data.items;
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  getAllSystems() {
    let params = new URLSearchParams();

    if (this.searchText?.trim()) {
      params.append('search', this.searchText.trim());
    }

    params.append('page', this.page.toString());
    params.append('limit', this.limit.toString());

    this.apiService.get(`systems?${params.toString()}`).subscribe({
      next: (resp: any) => {

        this.originalList = resp.data.items || [];
        this.deviceList = [...this.originalList];   // default table data
        this.pagination = resp.data.pagination;
        this.selectedDeviceIds.clear();

        // ✅ UNIQUE SYSTEM UID
        this.systemUidList = [
          ...new Set(this.originalList.map((x: any) => x.system_uid))
        ];

        // ✅ UNIQUE DEVICE TYPE
        this.deviceTypeList = [
          ...new Set(this.originalList.map((x: any) => x.device_type))
        ];

      },
      error: (error) => {
        console.log(error.message);
        this.deviceList = [];
        this.systemUidList = [];
        this.deviceTypeList = [];
      }
    });
  }

  searchTimeout: any;

onSearch() {
  clearTimeout(this.searchTimeout);

  this.searchTimeout = setTimeout(() => {
    this.page = 1;
    this.getAllSystems();
  }, 300);
}

  applyFilter() {
    // this.page = 1;
    this.deviceList = this.originalList.filter((item: any) => {

      const matchSystemUid =
        !this.filters.system_uid ||
        item.system_uid == this.filters.system_uid;

      const matchDeviceType =
        !this.filters.deviceType ||
        item.device_type == this.filters.deviceType;

      return matchSystemUid && matchDeviceType;
    });
  }

  changePage(page: number) {
    this.page = page;
    this.getAllSystems();
  }

  nextStatus!: number;
  selectedUser: any;
  @ViewChild('closeModalBlock') closeModalBlock!: ElementRef;
  @ViewChild('closeModalAssign') closeModalAssign!: ElementRef;

  get modalTitle(): string {
    return this.nextStatus === 1 ? 'Unblock System' : 'Block System';
  }

  get modalMessage(): string {
    return this.nextStatus === 1
      ? 'Are you sure you want to unblock this System?'
      : 'Are you sure you want to block this System?';
  }

  get confirmBtnText(): string {
    return this.nextStatus === 1 ? 'Yes, Block' : 'Yes, Unblock';
  }

  systemId: any;

  onToggleUser(item: any) {
    this.selectedUser = item;
    this.systemId = item.id;
    this.nextStatus = item.is_block;
  }

  confirmToggle() {
    this.loading = true;
    const formURlData = new URLSearchParams();
    if (this.nextStatus == 0) {
      formURlData.set('is_block', '1');
    }

    if (this.nextStatus == 1) {
      formURlData.set('is_block', '0');
    }


    this.apiService.patch(`admin/systems/${this.systemId}/block`, formURlData.toString()).subscribe({
      next: (resp: any) => {
        this.selectedUser.is_disabled = this.nextStatus;
        this.closeModalBlock.nativeElement.click();
        this.loading = false;
        this.toastr.success(resp.message);
      },
      error: (err) => {
        this.loading = false;
      }
    });
  }

  @ViewChild('blockModal') blockModal!: ElementRef;

  ngAfterViewInit() {
    const modalEl = this.blockModal.nativeElement;

    modalEl.addEventListener('hidden.bs.modal', () => {
      this.getAllSystems();
    });
  }

  get isAllSelected(): boolean {
    return !!this.deviceList?.length && this.deviceList.every((item: any) => this.selectedDeviceIds.has(item.id));
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedDeviceIds.clear();
    if (checked) {
      (this.deviceList ?? []).forEach((item: any) => this.selectedDeviceIds.add(item.id));
    }
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

    this.apiService.post('systems/bulk-assign', payload).subscribe({
      next: (resp: any) => {
        this.loading = false;
        this.toastr.success(resp?.message || 'Systems assigned successfully.');
        this.closeModalAssign?.nativeElement?.click();
        this.selectedDeviceIds.clear();
        this.selectedClientId = '';
        this.getAllSystems();
      },
      error: () => {
        this.loading = false;
        this.toastr.warning('Something went wrong.');
      }
    });
  }


}
