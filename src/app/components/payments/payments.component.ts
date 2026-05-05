import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonService } from '../../services/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payments',
  imports: [CommonModule, FormsModule],
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
  selectedPaymentId: number | null = null;
  selectedPaymentStatus: string = '';
  previousPaymentStatus: string = '';
  selectedPaymentNote: string = '';
  selectedPaymentImage: File | null = null;
  selectedPaymentRow: any = null;
  isUpdatingStatus: boolean = false;

  @ViewChild('openStatusModalTrigger') openStatusModalTrigger!: ElementRef;
  @ViewChild('closeStatusModalTrigger') closeStatusModalTrigger!: ElementRef;

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

  onEmfStatusChange(item: any, overrideStatus: string): void {
    const statusToUse = String(overrideStatus ?? '').trim().toLowerCase();

    if (!statusToUse) {
      this.toastr.warning('Please select a valid status');
      return;
    }

    if (statusToUse === 'approved' || statusToUse === 'rejected') {
      this.selectedPaymentId = Number(item?.payment_id) || null;
      this.selectedPaymentStatus = statusToUse;
      this.previousPaymentStatus = String(item?.payment_status ?? 'pending');
      this.selectedPaymentNote = '';
      this.selectedPaymentImage = null;
      this.selectedPaymentRow = item;
      this.openStatusModalTrigger?.nativeElement?.click();
      return;
    }

    // this.updatePaymentStatus(Number(item?.payment_id), statusToUse);
  }

  onPaymentStatusFocus(item: any): void {
    item._previousPaymentStatus = item?.payment_status;
  }

  onPaymentImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedPaymentImage = input.files?.[0] ?? null;
  }

  cancelPaymentStatusChange(): void {
    if (this.selectedPaymentRow) {
      this.selectedPaymentRow.payment_status =
        this.selectedPaymentRow._previousPaymentStatus ?? this.previousPaymentStatus ?? 'pending';
    }

    this.resetPaymentStatusModal();
    this.closeStatusModalTrigger?.nativeElement?.click();
  }

  confirmPaymentStatusChange(): void {
    if (!this.selectedPaymentId || !this.selectedPaymentStatus) {
      this.toastr.warning('Please select a valid status');
      return;
    }

    this.updatePaymentStatus(this.selectedPaymentId, this.selectedPaymentStatus, this.selectedPaymentNote, this.selectedPaymentImage);
  }

  private updatePaymentStatus(id: number, statusToUse: string, note?: string, image?: File | null): void {
    if (!id || !statusToUse) {
      this.toastr.warning('Please select a valid status');
      return;
    }

    const formData = new FormData();
    formData.append('status', statusToUse);

    if (String(note ?? '').trim()) {
      formData.append('note', String(note).trim());
    }

    if (image) {
      formData.append('screenshot', image, image.name);
    }

    this.isUpdatingStatus = true;

    this.apiService.put(`admin/payments/${id}/status`, formData).subscribe({
      next: (resp: any) => {
        this.isUpdatingStatus = false;
        this.toastr.success(resp.message || 'Status updated successfully!');
        this.resetPaymentStatusModal();
        this.closeStatusModalTrigger?.nativeElement?.click();
        this.getAllPayments();
      },
      error: (err) => {
        this.isUpdatingStatus = false;
        if (this.selectedPaymentRow) {
          this.selectedPaymentRow.payment_status =
            this.selectedPaymentRow._previousPaymentStatus ?? this.previousPaymentStatus ?? 'pending';
        }
        this.toastr.warning('Failed to update Status');
        this.resetPaymentStatusModal();
        this.closeStatusModalTrigger?.nativeElement?.click();
        this.getAllPayments();
      }
    });
  }

  private resetPaymentStatusModal(): void {
    this.selectedPaymentId = null;
    this.selectedPaymentStatus = '';
    this.previousPaymentStatus = '';
    this.selectedPaymentNote = '';
    this.selectedPaymentImage = null;
    this.selectedPaymentRow = null;
    this.isUpdatingStatus = false;
  }

  downLoadPdf(pdfUrl: any) {
    pdfUrl?.invoice_pdf && window.open(pdfUrl.invoice_pdf, '_blank');
  }


}
