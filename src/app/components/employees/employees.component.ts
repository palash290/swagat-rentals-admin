import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonService } from '../../services/common.service';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-employees',
  imports: [RouterLink, CommonModule, FormsModule, ReactiveFormsModule],
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

  Form!: FormGroup;
  loading: boolean = false;
  employeeId: any;
  @ViewChild('closeModalAdd') closeModalAdd!: ElementRef;
  @ViewChild('closeModalDelete') closeModalDelete!: ElementRef;
  @ViewChild('closeModalBlock') closeModalBlock!: ElementRef;

  constructor(private apiService: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    this.getAllEmployee();
    this.initForm();
  }

  initForm() {
    this.Form = new FormGroup({
      full_name: new FormControl('', Validators.required),
      email: new FormControl('', Validators.required),
    });
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

  onSubmit() {
    this.Form.markAllAsTouched();

    const full_name = this.Form.value.full_name?.trim();

    if (!full_name) {
      return;
    }

    if (this.Form.valid) {
      this.loading = true;
      const formURlData = new URLSearchParams();
      formURlData.append('full_name', full_name);
      formURlData.append('email', this.Form.value.email);

      this.apiService.post('admin/employees', formURlData.toString()).subscribe({
        next: (resp: any) => {
          if (resp.success == true) {
            this.toastr.success(resp.message);
            this.loading = false;
            this.closeModalAdd.nativeElement.click();
            this.getAllEmployee();
            this.Form.reset();
            this.employeeId = null;
          } else {
            this.toastr.warning(resp.message);
            this.loading = false;
            this.getAllEmployee();
          }
        },
        error: (error) => {
          this.toastr.warning('Something went wrong.');
          console.log(error.message);
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
      this.toastr.warning('Please check all the fields!');
    }
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
    this.page = 1;   // reset page
    this.getAllEmployee();
  }

  nextStatus!: number; // 0 or 1
  selectedUser: any;

  get modalTitle(): string {
    return this.nextStatus === 1 ? 'Block User' : 'Unblock User';
  }

  get modalMessage(): string {
    return this.nextStatus === 1
      ? 'Are you sure you want to block this user?'
      : 'Are you sure you want to unblock this user?';
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


}
