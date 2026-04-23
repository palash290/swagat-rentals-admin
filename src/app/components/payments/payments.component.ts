import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonService } from '../../services/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payments',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css'
})
export class PaymentsComponent {

  search: string = '';
  searchTimeout: any;
  page: number = 1;
  limit: number = 10;
  loading: boolean = false;
  paymentData: any[] = [];
  pagination: any;
  status: string = '';

  constructor(private apiService: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    this.getAllPayments();
    this.getDashboard();
  }

  getAllPayments() {
    const params = new URLSearchParams({
      search: this.search || '',
      status: this.status || '',
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

  dashboardData: any;

  getDashboard() {
    this.apiService.get(`admin/payments/dashboard`).subscribe({
      next: (resp: any) => {
        this.dashboardData = resp.data;
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  changePage(page: number) {
    this.page = page;
    this.getAllPayments();
  }

  onStatusChange() {
    this.page = 1;
    this.getAllPayments();
  }

  onEmfStatusChange(id: any, overrideStatus: any): void {
    const statusToUse = overrideStatus;

    if (!statusToUse) {
      this.toastr.warning('Please select a valid status');
      return;
    }

    const statusLabels: any = {
      APPROVED: 'Approve',
      REJECTED: 'Reject',
    };

    const formURlData = new URLSearchParams();
    formURlData.set('status', statusToUse);

    this.apiService.patch(`admin/payments/${id}/status`, formURlData.toString()).subscribe({
      next: (resp: any) => {
        this.toastr.success(resp.message || 'Status updated successfully!');
        this.getAllPayments();
      },
      error: (err) => {
        this.toastr.warning('Failed to update Status');
        this.getAllPayments();
      }
    });
  }

  downLoadPdf(pdfUrl: any) {
    pdfUrl?.invoice_pdf && window.open(pdfUrl.invoice_pdf, '_blank');
  }


}
