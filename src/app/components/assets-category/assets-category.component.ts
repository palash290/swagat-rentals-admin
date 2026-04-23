import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonService } from '../../services/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-assets-category',
  imports: [CommonModule, FormsModule],
  templateUrl: './assets-category.component.html',
  styleUrl: './assets-category.component.css'
})
export class AssetsCategoryComponent {

  page: number = 1;
  limit: number = 10;

  deviceList: any[] = [];
  selectedClientId: string = '';
  searchText: string = '';
  clientList: any;
  pagination: any;
  loading: boolean = false;
  isSubmitted: boolean = false;
  isEditMode: boolean = false;
  isSubmitting: boolean = false;
  searchTimeout: any;
  categoryId: number | null = null;
  form: any = {
    name: '',
    display_name: ''
  };

  @ViewChild('closeModalGateway') closeModalGateway!: ElementRef;
  @ViewChild('closeModalDelete') closeModalDelete!: ElementRef;

  constructor(private apiService: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    this.getAllTasks();
  }


  getAllTasks() {
    let params = new URLSearchParams();

    if (this.searchText?.trim()) {
      params.append('search', this.searchText.trim());
    }

    if (this.selectedClientId) {
      params.append('client_id', this.selectedClientId);
    }

    params.append('page', this.page.toString());
    params.append('limit', this.limit.toString());

    this.apiService.get(`assets/asset-categories?${params.toString()}`).subscribe({
      next: (resp: any) => {
        this.deviceList = resp?.data?.items ?? resp?.data ?? [];
        this.pagination = resp?.data?.pagination ?? null;
      },
      error: (error) => {
        console.log(error.message);
        this.deviceList = [];
      }
    });
  }

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getAllTasks();
    }, 500);
  }

  changePage(page: number) {
    this.page = page;
    this.getAllTasks();
  }

  openAddModal() {
    this.isEditMode = false;
    this.categoryId = null;
    this.isSubmitted = false;
    this.form = {
      name: '',
      display_name: ''
    };
  }

  openEditModal(item: any) {
    this.isEditMode = true;
    this.categoryId = Number(item?.id ?? item?.asset_category_id ?? 0) || null;
    this.isSubmitted = false;
    this.form = {
      name: item?.name ?? '',
      display_name: item?.display_name ?? ''
    };
  }

  openDeleteModal(item: any) {
    this.categoryId = Number(item?.id ?? item?.asset_category_id ?? 0) || null;
  }

  isFieldInvalid(field: 'name' | 'display_name'): boolean {
    return !String(this.form[field] ?? '').trim();
  }

  getNameError(): string {
    return 'Name is required.';
  }

  getDisplayNameError(): string {
    return 'Display name is required.';
  }

  submitAgreement() {
    this.isSubmitted = true;

    if (this.isFieldInvalid('name')) {
      this.toastr.warning(this.getNameError());
      return;
    }

    if (this.isFieldInvalid('display_name')) {
      this.toastr.warning(this.getDisplayNameError());
      return;
    }

    const payload = {
      name: this.form.name.trim(),
      display_name: this.form.display_name.trim()
    };

    this.isSubmitting = true;
    this.loading = true;

    const request = this.isEditMode && this.categoryId
      ? this.apiService.put(`assets/asset-categories/${this.categoryId}`, payload)
      : this.apiService.post(`assets/asset-categories`, payload);

    request.subscribe({
      next: (resp: any) => {
        this.toastr.success(resp.message || (this.isEditMode ? 'Category updated.' : 'Category added.'));
        this.isSubmitting = false;
        this.loading = false;
        this.page = 1;
        this.getAllTasks();
        this.closeModalGateway?.nativeElement.click();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.loading = false;
        const msg = error.error?.message || error.message || 'Something went wrong.';
        this.toastr.error(msg);
      }
    });
  }

  deleteCategory() {
    if (!this.categoryId) return;

    this.loading = true;
    this.apiService.delete(`assets/asset-categories/${this.categoryId}`).subscribe({
      next: (resp: any) => {
        this.closeModalDelete?.nativeElement.click();
        this.toastr.success(resp.message || 'Category removed.');
        this.loading = false;
        this.categoryId = null;
        this.page = 1;
        this.getAllTasks();
      },
      error: (error) => {
        this.loading = false;
        const msg = error.error?.message || error.message || 'Something went wrong.';
        this.toastr.error(msg);
      }
    });
  }


}
