import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonService } from '../../services/common.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  dashboardData: any;
  requestsList: any;
  employeeList: any;
  paymentsList: any;
  singleRequest: any;
  employeeId: any = null;
  assignedDate: string = '';
  minServiceDate: string = '';
  isUrgent: boolean = false;
  isAssigning: boolean = false;
  showAssignErrors: boolean = false;
  userRole: string | null = null;

  @ViewChild('closeAssignModal') closeAssignModal!: ElementRef;

  constructor(private apiService: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    // this.apiService.refreshSidebar$.subscribe(() => {
    //   this.getProfile();
    // });
    this.userRole = localStorage.getItem('role');
    this.getProfile();
    this.getRecentRequests();
    this.getRecentPayments();
    this.getAllEmployee();
    this.assignedDate = this.getTodayDate();
    this.minServiceDate = this.assignedDate;
  }

  getProfile() {
    this.apiService.get('admin/dashboard').subscribe({
      next: (resp: any) => {
        this.dashboardData = resp.data;
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  getRecentRequests() {
    const params = new URLSearchParams();
    params.append('page', '1');
    params.append('limit', '5');

    this.apiService.get(`admin/service-requests?${params.toString()}`).subscribe({
      next: (resp: any) => {
        this.requestsList = resp.data.items;
      },
      error: () => {
        this.requestsList = [];
      }
    });
  }

  getRecentPayments() {
    const params = new URLSearchParams();
    params.append('page', '1');
    params.append('limit', '5');

    this.apiService.get(`admin/payments?${params.toString()}`).subscribe({
      next: (resp: any) => {
        this.paymentsList = resp.data.data;
      },
      error: () => {
        this.paymentsList = [];
      }
    });
  }

  getAllEmployee() {
    const params = new URLSearchParams();
    params.append('page', '1');
    params.append('limit', '100');

    this.apiService.get(`admin/employees?${params.toString()}`).subscribe({
      next: (resp: any) => {
        this.employeeList = resp.data.items;
      },
      error: () => {
        this.employeeList = [];
      }
    });
  }

  getRequestDetail(detail: any) {
    this.singleRequest = detail;
    this.employeeId = null;
    this.assignedDate = this.getTodayDate();
    this.minServiceDate = this.assignedDate;
    this.isUrgent = false;
    this.showAssignErrors = false;
  }

  loading: boolean = false;

  assignServiceRequest() {
    if (!this.singleRequest?.id) {
      this.toastr.warning('Please select a service request.');
      return;
    }
    if (!this.employeeId) {
      this.toastr.warning('Please select employee.');
      return;
    }
    if (!this.assignedDate) {
      this.toastr.warning('Please select service date.');
      return;
    }
    this.loading = true;

    const assignedAt = this.buildAssignedAt(this.assignedDate);
    const payload = {
      employee_id: Number(this.employeeId),
      assigned_at: assignedAt,
      is_urgent: this.isUrgent ? 1 : 0
    };

    this.isAssigning = true;
    this.apiService.post(`admin/service-requests/${this.singleRequest.id}/assign`, payload).subscribe({
      next: (resp: any) => {
        if (resp?.success === false) {
          this.toastr.warning(resp?.message || 'Unable to assign service request.');
          this.loading = false;
        } else {
          this.toastr.success(resp?.message || 'Service request assigned.');
          this.closeAssignModal?.nativeElement?.click();
          this.getRecentRequests();
          this.loading = false;
        }
        this.isAssigning = false;
      },
      error: () => {
        this.loading = false;
        this.toastr.warning('Something went wrong.');
        this.isAssigning = false;
      }
    });
  }

  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private buildAssignedAt(dateValue: string): string {
    const safeDate = dateValue || this.getTodayDate();
    const [year, month, day] = safeDate.split('-');
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
        this.getRecentPayments();
      },
      error: (err) => {
        this.toastr.warning('Failed to update Status');
        this.getRecentPayments();
      }
    });
  }


}
