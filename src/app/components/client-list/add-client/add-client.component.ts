import { Component } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
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
  selector: 'app-add-client',
  imports: [RouterLink, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-client.component.html',
  styleUrl: './add-client.component.css'
})
export class AddClientComponent {

  loading: boolean = false;
  Form!: FormGroup;
  clientId: any;

  private readonly ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
  private readonly MAX_SIZE_MB = 5;
  private readonly PHONE_PATTERN = /^[6-9]\d{9}$/;
  private readonly GST_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  // Holds uploaded File objects keyed by document field name
  uploadedFiles: Record<string, File> = {};
  // Holds per-file validation error messages
  fileErrors: Record<string, string> = {};
  // Holds existing uploaded document URLs in edit mode
  existingDocUrls: Record<string, string> = {};

  constructor(private apiService: CommonService, private toastr: NzMessageService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.clientId = params['clientId'];
    });
    this.initForm();
    this.getClientDetails();
  }

  getClientDetails() {
    if (!this.clientId) return;

    this.apiService.get(`admin/clients/${this.clientId}`).subscribe({
      next: (resp: any) => {
        const client = resp?.data ?? resp;

        this.Form.patchValue({
          full_name: client?.full_name ?? '',
          company_name: client?.company_name ?? '',
          company_address: client?.company_address ?? '',
          gst_no: client?.gst_number ?? client?.gst_no ?? '',
          mobile_no: client?.mobile_no ?? client?.phone_number ?? '',
          email: client?.email ?? '',
          it_person_name: client?.it_person_name ?? '',
          it_person_contact: client?.it_person_contact_number ?? client?.it_person_contact ?? '',
          admin_contact_name: client?.administration_contact_name ?? client?.admin_contact_name ?? '',
          admin_contact_no: client?.administration_contact_number ?? client?.admin_contact_no ?? '',
          total_computers: Number(client?.total_computers ?? 0),
          total_laptops: Number(client?.total_laptops ?? 0),
          total_servers: Number(client?.total_servers ?? 0),
          total_gsm_gateway: Number(client?.total_gsm_gateways ?? client?.total_gsm_gateway ?? 0),
          billing_date: client?.billing_date ? String(client.billing_date).slice(0, 10) : '',
          agreement_start_date: client?.agreement_start_date ? String(client.agreement_start_date).slice(0, 10) : '',
          agreement_end_date: client?.agreement_end_date ? String(client.agreement_end_date).slice(0, 10) : '',
          security_cheque: client?.security_cheque ?? ''
        });

        this.existingDocUrls = {};
        (client?.documents ?? []).forEach((doc: any) => {
          const fieldName = this.mapDocTypeToField(doc?.doc_type);
          if (fieldName && doc?.doc_url) {
            this.existingDocUrls[fieldName] = doc.doc_url;
          }
        });
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  private mapDocTypeToField(docType: string): string | null {
    const normalized = String(docType ?? '').trim().toLowerCase();
    const mapping: Record<string, string> = {
      aadhar_card: 'aadhaar_card',
      aadhaar_card: 'aadhaar_card',
      pan_card: 'pan_card',
      office_rent_agreement: 'office_rent_agreement',
      gst_certificate: 'gst_certificate',
      gumasta: 'gumasta'
    };
    return mapping[normalized] ?? null;
  }

  isImageUrl(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(String(url ?? ''));
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
    delete this.existingDocUrls[fieldName];
  }

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

    const endpoint = this.clientId ? `admin/clients/${this.clientId}` : 'admin/clients';

    this.apiService.post(endpoint, formData).subscribe({
      next: (resp: any) => {
        if (resp.success == true) {
          this.toastr.success(resp.message);
          this.router.navigateByUrl('/home/client-list');
          this.loading = false;
          this.uploadedFiles = {};
          this.fileErrors = {};
          this.Form.reset();
        } else {
          this.toastr.warning(resp.message);
          this.loading = false;
        }
      },
      error: (error) => {
        this.toastr.warning('Something went wrong.');
        this.loading = false;
      }
    });
  }


}
