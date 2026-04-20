import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonService } from '../../services/common.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-employees',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.css'
})
export class EmployeesComponent {

  page: number = 1;
  limit: number = 10;

  employeeList: any;
  status: string = '';
  searchText: string = '';
  clientList: any;
  pagination: any;

  loading: boolean = false;
  employeeId: any;
  @ViewChild('closeModalDelete') closeModalDelete!: ElementRef;
  @ViewChild('closeModalBlock') closeModalBlock!: ElementRef;
  @ViewChild('closeModalSubAdmin') closeModalSubAdmin!: ElementRef;

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
      params.append('document_status', this.status);
    }

    params.append('page', this.page.toString());
    params.append('limit', this.limit.toString());

    this.apiService.get(`admin/employees?${params.toString()}`).subscribe({
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

  getId(id: any) {
    this.employeeId = id;
  }

  deleteTeam() {
    // if (!this.selectedPhaseId && this.isTaskExists) {
    //   this.toastr.warning('Please select phase first.');
    //   return
    // }

    this.apiService.delete(`admin/employees/${this.employeeId}`).subscribe({
      next: (resp: any) => {
        this.closeModalDelete.nativeElement.click();
        this.toastr.success(resp.message);
        this.getAllEmployee();
        this.employeeId = null;
      },
      error: error => {
        console.log(error.message);
      }
    });
  }

  changePage(page: number) {
    this.page = page;
    this.getAllEmployee();
  }

  onStatusChange() {
    this.page = 1;
    this.getAllEmployee();
  }

  nextStatus!: number; // 0 or 1
  selectedUser: any;
  selectedRoleUser: any;
  targetRole: 'sub_admin' | 'employee' = 'sub_admin';

  get modalTitle(): string {
    return this.nextStatus === 1 ? 'Block Employee' : 'Unblock Employee';
  }

  get modalMessage(): string {
    return this.nextStatus === 1
      ? 'Are you sure you want to block this employee?'
      : 'Are you sure you want to unblock this employee?';
  }

  get confirmBtnText(): string {
    return this.nextStatus === 1 ? 'Yes, Block' : 'Yes, Unblock';
  }

  onToggleUser(item: any) {
    this.selectedUser = item;
    this.employeeId = item.id;
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

    this.apiService.patch(`admin/employees/${this.employeeId}/block`, formURlData.toString()).subscribe({
      next: (resp: any) => {
        this.selectedUser.is_disabled = this.nextStatus;
        this.closeModalBlock.nativeElement.click();
        // this.getAllEmployee();
        this.loading = false;
        this.toastr.success(resp.message);
      }
    });
  }

  @ViewChild('blockModal') blockModal!: ElementRef;

  ngAfterViewInit() {
    const modalEl = this.blockModal.nativeElement;

    modalEl.addEventListener('hidden.bs.modal', () => {
      this.getAllEmployee();
    });
  }

  openSubAdminModal(item: any) {
    this.selectedRoleUser = item;
    this.employeeId = item.id;
    this.targetRole = item?.role === 'sub_admin' ? 'employee' : 'sub_admin';
  }

  confirmMakeSubAdmin() {
    if (!this.employeeId) return;
    this.loading = true;

    this.apiService.patch(`admin/employees/${this.employeeId}/role`, { role: this.targetRole }).subscribe({
      next: (resp: any) => {
        this.closeModalSubAdmin.nativeElement.click();
        this.loading = false;
        this.toastr.success(resp.message || 'Role updated.');
        this.getAllEmployee();
      },
      error: (error) => {
        this.loading = false;
        const msg =
          error.error?.message ||
          error.error?.error ||
          error.message ||
          'Something went wrong.';
        this.toastr.error(msg);
      }
    });
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
    formURlData.set('employee_id', id);
    formURlData.set('document_status', statusToUse);

    this.apiService.post(`admin/employee/document-approvals`, formURlData.toString()).subscribe({
      next: (resp: any) => {
        this.toastr.success(resp.message || 'Status updated successfully!');
        this.getAllEmployee();
      },
      error: (err) => {
        this.toastr.warning('Failed to update Status');
        this.getAllEmployee();
      }
    });


  }


}
