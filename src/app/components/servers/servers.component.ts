import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'app-servers',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './servers.component.html',
  styleUrl: './servers.component.css'
})
export class ServersComponent {

  serverList: any[] = [];
  pagination: any;
  search: string = '';
  searchTimeout: any;
  page: number = 1;
  limit: number = 10;
  loading: boolean = false;
  isSubmitting: boolean = false;

  serverId: number | null = null;
  isEditMode: boolean = false;
  form: any = {
    server_name: '',
    processor: '',
    ram: '',
    ssd: '',
    hdd: '',
    brand: '',
    total_quantity: ''
  };

  @ViewChild('closeModalGateway') closeModalGateway!: ElementRef;
  @ViewChild('closeModalDelete') closeModalDelete!: ElementRef;

  constructor(private apiService: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    this.getServerList();
  }

  getServerList() {
    const params = new URLSearchParams({
      search: this.search || '',
      page: this.page.toString(),
      limit: this.limit.toString()
    });

    this.apiService.get(`admin/servers?${params.toString()}`).subscribe({
      next: (resp: any) => {
        this.serverList = resp.data.items;
        this.pagination = resp.data.pagination;
      },
      error: (error) => {
        console.log(error.message);
        this.serverList = [];
      }
    });
  }

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getServerList();
    }, 500);
  }

  changePage(page: number) {
    this.page = page;
    this.getServerList();
  }

  openAddModal() {
    this.isEditMode = false;
    this.serverId = null;
    this.form = {
      server_name: '',
      processor: '',
      ram: '',
      ssd: '',
      hdd: '',
      brand: '',
      total_quantity: ''
    };
  }

  openEditModal(item: any) {
    this.isEditMode = true;
    this.serverId = item?.id ?? null;
    this.form = {
      server_name: item?.server_name || '',
      processor: item?.processor || '',
      ram: item?.ram || '',
      ssd: item?.ssd || '',
      hdd: item?.hdd || '',
      brand: item?.brand || '',
      total_quantity: item?.total_quantity ?? ''
    };
  }

  submitServer() {
    if (!this.form.server_name?.trim()) {
      this.toastr.warning('Please enter server name.');
      return;
    }

    if (!this.form.total_quantity && this.form.total_quantity !== 0) {
      this.toastr.warning('Please enter total quantity.');
      return;
    }

    this.isSubmitting = true;
    this.loading = true;

    const payload = {
      server_name: this.form.server_name,
      processor: this.form.processor,
      ram: this.form.ram,
      ssd: this.form.ssd,
      hdd: this.form.hdd,
      brand: this.form.brand,
      total_quantity: Number(this.form.total_quantity)
    };

    if (this.isEditMode && this.serverId) {
      this.apiService.put(`admin/servers/${this.serverId}`, payload).subscribe({
        next: (resp: any) => {
          this.toastr.success(resp.message || 'Server updated.');
          this.isSubmitting = false;
          this.loading = false;
          this.getServerList();
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
      this.apiService.post(`admin/servers`, payload).subscribe({
        next: (resp: any) => {
          this.toastr.success(resp.message || 'Server added.');
          this.isSubmitting = false;
          this.loading = false;
          this.getServerList();
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
    this.serverId = item?.id ?? null;
  }

  deleteServer() {
    if (!this.serverId) return;

    this.loading = true;
    this.apiService.delete(`admin/servers/${this.serverId}`).subscribe({
      next: (resp: any) => {
        this.closeModalDelete.nativeElement.click();
        this.toastr.success(resp.message || 'Server removed.');
        this.loading = false;
        this.serverId = null;
        this.getServerList();
      },
      error: (error) => {
        this.loading = false;
        const msg = error.error?.message || error.message || 'Something went wrong.';
        this.toastr.error(msg);
      }
    });
  }


}
