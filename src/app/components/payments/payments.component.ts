import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonService } from '../../services/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payments',
  imports: [RouterLink, CommonModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css'
})
export class PaymentsComponent {

  search: string = '';
  searchTimeout: any;
  kycStatus: string = '';
  page: number = 1;
  limit: number = 10;
  loading: boolean = false;
  paymentData: any[] = [];
  pagination: any;

  constructor(private apiService: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    this.getClientList();
  }

  getClientList() {
    const params = new URLSearchParams({
      search: this.search || '',
      status: this.kycStatus || '',
      page: this.page.toString(),
      limit: this.limit.toString()
    });

    this.apiService.get(`admin/payments?${params.toString()}`).subscribe({
      next: (resp: any) => {
        this.paymentData = resp.data.data;
        this.pagination = resp.data.pagination;
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }


}
