import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonService } from '../../services/common.service';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
  Form!: FormGroup;
  clientId: any;

  @ViewChild('closeModalAdd') closeModalAdd!: ElementRef;


  constructor(private apiService: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    this.getClientList();
    this.initForm();
  }

  initForm() {
    this.Form = new FormGroup({
      full_name: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email])
    });
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

    const url = this.clientId
      ? `admin/clients/${this.clientId}`
      : 'admin/clients';


    this.apiService.get(url).subscribe({
      next: (resp: any) => {
        this.dashboardData = resp.data.items;
        this.pagination = resp.data.pagination;
      },
      error: (error) => {
        console.log(error.message);
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

      this.apiService.post(this.clientId ? `user/phases/${this.clientId}` : 'admin/clients', formURlData.toString()).subscribe({
        next: (resp: any) => {
          if (resp.success == true) {
            this.toastr.success(resp.message);
            this.loading = false;
            this.closeModalAdd.nativeElement.click();
            this.getClientList();
            this.clientId = null;
            this.Form.reset();
          } else {
            this.toastr.warning(resp.message);
            this.loading = false;
            this.getClientList();
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

  onStatusChange() {
    this.page = 1;   // reset page
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
      this.page = 1; // reset to first page on search
      this.getClientList();
    }, 500); // 500ms debounce
  }


}
