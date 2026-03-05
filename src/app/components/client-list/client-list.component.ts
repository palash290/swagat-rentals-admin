import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonService } from '../../services/common.service';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
// ── Cross-field validator: agreement end date must be after start date ────────
function endDateAfterStart(group: AbstractControl): ValidationErrors | null {
  const start = group.get('agreement_start_date')?.value;
  const end = group.get('agreement_end_date')?.value;
  if (start && end && end <= start) {
    return { endDateBeforeStart: true };
  }
  return null;
}

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

  // Holds uploaded File objects keyed by document field name
  uploadedFiles: Record<string, File> = {};
  // Holds per-file validation error messages
  fileErrors: Record<string, string> = {};

  @ViewChild('closeModalAdd') closeModalAdd!: ElementRef;
  private readonly ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
  private readonly MAX_SIZE_MB = 5;
  private readonly PHONE_PATTERN = /^[6-9]\d{9}$/;
  private readonly GST_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;


  constructor(private apiService: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    this.getClientList();
    this.initForm();
  }


  initForm() {
    this.Form = new FormGroup(
      {
        // ── Basic Info ──────────────────────────────────────────────────────
        full_name: new FormControl('', Validators.required),
        company_name: new FormControl(''),
        company_address: new FormControl(''),
        gst_no: new FormControl('', [Validators.pattern(this.GST_PATTERN)]),
        mobile_no: new FormControl('', [Validators.required, Validators.pattern(this.PHONE_PATTERN)]),
        email: new FormControl('', [Validators.required, Validators.email]),

        // ── Contact Persons ─────────────────────────────────────────────────
        it_person_name: new FormControl(''),
        it_person_contact: new FormControl('', [Validators.pattern(this.PHONE_PATTERN)]),
        admin_contact_name: new FormControl(''),
        admin_contact_no: new FormControl('', [Validators.pattern(this.PHONE_PATTERN)]),

        // ── Infrastructure ──────────────────────────────────────────────────
        total_computers: new FormControl(0, [Validators.min(0)]),
        total_laptops: new FormControl(0, [Validators.min(0)]),
        total_servers: new FormControl(0, [Validators.min(0)]),
        total_gsm_gateway: new FormControl(0, [Validators.min(0)]),

        // ── Agreement Details ───────────────────────────────────────────────
        billing_date: new FormControl(''),
        agreement_start_date: new FormControl(''),
        agreement_end_date: new FormControl(''),
        security_cheque: new FormControl(''),
      },
      { validators: endDateAfterStart }
    );
  }

  // ── File upload handler ─────────────────────────────────────────────────────
  onFileChange(event: Event, fieldName: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.fileErrors[fieldName] = '';

    if (!file) return;

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      this.fileErrors[fieldName] = 'Only PDF, JPG, or PNG files are allowed.';
      input.value = '';
      return;
    }
    if (file.size > this.MAX_SIZE_MB * 1024 * 1024) {
      this.fileErrors[fieldName] = `File size must not exceed ${this.MAX_SIZE_MB} MB.`;
      input.value = '';
      return;
    }
    this.uploadedFiles[fieldName] = file;
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

  // onSubmit() {
  //   this.Form.markAllAsTouched();

  //   const full_name = this.Form.value.full_name?.trim();

  //   if (!full_name) {
  //     return;
  //   }

  //   if (this.Form.valid) {
  //     this.loading = true;
  //     const formURlData = new URLSearchParams();
  //     formURlData.append('full_name', full_name);
  //     formURlData.append('email', this.Form.value.email);

  //     this.apiService.post(this.clientId ? `user/phases/${this.clientId}` : 'admin/clients', formURlData.toString()).subscribe({
  //       next: (resp: any) => {
  //         if (resp.success == true) {
  //           this.toastr.success(resp.message);
  //           this.loading = false;
  //           this.closeModalAdd.nativeElement.click();
  //           this.getClientList();
  //           this.clientId = null;
  //           this.Form.reset();
  //         } else {
  //           this.toastr.warning(resp.message);
  //           this.loading = false;
  //           this.getClientList();
  //         }
  //       },
  //       error: (error) => {
  //         this.toastr.warning('Something went wrong.');
  //         console.log(error.message);
  //         this.loading = false;
  //       }
  //     });
  //   } else {
  //     this.loading = false;
  //     this.toastr.warning('Please check all the fields!');
  //   }
  // }

  onSubmit() {
    this.Form.markAllAsTouched();

    const full_name = this.Form.value.full_name?.trim();
    if (!full_name) return;

    if (this.Form.invalid) {
      this.loading = false;
      this.toastr.warning('Please check all the fields!');
      return;
    }

    this.loading = true;

    const formData = new FormData();
    // const formData = new URLSearchParams();

    // Append all reactive-form values
    const v = this.Form.value;
    formData.append('full_name', full_name);
    formData.append('company_name', v.company_name);
    formData.append('company_address', v.company_address);
    formData.append('gst_number', v.gst_no?.toUpperCase());
    formData.append('mobile_no', v.mobile_no);
    formData.append('email', v.email);
    formData.append('it_person_name', v.it_person_name);
    formData.append('it_person_contact_number', v.it_person_contact);
    formData.append('administration_contact_number', v.admin_contact_name);
    formData.append('admin_contact_no', v.admin_contact_no);
    formData.append('total_computers', v.total_computers);
    formData.append('total_laptops', v.total_laptops);
    formData.append('total_servers', v.total_servers);
    formData.append('total_gsm_gateways', v.total_gsm_gateway);
    formData.append('billing_date', v.billing_date);
    formData.append('agreement_start_date', v.agreement_start_date);
    formData.append('agreement_end_date', v.agreement_end_date);
    if (v.security_cheque) formData.append('security_cheque', v.security_cheque);

    // Append document files (if uploaded)
    const docFields = ['aadhaar_card', 'pan_card', 'office_rent_agreement', 'gst_certificate', 'gumasta'];
    docFields.forEach(field => {
      if (this.uploadedFiles[field]) {
        formData.append(field, this.uploadedFiles[field], this.uploadedFiles[field].name);
      }
    });

    const endpoint = 'admin/clients';

    this.apiService.post(endpoint, formData).subscribe({
      next: (resp: any) => {
        if (resp.success == true) {
          this.toastr.success(resp.message);
          this.loading = false;
          this.closeModalAdd.nativeElement.click();
          this.getClientList();
          this.clientId = null;
          this.uploadedFiles = {};
          this.fileErrors = {};
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
