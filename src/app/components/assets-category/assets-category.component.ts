import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'app-assets-category',
  imports: [CommonModule, FormsModule],
  templateUrl: './assets-category.component.html',
  styleUrl: './assets-category.component.css'
})
export class AssetsCategoryComponent {

  page: number = 1;
  limit: number = 10;

  deviceList: any;
  selectedClientId: string = '';
  searchText: string = '';
  clientList: any;
  pagination: any;

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
      params.append('client_id', this.selectedClientId);
    }

    params.append('page', this.page.toString());
    params.append('limit', this.limit.toString());

    this.apiService.get(`assest/types?${params.toString()}`).subscribe({
      next: (resp: any) => {
        this.deviceList = resp.data;
        // this.pagination = resp.data.pagination;
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


}
