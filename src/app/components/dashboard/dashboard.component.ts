import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonService } from '../../services/common.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import ApexCharts from 'apexcharts';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements AfterViewInit, OnDestroy {

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
  selectedPaymentId: number | null = null;
  selectedPaymentStatus: string = '';
  previousPaymentStatus: string = '';
  selectedPaymentNote: string = '';
  selectedPaymentImage: File | null = null;
  selectedPaymentRow: any = null;
  isUpdatingPaymentStatus: boolean = false;
  paymentAnalyticsChart: ApexCharts | null = null;
  serviceRequestAnalyticsChart: ApexCharts | null = null;

  @ViewChild('closeAssignModal') closeAssignModal!: ElementRef;
  @ViewChild('openPaymentStatusModalTrigger') openPaymentStatusModalTrigger!: ElementRef;
  @ViewChild('closePaymentStatusModalTrigger') closePaymentStatusModalTrigger!: ElementRef;
  @ViewChild('graphTabButton') graphTabButton!: ElementRef;
  @ViewChild('paymentAnalyticsChartRef') paymentAnalyticsChartRef!: ElementRef;
  @ViewChild('serviceRequestAnalyticsChartRef') serviceRequestAnalyticsChartRef!: ElementRef;

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
    this.getGraph();
    this.assignedDate = this.getTodayDate();
    this.minServiceDate = this.assignedDate;
  }

  ngAfterViewInit(): void {
    const graphTabEl = this.graphTabButton?.nativeElement as HTMLElement | undefined;
    if (!graphTabEl) return;

    graphTabEl.addEventListener('shown.bs.tab', this.handleGraphTabShown);
  }

  ngOnDestroy(): void {
    const graphTabEl = this.graphTabButton?.nativeElement as HTMLElement | undefined;
    if (graphTabEl) {
      graphTabEl.removeEventListener('shown.bs.tab', this.handleGraphTabShown);
    }
    this.paymentAnalyticsChart?.destroy();
    this.serviceRequestAnalyticsChart?.destroy();
  }

  paymentAnalyticsData: any;
  serviceRequestAnalyticsData: any;

  private handleGraphTabShown = () => {
    this.renderAnalyticsCharts();
  };

  getProfile() {
    this.apiService.get('admin/dashboard').subscribe({
      next: (resp: any) => {
        this.dashboardData = resp.data;
        this.renderAnalyticsCharts();
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  getGraph() {
    this.apiService.get('admin/payments/analytics').subscribe({
      next: (resp: any) => {
        this.paymentAnalyticsData = resp.data;
        this.renderAnalyticsCharts();
        this.getGraph2();
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  getGraph2() {
    this.apiService.get('admin/service-requests/analytics').subscribe({
      next: (resp: any) => {
        this.serviceRequestAnalyticsData = resp.data;
        this.renderAnalyticsCharts();
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

  private renderAnalyticsCharts(): void {
    this.renderPaymentAnalyticsChart();
    this.renderServiceRequestAnalyticsChart();
  }

  private renderPaymentAnalyticsChart(): void {
    const chartElement = this.paymentAnalyticsChartRef?.nativeElement as HTMLElement | undefined;

    if (!chartElement || !this.paymentAnalyticsData?.labels?.length) {
      return;
    }

    const options = {
      chart: {
        type: 'line',
        height: 360,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'inherit'
      },
      series: [
        {
          name: 'Total Amount',
          data: this.paymentAnalyticsData?.series?.total_amount ?? []
        },
        {
          name: 'Paid Amount',
          data: this.paymentAnalyticsData?.series?.paid_amount ?? []
        },
        {
          name: 'Remaining Amount',
          data: this.paymentAnalyticsData?.series?.remaining_amount ?? []
        }
      ],
      xaxis: {
        categories: (this.paymentAnalyticsData?.labels ?? []).map((label: string) => this.formatMonthLabel(label)),
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: {
          formatter: (value: number) => `${Math.round(value)}`
        }
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      colors: ['#0F172A', '#22C55E', '#F59E0B'],
      grid: {
        borderColor: '#E2E8F0',
        strokeDashArray: 4
      },
      markers: {
        size: 4,
        strokeWidth: 0,
        hover: { size: 6 }
      },
      dataLabels: { enabled: false },
      legend: {
        position: 'top',
        horizontalAlign: 'left'
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: (value: number) => `Rs ${value ?? 0}`
        }
      },
      noData: {
        text: 'No analytics data available'
      }
    };

    if (this.paymentAnalyticsChart) {
      this.paymentAnalyticsChart.updateOptions(options as any, true, true);
      return;
    }

    this.paymentAnalyticsChart = new ApexCharts(chartElement, options as any);
    this.paymentAnalyticsChart.render();
  }

  private renderServiceRequestAnalyticsChart(): void {
    const chartElement = this.serviceRequestAnalyticsChartRef?.nativeElement as HTMLElement | undefined;

    if (!chartElement || !this.serviceRequestAnalyticsData?.labels?.length) {
      return;
    }

    const options = {
      chart: {
        type: 'line',
        height: 360,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'inherit'
      },
      series: [
        {
          name: 'Total Requests',
          data: this.serviceRequestAnalyticsData?.series?.total_count ?? []
        },
        {
          name: 'Assigned',
          data: this.serviceRequestAnalyticsData?.series?.assigned_count ?? []
        },
        {
          name: 'In Process',
          data: this.serviceRequestAnalyticsData?.series?.in_process_count ?? []
        },
        {
          name: 'Completed',
          data: this.serviceRequestAnalyticsData?.series?.completed_count ?? []
        },
        {
          name: 'Pending',
          data: this.serviceRequestAnalyticsData?.series?.pending_count ?? []
        }
      ],
      xaxis: {
        categories: (this.serviceRequestAnalyticsData?.labels ?? []).map((label: string) => this.formatMonthLabel(label)),
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: {
          formatter: (value: number) => `${Math.round(value)}`
        }
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      colors: ['#0F172A', '#2563EB', '#F97316', '#22C55E', '#E11D48'],
      grid: {
        borderColor: '#E2E8F0',
        strokeDashArray: 4
      },
      markers: {
        size: 4,
        strokeWidth: 0,
        hover: { size: 6 }
      },
      dataLabels: { enabled: false },
      legend: {
        position: 'top',
        horizontalAlign: 'left'
      },
      tooltip: {
        shared: true,
        intersect: false
      },
      noData: {
        text: 'No analytics data available'
      }
    };

    if (this.serviceRequestAnalyticsChart) {
      this.serviceRequestAnalyticsChart.updateOptions(options as any, true, true);
      return;
    }

    this.serviceRequestAnalyticsChart = new ApexCharts(chartElement, options as any);
    this.serviceRequestAnalyticsChart.render();
  }

  private formatMonthLabel(label: string): string {
    const [year, month] = String(label ?? '').split('-');

    if (!year || !month) return label;

    const date = new Date(Number(year), Number(month) - 1, 1);

    return date.toLocaleString('en-US', {
      month: 'short',
      year: 'numeric'
    });
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
      this.openPaymentStatusModalTrigger?.nativeElement?.click();
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
    this.closePaymentStatusModalTrigger?.nativeElement?.click();
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
      formData.append('image', image, image.name);
    }

    this.isUpdatingPaymentStatus = true;

    this.apiService.put(`admin/payments/${id}/status`, formData).subscribe({
      next: (resp: any) => {
        this.isUpdatingPaymentStatus = false;
        this.toastr.success(resp.message || 'Status updated successfully!');
        this.resetPaymentStatusModal();
        this.closePaymentStatusModalTrigger?.nativeElement?.click();
        this.getRecentPayments();
      },
      error: (err) => {
        this.isUpdatingPaymentStatus = false;
        if (this.selectedPaymentRow) {
          this.selectedPaymentRow.payment_status =
            this.selectedPaymentRow._previousPaymentStatus ?? this.previousPaymentStatus ?? 'pending';
        }
        this.toastr.warning('Failed to update Status');
        this.resetPaymentStatusModal();
        this.closePaymentStatusModalTrigger?.nativeElement?.click();
        this.getRecentPayments();
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
    this.isUpdatingPaymentStatus = false;
  }


}
