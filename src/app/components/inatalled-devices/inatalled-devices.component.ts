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

  constructor(private apiService: CommonService) { }

  ngOnInit() {
    this.getClientList();
    this.getAllTasks();
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

  getAllTasks() {
    let params = new URLSearchParams();

    if (this.searchText?.trim()) {
      params.append('search', this.searchText.trim());
    }

    if (this.selectedClientId) {
      params.append('client_id', this.selectedClientId);
    }

    params.append('page', this.page.toString());
    params.append('limit', this.limit.toString());

    this.apiService.get(`devices?${params.toString()}`).subscribe({
      next: (resp: any) => {
        this.deviceList = resp.data.items;
        this.pagination = resp.data.pagination;
      },
      error: (error) => {
        console.log(error.message);
        this.deviceList = [];
      }
    });
  }

  changePage(page: number) {
    this.page = page;
    this.getClientList();
  }


}
