import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'app-client-request-admin',
  imports: [RouterLink, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './client-request-admin.component.html',
  styleUrl: './client-request-admin.component.css'
})
export class ClientRequestAdminComponent {


  page: number = 1;
  limit: number = 10;

  employeeList: any;
  status: string = '';
  searchText: string = '';
  clientList: any;
  pagination: any;

  loading: boolean = false;
  selectedClientId: any = null;
  rejectionReason: string = '';
  @ViewChild('closeApproveModal') closeApproveModal!: ElementRef;
  @ViewChild('closeRejectModal') closeRejectModal!: ElementRef;

  constructor(private apiService: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    this.getAllEmployee();
  }


  getAllEmployee() {
    let params = new URLSearchParams();

    if (this.searchText?.trim()) {
      params.append('search', this.searchText.trim());
    }

    if (this.status) {
      params.append('status', this.status);
    }

    params.append('page', this.page.toString());
    params.append('limit', this.limit.toString());

    this.apiService.get(`admin/client/kyc-approvals/pending?${params.toString()}`).subscribe({
      next: (resp: any) => {
        this.employeeList = resp.data.items;
        this.pagination = resp.data.pagination;
      },
      error: (error) => {
        console.log(error.message);
        this.employeeList = [];
      }
    });
  }

  openApproveModal(item: any) {
    this.selectedClientId = item?.client_id ?? item?.id ?? null;
  }

  openRejectModal(item: any) {
    this.selectedClientId = item?.client_id ?? item?.id ?? null;
    this.rejectionReason = '';
  }

  approveKyc() {
    if (!this.selectedClientId) {
      this.toastr.warning('Please select a client.');
      return;
    }

    this.loading = true;
    const formURlData = new URLSearchParams();
    formURlData.set('status', 'approved');
    formURlData.set('client_id', String(this.selectedClientId));

    this.apiService.post(`admin/client/kyc-approvals`, formURlData.toString()).subscribe({
      next: (resp: any) => {
        this.loading = false;
        this.toastr.success(resp?.message || 'KYC approved.');
        this.closeApproveModal?.nativeElement?.click();
        this.getAllEmployee();
      },
      error: () => {
        this.loading = false;
        this.toastr.warning('Something went wrong.');
      }
    });
  }

  rejectKyc() {
    const reason = this.rejectionReason?.trim();
    if (!reason) {
      this.toastr.warning('Please enter rejection reason.');
      return;
    }
    if (!this.selectedClientId) {
      this.toastr.warning('Please select a client.');
      return;
    }

    this.loading = true;
    const formURlData = new URLSearchParams();
    formURlData.set('status', 'rejected');
    formURlData.set('reject_reason', reason);
    formURlData.set('client_id', String(this.selectedClientId));

    this.apiService.post(`admin/client/kyc-approvals`, formURlData.toString()).subscribe({
      next: (resp: any) => {
        this.loading = false;
        this.toastr.success(resp?.message || 'KYC rejected.');
        this.closeRejectModal?.nativeElement?.click();
        this.rejectionReason = '';
        this.getAllEmployee();
      },
      error: () => {
        this.loading = false;
        this.toastr.warning('Something went wrong.');
      }
    });
  }

  changePage(page: number) {
    this.page = page;
    this.getAllEmployee();
  }

  onStatusChange() {
    this.page = 1;   // reset page
    this.getAllEmployee();
  }
  

}
