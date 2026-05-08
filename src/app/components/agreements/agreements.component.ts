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
  invoiceData: any[] = [];
  pagination: any;
  status: string = '';

  constructor(private apiService: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    this.getAgreements();
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

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getAgreements();
    }, 500);
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



  systemId: any;
  nextStatus!: any;
  selectedUser: any;
  @ViewChild('closeModalBlock') closeModalBlock!: ElementRef;
  @ViewChild('closeModalAssign') closeModalAssign!: ElementRef;

  get modalTitle(): string {
    return this.nextStatus === 'terminated' ? 'Activate Agreement' : 'Terminate Agreement';
  }

  get modalMessage(): string {
    return this.nextStatus === 'terminated'
      ? 'Are you sure you want to Activate this Agreement?'
      : 'Are you sure you want to Terminate this Agreement?';
  }

  get confirmBtnText(): string {
    return this.nextStatus === 'terminated' ? 'Yes, Activate' : 'Yes, Terminate';
  }

  onToggleUser(item: any) {
    this.selectedUser = item;
    this.systemId = item.agreement_id;
    this.nextStatus = item.status;
  }

  confirmToggle() {
    this.loading = true;
    const formURlData = new URLSearchParams();

    if (this.nextStatus == 'terminated') {
      formURlData.set('status', 'reinstate');
    }
    else {
      formURlData.set('status', 'terminated');
    }



    this.apiService.put(`admin/agreements/${this.systemId}/status`, formURlData.toString()).subscribe({
      next: (resp: any) => {
        this.selectedUser.is_disabled = this.nextStatus;
        this.closeModalBlock.nativeElement.click();
        this.loading = false;
        this.toastr.success(resp.message);
        this.getAgreements();
      },
      error: (err) => {
        this.loading = false;
      }
    });
  }


}
