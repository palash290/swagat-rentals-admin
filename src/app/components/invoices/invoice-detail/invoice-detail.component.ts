import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-invoice-detail',
  imports: [RouterLink, CommonModule],
  templateUrl: './invoice-detail.component.html',
  styleUrl: './invoice-detail.component.css'
})
export class InvoiceDetailComponent {

  invoice_id: any;
  invoiceData: any;

  constructor(private route: ActivatedRoute, private service: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.invoice_id = params['invoice_id'];
    });
    this.getClientDetails();
  }

  getClientDetails() {
    this.service.get(`admin/invoices/${this.invoice_id}`).subscribe({
      next: (resp: any) => {
        this.invoiceData = resp.data;
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  getPaidAmount(): number {
    const payments = this.invoiceData?.payments ?? [];
    return payments.reduce((sum: number, payment: any) => sum + Number(payment?.amount || 0), 0);
  }

  getStatusClass(status: string): string {
    const normalizedStatus = (status || '').toLowerCase();

    if (normalizedStatus === 'paid' || normalizedStatus === 'approved') {
      return 'ct_green_text';
    }

    if (normalizedStatus === 'pending') {
      return 'ct_orange_text';
    }

    if (normalizedStatus === 'overdue' || normalizedStatus === 'rejected') {
      return 'ct_red_text';
    }

    return 'ct_dark_grey_text';
  }

}
