import { Component } from '@angular/core';
import { CommonService } from '../../services/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-invoices',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.css'
})
export class InvoicesComponent {

  search: string = '';
  searchTimeout: any;
  page: number = 1;
  limit: number = 10;
  loading: boolean = false;
  invoiceData: any[] = [];
  pagination: any;
  status: string = '';

  constructor(private apiService: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    this.getAllInvoices();
  }

  getAllInvoices() {
    const params = new URLSearchParams({
      search: this.search || '',
      status: this.status || '',
      page: this.page.toString(),
      limit: this.limit.toString()
    });

    this.apiService.get(`admin/invoices?${params.toString()}`).subscribe({
      next: (resp: any) => {
        this.invoiceData = resp.data.data;
        this.pagination = resp.data.pagination;
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  changePage(page: number) {
    this.page = page;
    this.getAllInvoices();
  }

  onStatusChange() {
    this.page = 1;
    this.getAllInvoices();
  }


}
