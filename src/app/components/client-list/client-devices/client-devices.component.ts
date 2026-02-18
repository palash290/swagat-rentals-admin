import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { FormsModule } from '@angular/forms';

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


  constructor(private route: ActivatedRoute, private service: CommonService) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.clientId = params['clientId'];
    });
    this.getClientDetails();
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


}
