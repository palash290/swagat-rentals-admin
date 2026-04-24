import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'app-assets',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './assets.component.html',
  styleUrl: './assets.component.css'
})
export class AssetsComponent {

  page: number = 1;
  limit: number = 10;
  search: string = '';
  deviceList: any;
  selectedClientId: string = '';
  searchText: string = '';
  clientList: any;
  pagination: any;
  searchTimeout: any;

  constructor(private apiService: CommonService) { }

  ngOnInit() {
    this.getAllTasks();
  }


  getAllTasks() {
    let params = new URLSearchParams();

    if (this.searchText?.trim()) {
      params.append('search', this.searchText.trim());
    }

    if (this.selectedClientId) {
      params.append('asset_category_id', this.selectedClientId);
    }

    params.append('page', this.page.toString());
    params.append('limit', this.limit.toString());
    //assets?asset_category_id=3&status=rented&page=1&limit=20'
    this.apiService.get(`assets?${params.toString()}`).subscribe({
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
    this.getAllTasks();
  }

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getAllTasks();
    }, 500);
  }


}
