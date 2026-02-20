import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonService } from '../../services/common.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  systemUidList: string[] = [];
  deviceTypeList: string[] = [];

  originalList: any[] = [];

  constructor(private apiService: CommonService) { }

  ngOnInit() {
    //this.getClientList();
    this.getAllTasks();
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

  getAllTasks() {
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
    this.getAllTasks();
  }


}
