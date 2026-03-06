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
  limit: number = 10;

  deviceList: any;
  selectedClientId: string = '';
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

  constructor(private apiService: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    //this.getClientList();
    this.getAllSystems();
  }


  // getClientList() {
  //   this.apiService.get(`admin/clients`).subscribe({
  //     next: (resp: any) => {
  //       this.clientList = resp.data.items;
  //     },
  //     error: (error) => {
  //       console.log(error.message);
  //     }
  //   });
  // }

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

  applyFilter() {
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


}
