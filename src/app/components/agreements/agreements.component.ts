import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonService } from '../../services/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-agreements',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './agreements.component.html',
  styleUrl: './agreements.component.css'
})
export class AgreementsComponent {

  search: string = '';
  searchTimeout: any;
  page: number = 1;
  limit: number = 10;
  loading: boolean = false;
  isSubmitting: boolean = false;
  isSubmitted: boolean = false;
  invoiceData: any[] = [];
  pagination: any;
  status: string = '';
  clientList: any[] = [];
  billingDays: number[] = [];
  agreementId: number | null = null;
  isEditMode: boolean = false;
  form: any = {
    client_id: '',
    rent_amount: '',
    billing_cycle_day: '',
    start_date: '',
    end_date: ''
  };

  @ViewChild('closeModalGateway') closeModalGateway!: ElementRef;

  constructor(private apiService: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    this.billingDays = Array.from({ length: 25 }, (_, i) => i + 1);
    this.getAgreements();
    this.getClientList();
  }

  getAgreements() {
    const params = new URLSearchParams({
      search: this.search || '',
      status: this.status || '',
      page: this.page.toString(),
      limit: this.limit.toString()
    });

    this.apiService.get(`admin/agreements?${params.toString()}`).subscribe({
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

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getAgreements();
    }, 500);
  }

  openAddModal() {
    this.isEditMode = false;
    this.agreementId = null;
    this.isSubmitted = false;
    this.form = {
      client_id: '',
      rent_amount: '',
      billing_cycle_day: '',
      start_date: '',
      end_date: ''
    };
  }

  openEditModal(item: any) {
    this.isEditMode = true;
    this.agreementId = Number(item?.agreement_id ?? item?.id ?? 0) || null;
    this.isSubmitted = false;
    this.form = {
      client_id: String(item?.client_id ?? item?.id ?? ''),
      rent_amount: item?.rent_amount ?? '',
      billing_cycle_day: String(
        item?.agreement_billing_cycle_day ??
        item?.billing_cycle_day ??
        item?.billing_day ??
        ''
      ),
      start_date: this.toDateInput(item?.agreement_start_date ?? item?.start_date),
      end_date: ''
    };
    this.updateEndDate();
  }

  private toDateInput(value: any): string {
    return value ? String(value).slice(0, 10) : '';
  }

  onStartDateChange(): void {
    this.updateEndDate();
  }

  private updateEndDate(): void {
    this.form.end_date = this.calculateEndDate(this.form.start_date);
  }

  private calculateEndDate(startDate: string): string {
    if (!startDate) return '';

    const parsedDate = new Date(startDate);
    if (Number.isNaN(parsedDate.getTime())) return '';

    const targetYear = parsedDate.getFullYear();
    const targetMonth = parsedDate.getMonth() + 11;
    const targetDay = parsedDate.getDate();
    const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const endDate = new Date(targetYear, targetMonth, Math.min(targetDay, lastDayOfTargetMonth));

    return this.formatDate(endDate);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  isFieldInvalid(field: keyof typeof this.form): boolean {
    const value = this.form[field];

    if (field === 'rent_amount') {
      return value === '' || value === null || value === undefined || Number(value) <= 0;
    }

    return String(value ?? '').trim() === '';
  }

  getRentAmountError(): string {
    if (this.form.rent_amount === '' || this.form.rent_amount === null || this.form.rent_amount === undefined) {
      return 'Rent amount is required.';
    }

    if (Number(this.form.rent_amount) <= 0) {
      return 'Rent amount must be greater than 0.';
    }

    return '';
  }

  submitAgreement() {
    this.isSubmitted = true;

    if (this.isFieldInvalid('client_id')) {
      this.toastr.warning('Please select client.');
      return;
    }

    if (this.isFieldInvalid('rent_amount')) {
      this.toastr.warning(this.getRentAmountError());
      return;
    }

    if (this.isFieldInvalid('billing_cycle_day')) {
      this.toastr.warning('Please select billing day.');
      return;
    }

    if (this.isFieldInvalid('start_date')) {
      this.toastr.warning('Please select start date.');
      return;
    }

    this.updateEndDate();

    if (this.isFieldInvalid('end_date')) {
      this.toastr.warning('End date is required.');
      return;
    }

    const payload = {
      client_id: Number(this.form.client_id),
      rent_amount: Number(this.form.rent_amount),
      billing_cycle_day: Number(this.form.billing_cycle_day),
      start_date: this.form.start_date,
      end_date: this.form.end_date
    };

    this.isSubmitting = true;
    this.loading = true;

    const request = this.isEditMode && this.agreementId
      ? this.apiService.put(`admin/agreements/${this.agreementId}`, payload)
      : this.apiService.post(`admin/agreements`, payload);

    request.subscribe({
      next: (resp: any) => {
        this.toastr.success(resp.message || (this.isEditMode ? 'Agreement updated.' : 'Agreement added.'));
        this.isSubmitting = false;
        this.loading = false;
        this.page = 1;
        this.getAgreements();
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
    this.getAgreements();
  }

  onStatusChange() {
    this.page = 1;
    this.getAgreements();
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

    this.apiService.put(`admin/agreements/${id}/status`, formURlData.toString()).subscribe({
      next: (resp: any) => {
        this.toastr.success(resp.message || 'Status updated successfully!');
        this.getAgreements();
      },
      error: (err) => {
        this.toastr.warning('Failed to update Status');
        this.getAgreements();
      }
    });
  }


}
