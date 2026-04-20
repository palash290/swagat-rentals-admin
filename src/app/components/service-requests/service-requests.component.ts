import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonService } from '../../services/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-service-requests',
  imports: [CommonModule, FormsModule],
  templateUrl: './service-requests.component.html',
  styleUrl: './service-requests.component.css'
})
export class ServiceRequestsComponent {

  page: number = 1;
  limit: number = 10;
  pagination: any;
  status: string = '';
  singleRequest: any;
  loading: boolean = false;
  employeeList: any;
  searchText: string = '';
  employeeId: any = null;
  requestsList: any;
  assignedDate: string = '';
  isUrgent: boolean = false;
  isAssigning: boolean = false;
  minServiceDate: string = '';
  userRole: string | null = null;
  // showAssignErrors: boolean = false;

  @ViewChild('closeAssignModal') closeAssignModal!: ElementRef;
  @ViewChild('resolvedProofVideo') resolvedProofVideo?: ElementRef<HTMLVideoElement>;

  constructor(private apiService: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    this.userRole = localStorage.getItem('role');
    this.getAllRequests();
    this.getAllEmployee();
    this.assignedDate = this.getTodayDate();
    this.minServiceDate = this.assignedDate;
  }

  getAllRequests() {
    let params = new URLSearchParams();

    if (this.searchText?.trim()) {
      params.append('search', this.searchText.trim());
    }
    if (this.status) {
      params.append('status', this.status);
    }

    params.append('page', this.page.toString());
    params.append('limit', this.limit.toString());

    this.apiService.get(`admin/service-requests?${params.toString()}`).subscribe({
      next: (resp: any) => {
        this.requestsList = resp.data.items;
        this.pagination = resp.data.pagination;
      },
      error: (error) => {
        this.requestsList = [];
      }
    });
  }

  getAllEmployee() {
    let params = new URLSearchParams();

    if (this.searchText?.trim()) {
      params.append('search', this.searchText.trim());
    }

    this.apiService.get(`admin/employees?${params.toString()}`).subscribe({
      next: (resp: any) => {
        this.employeeList = resp.data.items;
      },
      error: (error) => {
        this.employeeList = [];
      }
    });
  }

  onClientChange(clientId: any) {
    this.employeeId = clientId;

    if (this.employeeId) {
      this.getAllEmployee();
    }
  }

  changePage(page: number) {
    this.page = page;
    this.getAllRequests();
  }

  onStatusChange() {
    this.page = 1;
    this.getAllRequests();
  }

  getRequestDetail(detail: any) {
    this.singleRequest = detail;
    this.employeeId = null;
    this.assignedDate = this.getTodayDate();
    this.minServiceDate = this.assignedDate;
    this.isUrgent = false;
    // this.showAssignErrors = false;
  }

  pauseResolvedVideo() {
    const videoElement = this.resolvedProofVideo?.nativeElement;
    if (videoElement) {
      videoElement.pause();
      videoElement.currentTime = 0;
    }
  }

  assignServiceRequest() {
    if (this.userRole === 'sub_admin') {
      this.toastr.warning('You do not have permission to assign service requests.');
      return;
    }
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
      mark_as_urgent: this.isUrgent ? 1 : 0
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
          this.getAllRequests();
          this.loading = false;
        }
        this.isAssigning = false;
      },
      error: (error) => {
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

}
