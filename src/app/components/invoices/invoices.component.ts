import { Component, ElementRef, ViewChild } from '@angular/core';
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
  isSubmitting: boolean = false;
  invoiceData: any[] = [];
  pagination: any;
  status: string = '';
  clientList: any[] = [];
  agreementList: any[] = [];
  form: any = {
    client_id: '',
    agreement_id: '',
    rent_amount: '',
    due_date: '',
    invoice_month: ''
  };

  @ViewChild('closeModalGateway') closeModalGateway!: ElementRef;

  constructor(private apiService: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    this.getAllInvoices();
    this.getClientList();
    this.getAgreements();
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
        this.invoiceData = [];
      }
    });
  }

  getClientList() {
    this.apiService.get(`admin/clients`).subscribe({
      next: (resp: any) => {
        this.clientList = resp.data.items;
      },
      error: (error) => {
        console.log(error.message);
        this.clientList = [];
      }
    });
  }

  getAgreements() {

    this.apiService.get(`admin/agreements`).subscribe({
      next: (resp: any) => {
        this.agreementList = resp.data.data;
      },
      error: (error) => {
        console.log(error.message);
        this.agreementList = [];
      }
    });
  }

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getAllInvoices();
    }, 500);
  }

  openAddModal() {
    this.form = {
      client_id: '',
      agreement_id: '',
      rent_amount: '',
      due_date: '',
      invoice_month: ''
    };
  }

  submitInvoice() {
    if (!this.form.client_id) {
      this.toastr.warning('Please select client.');
      return;
    }

    if (!this.form.agreement_id) {
      this.toastr.warning('Please select agreement.');
      return;
    }

    if (!this.form.rent_amount && this.form.rent_amount !== 0) {
      this.toastr.warning('Please enter rent amount.');
      return;
    }

    if (!this.form.due_date) {
      this.toastr.warning('Please select due date.');
      return;
    }

    if (!this.form.invoice_month) {
      this.toastr.warning('Please select invoice month.');
      return;
    }

    const payload = {
      client_id: Number(this.form.client_id),
      agreement_id: Number(this.form.agreement_id),
      rent_amount: Number(this.form.rent_amount),
      due_date: this.form.due_date,
      invoice_month: this.form.invoice_month
    };

    this.isSubmitting = true;
    this.loading = true;
    this.apiService.post(`admin/invoices`, payload).subscribe({
      next: (resp: any) => {
        this.toastr.success(resp.message || 'Invoice added.');
        this.isSubmitting = false;
        this.loading = false;
        this.page = 1;
        this.getAllInvoices();
        this.closeModalGateway?.nativeElement.click();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.loading = false;
        const msg = error.error?.message || error.message || 'Something went wrong.';
        this.toastr.error(msg);
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
