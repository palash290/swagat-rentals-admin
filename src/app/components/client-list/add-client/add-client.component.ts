import { Component, OnDestroy } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
export class AddClientComponent implements OnDestroy {

  loading: boolean = false;
  Form!: FormGroup;
  clientId: any;

  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
  private readonly MAX_SIZE_MB = 30;
  private readonly MAX_FILES_PER_DOC = 10;
  private readonly PHONE_PATTERN = /^[6-9]\d{9}$/;
  private readonly GST_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  // Holds uploaded File objects keyed by document field name
  uploadedFiles: Record<string, File[]> = {};
  // Holds preview info for selected files
  selectedFilePreviews: Record<string, { url: string; isPdf: boolean }[]> = {};
  // Holds per-file validation error messages
  fileErrors: Record<string, string> = {};
  // Holds existing uploaded documents in edit mode (url + id)
  existingDocs: Record<string, { id: number | string | null, url: string }[]> = {};
  // Holds IDs of removed KYC docs for update API
  deleteKycIds: Array<number | string> = [];

  constructor(
    private apiService: CommonService,
    private toastr: NzMessageService,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.clientId = params['clientId'];
    });
    this.initForm();
    this.getClientDetails();
  }

  ngOnDestroy(): void {
    this.clearAllSelectedFiles();
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
          // security_cheque_number: client?.security_cheque_number ?? ''
        });

        this.existingDocs = {};
        this.deleteKycIds = [];
        (client?.documents ?? []).forEach((doc: any) => {
          const fieldName = this.mapDocTypeToField(doc?.doc_type);
          const docUrl = this.getDocUrl(doc);
          if (fieldName && docUrl) {
            if (!this.existingDocs[fieldName]) {
              this.existingDocs[fieldName] = [];
            }
            this.existingDocs[fieldName].push({
              id: this.getDocId(doc),
              url: docUrl
            });
          }
        });
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  private mapDocTypeToField(docType: string): string | null {
    const normalized = String(docType ?? '')
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');
    const mapping: Record<string, string> = {
      aadhar_card: 'aadhaar_card',
      aadhaar_card: 'aadhaar_card',
      security_cheque: 'security_cheque',
      pan_card: 'pan_card',
      office_rent_agreement: 'office_rent_agreement',
      gst_certificate: 'gst_certificate',
      gumasta: 'gumasta'
    };
    return mapping[normalized] ?? null;
  }

  private getDocId(doc: any): number | string | null {
    return doc?.id ?? doc?.kyc_id ?? doc?.kycId ?? null;
  }

  private getDocUrl(doc: any): string {
    return String(
      doc?.doc_url ??
      doc?.document_url ??
      doc?.file_url ??
      doc?.url ??
      doc?.path ??
      ''
    ).trim();
  }

  initForm() {
    this.Form = new FormGroup(
      {
        // ── Basic Info ──────────────────────────────────────────────────────
        full_name: new FormControl('', Validators.required),
        company_name: new FormControl(''),
        company_address: new FormControl(''),
        gst_no: new FormControl(''),
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
        // security_cheque_number: new FormControl(''),
      },
      { validators: endDateAfterStart }
    );
  }

  // ── File upload handler ─────────────────────────────────────────────────────
  onFileChange(event: Event, fieldName: string): void {
    const input = event.target as HTMLInputElement;
    const selectedFiles = Array.from(input.files ?? []);
    this.fileErrors[fieldName] = '';

    if (!selectedFiles.length) return;

    const invalidType = selectedFiles.find(file => !this.ALLOWED_TYPES.includes(file.type));
    if (invalidType) {
      this.fileErrors[fieldName] = 'Only JPG, PNG, WEBP, or PDF files are allowed.';
      input.value = '';
      return;
    }

    const oversized = selectedFiles.find(file => file.size > this.MAX_SIZE_MB * 1024 * 1024);
    if (oversized) {
      this.fileErrors[fieldName] = `File size must not exceed ${this.MAX_SIZE_MB} MB.`;
      input.value = '';
      return;
    }

    const previousFiles = this.uploadedFiles[fieldName] ?? [];
    const mergedFiles = [...previousFiles, ...selectedFiles];
    if (mergedFiles.length > this.MAX_FILES_PER_DOC) {
      this.fileErrors[fieldName] = `You can upload a maximum of ${this.MAX_FILES_PER_DOC} files for this document.`;
      input.value = '';
      return;
    }

    this.uploadedFiles[fieldName] = mergedFiles;
    this.setSelectedPreviews(fieldName, mergedFiles);
    input.value = '';
  }

  removeSelectedFile(fieldName: string, index: number): void {
    const files = this.uploadedFiles[fieldName] ?? [];
    const previews = this.selectedFilePreviews[fieldName] ?? [];
    const previewToRevoke = previews[index]?.url;
    if (previewToRevoke) {
      URL.revokeObjectURL(previewToRevoke);
    }

    this.uploadedFiles[fieldName] = files.filter((_, i) => i !== index);
    this.selectedFilePreviews[fieldName] = previews.filter((_, i) => i !== index);
    if (!this.uploadedFiles[fieldName].length) {
      delete this.uploadedFiles[fieldName];
      delete this.selectedFilePreviews[fieldName];
    }
  }

  removeExistingDoc(fieldName: string, index: number): void {
    const docs = this.existingDocs[fieldName] ?? [];
    const doc = docs[index];
    if (!doc) return;

    if (this.clientId && doc.id !== null && doc.id !== undefined) {
      this.deleteKycIds.push(doc.id);
    }

    this.existingDocs[fieldName] = docs.filter((_, i) => i !== index);
    if (!this.existingDocs[fieldName].length) {
      delete this.existingDocs[fieldName];
    }
  }

  private setSelectedPreviews(fieldName: string, files: File[]): void {
    this.revokeSelectedPreviews(fieldName);
    this.selectedFilePreviews[fieldName] = files.map(file => ({
      url: URL.createObjectURL(file),
      isPdf: file.type === 'application/pdf'
    }));
  }

  private revokeSelectedPreviews(fieldName: string): void {
    (this.selectedFilePreviews[fieldName] ?? []).forEach(preview => URL.revokeObjectURL(preview.url));
    delete this.selectedFilePreviews[fieldName];
  }

  private clearAllSelectedFiles(): void {
    Object.keys(this.selectedFilePreviews).forEach(fieldName => {
      this.revokeSelectedPreviews(fieldName);
    });
    this.uploadedFiles = {};
  }

  isPdfUrl(url: string): boolean {
    return /\.pdf(\?|#|$)/i.test(url ?? '');
  }

  getSafePdfUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
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
    // if (v.security_cheque_number) formData.append('security_cheque_number', v.security_cheque_number);

    // Append document files (if uploaded)
    const docFields = ['aadhaar_card', 'security_cheque', 'pan_card', 'office_rent_agreement', 'gst_certificate', 'gumasta'];
    docFields.forEach(field => {
      (this.uploadedFiles[field] ?? []).forEach(file => {
        formData.append(field, file, file.name);
      });
    });

    if (this.clientId && this.deleteKycIds.length) {
      formData.append('deleteKycIds', JSON.stringify(this.deleteKycIds));
    }

    const endpoint = this.clientId ? `admin/clients/${this.clientId}` : 'admin/clients';

    this.apiService.post(endpoint, formData).subscribe({
      next: (resp: any) => {
        if (resp.success == true) {
          this.toastr.success(resp.message);
          this.router.navigateByUrl('/home/client-list');
          this.loading = false;
          this.clearAllSelectedFiles();
          this.fileErrors = {};
          this.deleteKycIds = [];
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
