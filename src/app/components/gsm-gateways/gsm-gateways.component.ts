import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonService } from '../../services/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-gsm-gateways',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './gsm-gateways.component.html',
  styleUrl: './gsm-gateways.component.css'
})
export class GsmGatewaysComponent {

  gatewayList: any[] = [];
  pagination: any;
  search: string = '';
  searchTimeout: any;
  page: number = 1;
  limit: number = 10;
  loading: boolean = false;
  isSubmitting: boolean = false;

  gatewayId: number | null = null;
  isEditMode: boolean = false;
  form: any = {
    gateway_name: '',
    number_of_port: '',
    model_number: '',
    manufacturer: '',
    total_quantity: '',
  };

  @ViewChild('closeModalGateway') closeModalGateway!: ElementRef;
  @ViewChild('closeModalDelete') closeModalDelete!: ElementRef;

  constructor(private apiService: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    this.getGatewayList();
  }

  getGatewayList() {
    const params = new URLSearchParams({
      search: this.search || '',
      page: this.page.toString(),
      limit: this.limit.toString()
    });

    this.apiService.get(`admin/gsm-gateways?${params.toString()}`).subscribe({
      next: (resp: any) => {
        this.gatewayList = resp.data.items;
        this.pagination = resp.data.pagination;
      },
      error: (error) => {
        console.log(error.message);
        this.gatewayList = [];
      }
    });
  }

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getGatewayList();
    }, 500);
  }

  changePage(page: number) {
    this.page = page;
    this.getGatewayList();
  }

  openAddModal() {
    this.isEditMode = false;
    this.gatewayId = null;
    this.form = {
      gateway_name: '',
      number_of_port: '',
      model_number: '',
      manufacturer: '',
      total_quantity: '',
    };
  }

  openEditModal(item: any) {
    this.isEditMode = true;
    this.gatewayId = item?.id ?? null;
    this.form = {
      gateway_name: item?.gateway_name || '',
      number_of_port: item?.number_of_port || '',
      model_number: item?.model_number || '',
      manufacturer: item?.manufacturer || '',
      total_quantity: item?.total_quantity ?? '',
    };
  }

  submitGateway() {
    if (!this.form.gateway_name?.trim()) {
      this.toastr.warning('Please enter gateway name.');
      return;
    }

    if (this.form.number_of_port === null || this.form.number_of_port === undefined || this.form.number_of_port === '') {
      this.toastr.warning('Please enter number of port.');
      return;
    }

    if (!this.form.total_quantity && this.form.total_quantity !== 0) {
      this.toastr.warning('Please enter total quantity.');
      return;
    }

    this.isSubmitting = true;
    this.loading = true;
    
    const payload = {
      gateway_name: this.form.gateway_name,
      number_of_port: Number(this.form.number_of_port),
      model_number: this.form.model_number,
      manufacturer: this.form.manufacturer,
      total_quantity: Number(this.form.total_quantity),
    };

    if (this.isEditMode && this.gatewayId) {
      this.apiService.put(`admin/gsm-gateways/${this.gatewayId}`, payload).subscribe({
        next: (resp: any) => {
          this.toastr.success(resp.message || 'Gateway updated.');
          this.isSubmitting = false;
          this.loading = false;
          this.getGatewayList();
          this.closeModalGateway.nativeElement.click();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.loading = false;
          const msg = error.error?.message || error.message || 'Something went wrong.';
          this.toastr.error(msg);
        }
      });
    } else {
      this.apiService.post(`admin/gsm-gateways`, payload).subscribe({
        next: (resp: any) => {
          this.toastr.success(resp.message || 'Gateway added.');
          this.isSubmitting = false;
          this.loading = false;
          this.getGatewayList();
          this.closeModalGateway.nativeElement.click();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.loading = false;
          const msg = error.error?.message || error.message || 'Something went wrong.';
          this.toastr.error(msg);
        }
      });
    }
  }

  openDeleteModal(item: any) {
    this.gatewayId = item?.id ?? null;
  }

  deleteGateway() {
    if (!this.gatewayId) return;

    this.loading = true;
    this.apiService.delete(`admin/gsm-gateways/${this.gatewayId}`).subscribe({
      next: (resp: any) => {
        this.closeModalDelete.nativeElement.click();
        this.toastr.success(resp.message || 'Gateway removed.');
        this.loading = false;
        this.gatewayId = null;
        this.getGatewayList();
      },
      error: (error) => {
        this.loading = false;
        const msg = error.error?.message || error.message || 'Something went wrong.';
        this.toastr.error(msg);
      }
    });
  }


}
