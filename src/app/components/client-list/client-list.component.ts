import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonService } from '../../services/common.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';


@Component({
  selector: 'app-client-list',
  imports: [RouterLink, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.css'
})
export class ClientListComponent {

  dashboardData: any[] = [];
  pagination: any;
  search: string = '';
  searchTimeout: any;
  kycStatus: string = '';
  dateFrom: string = '';
  dateTo: string = '';
  page: number = 1;
  limit: number = 10;
  loading: boolean = false;
  clientId: any;

  constructor(private apiService: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    this.getClientList();
  }

  getClientList() {
    const params = new URLSearchParams({
      search: this.search || '',
      kyc_status: this.kycStatus || '',
      date_from: this.dateFrom || '',
      date_to: this.dateTo || '',
      page: this.page.toString(),
      limit: this.limit.toString()
    });

    this.apiService.get(`admin/clients?${params.toString()}`).subscribe({
      next: (resp: any) => {
        this.dashboardData = resp.data.items;
        this.pagination = resp.data.pagination;
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  onStatusChange() {
    this.page = 1;
    this.getClientList();
  }

  onDateChange(event: any) {
    this.dateFrom = event.target.value;
    this.dateTo = event.target.value;
    this.page = 1;
    this.getClientList();
  }

  changePage(page: number) {
    this.page = page;
    this.getClientList();
  }

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getClientList();
    }, 500);
  }

  nextStatus!: number;
  selectedUser: any;
  @ViewChild('closeModalBlock') closeModalBlock!: ElementRef;

  get modalTitle(): string {
    return this.nextStatus === 1 ? 'Block Client' : 'Unblock Client';
  }

  get modalMessage(): string {
    return this.nextStatus === 1
      ? 'Are you sure you want to block this client?'
      : 'Are you sure you want to unblock this client?';
  }

  get confirmBtnText(): string {
    return this.nextStatus === 1 ? 'Yes, Block' : 'Yes, Unblock';
  }

  onToggleUser(item: any) {
    this.selectedUser = item;
    this.clientId = item.id;
    this.nextStatus = item.is_disabled == 1 ? 0 : 1;
  }

  confirmToggle() {
    this.loading = true;
    const formURlData = new URLSearchParams();
    if (this.nextStatus == 0) {
      formURlData.set('is_disabled', 'false');
    }

    if (this.nextStatus == 1) {
      formURlData.set('is_disabled', 'true');
    }

    this.apiService.patch(`admin/client/${this.clientId}/block`, formURlData.toString()).subscribe({
      next: (resp: any) => {
        this.selectedUser.is_disabled = this.nextStatus;
        this.closeModalBlock.nativeElement.click();
        this.loading = false;
        this.toastr.success(resp.message);
      },
      error: (err) => {
        this.loading = false;
      }
    });
  }

  @ViewChild('blockModal') blockModal!: ElementRef;

  ngAfterViewInit() {
    const modalEl = this.blockModal.nativeElement;

    modalEl.addEventListener('hidden.bs.modal', () => {
      this.getClientList();
    });
  }


}