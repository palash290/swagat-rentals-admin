import { Component, OnDestroy } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CountryISO, NgxIntlTelInputModule, SearchCountryField } from 'ngx-intl-tel-input-gg';

@Component({
  selector: 'app-add-employee',
  imports: [RouterLink, CommonModule, FormsModule, ReactiveFormsModule, NgxIntlTelInputModule],
  templateUrl: './add-employee.component.html',
  styleUrl: './add-employee.component.css'
})
export class AddEmployeeComponent implements OnDestroy {

  loading: boolean = false;
  Form!: FormGroup;
  employeeId: any;
  userEmail: any;

  SearchCountryField = SearchCountryField
  CountryISO = CountryISO;
  selectedCountry = CountryISO.India;

  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
  private readonly IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  private readonly MAX_SIZE_MB = 30;
  private readonly MAX_FILES_PER_DOC = 10;

  uploadedFiles: Record<string, File[]> = {};
  selectedFilePreviews: Record<string, { url: string; isPdf: boolean }[]> = {};
  fileErrors: Record<string, string> = {};
  existingDocs: Record<string, { id: number | string | null; url: string }[]> = {};
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
      this.employeeId = params['employeeId'];
    });
    this.initForm();
  }

  ngOnDestroy(): void {
    this.clearAllSelectedFiles();
  }

  private toDateInput(value: any): string {
    if (!value) return '';
    return String(value).slice(0, 10);
  }

  private withTime(value: string): string {
    if (!value) return '';
    const trimmed = String(value).trim();
    if (trimmed.length === 10) return `${trimmed} 00:00:00`;
    return trimmed;
  }

  getEmployeeDetails() {
    if (!this.employeeId) return;

    this.apiService.get(`admin/employees/${this.employeeId}`).subscribe({
      next: (resp: any) => {
        const employee = resp?.data ?? resp;
        debugger
        this.userEmail = employee?.email;

        const dialCode = String(employee?.country_code ?? '').trim();
        const phoneNumber = String(employee?.phone_number ?? employee?.mobile ?? employee?.mobile_no ?? '').trim();
        const combinedPhone = dialCode && phoneNumber ? `${dialCode}${phoneNumber}` : phoneNumber;

        this.Form.patchValue({
          full_name: employee?.full_name ?? employee?.name ?? '',
          date_of_birth: this.toDateInput(employee?.date_of_birth ?? employee?.dob),
          gender: employee?.gender ?? '',
          phone_number: combinedPhone,
          email: employee?.email ?? '',
          current_address: employee?.current_address ?? employee?.address ?? '',
          permanent_address: employee?.permanent_address ?? '',
          designation: employee?.designation ?? employee?.job_role ?? '',
          employment_from: this.toDateInput(employee?.employment_from ?? employee?.employment_start),
          employment_to: this.toDateInput(employee?.employment_to ?? employee?.employment_end),
          ctc_breakdown: employee?.ctc_breakdown ?? '',
          bank_account_number: employee?.bank_account_number ?? employee?.account_number ?? '',
          ifsc_code: employee?.ifsc_code ?? '',
          bank_name: employee?.bank_name ?? ''
        });

        this.existingDocs = {};
        this.deleteKycIds = [];
        (employee?.documents ?? []).forEach((doc: any) => {
          const fieldName = this.mapDocTypeToField(doc?.doc_type);
          const docUrl = this.getDocUrl(doc);
          if (!fieldName || !docUrl) return;
          if (!this.existingDocs[fieldName]) {
            this.existingDocs[fieldName] = [];
          }
          this.existingDocs[fieldName].push({
            id: doc?.id ?? null,
            url: docUrl
          });
        });

        const profileUrl = String(employee?.profile_image ?? '').trim();
        if (profileUrl && !this.existingDocs['selfie']?.length) {
          this.existingDocs['selfie'] = [{ id: null, url: this.toAbsoluteUrl(profileUrl) }];
        }
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
      aadhar_card: 'aadhar_card',
      aadhaar_card: 'aadhar_card',
      other_documents: 'other_documents',
      selfie: 'selfie'
    };
    return mapping[normalized] ?? null;
  }

  private getDocUrl(doc: any): string {
    return String(doc?.doc_url ?? doc?.document_url ?? doc?.file_url ?? doc?.url ?? doc?.path ?? '').trim();
  }

  private toAbsoluteUrl(path: string): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return `${this.apiService.baseUrl}${path.startsWith('/') ? path.slice(1) : path}`;
  }

  initForm() {
    this.Form = new FormGroup({
      full_name: new FormControl('', Validators.required),
      date_of_birth: new FormControl(''),
      gender: new FormControl(''),
      phone_number: new FormControl('', [Validators.required]),
      // email: new FormControl({ value: this.userEmail || '', disabled: true }),
      email: new FormControl('', [Validators.required, Validators.email]),
      current_address: new FormControl(''),
      permanent_address: new FormControl(''),
      designation: new FormControl(''),
      employment_from: new FormControl('', Validators.required),
      employment_to: new FormControl(''),
      ctc_breakdown: new FormControl(''),
      bank_account_number: new FormControl(''),
      ifsc_code: new FormControl(''),
      bank_name: new FormControl('')
    });
    if (this.employeeId) {
      this.getEmployeeDetails();
    }
  }

  onFileChange(event: Event, fieldName: string): void {
    const input = event.target as HTMLInputElement;
    const selectedFiles = Array.from(input.files ?? []);
    this.fileErrors[fieldName] = '';

    if (!selectedFiles.length) return;

    if (fieldName === 'selfie') {
      delete this.existingDocs['selfie'];
    }

    const allowMultiple = fieldName === 'aadhar_card' || fieldName === 'other_documents';
    const allowedTypes = fieldName === 'selfie' ? this.IMAGE_TYPES : this.ALLOWED_TYPES;
    const maxFiles = allowMultiple ? this.MAX_FILES_PER_DOC : 1;

    const invalidType = selectedFiles.find(file => !allowedTypes.includes(file.type));
    if (invalidType) {
      this.fileErrors[fieldName] = fieldName === 'selfie'
        ? 'Only JPG, PNG, or WEBP images are allowed.'
        : 'Only JPG, PNG, WEBP, or PDF files are allowed.';
      input.value = '';
      return;
    }

    const oversized = selectedFiles.find(file => file.size > this.MAX_SIZE_MB * 1024 * 1024);
    if (oversized) {
      this.fileErrors[fieldName] = `File size must not exceed ${this.MAX_SIZE_MB} MB.`;
      input.value = '';
      return;
    }

    const previousFiles = allowMultiple ? (this.uploadedFiles[fieldName] ?? []) : [];
    const mergedFiles = [...previousFiles, ...selectedFiles];
    if (mergedFiles.length > maxFiles) {
      this.fileErrors[fieldName] = `You can upload a maximum of ${maxFiles} files for this document.`;
      input.value = '';
      return;
    }

    const finalFiles = allowMultiple ? mergedFiles : mergedFiles.slice(0, 1);
    this.uploadedFiles[fieldName] = finalFiles;
    this.setSelectedPreviews(fieldName, finalFiles);
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
    if (fieldName === 'selfie') return;
    const docs = this.existingDocs[fieldName] ?? [];
    const doc = docs[index];
    if (!doc) return;

    if (this.employeeId && doc.id !== null && doc.id !== undefined) {
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

  getSafePdfUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  isPdfUrl(url: string): boolean {
    return /\.pdf(\?|#|$)/i.test(url ?? '');
  }

  onSubmit() {
    this.Form.markAllAsTouched();

    const full_name = (this.Form.value.full_name ?? '').trim();
    if (!full_name || this.Form.invalid) {
      this.toastr.warning('Please check all the fields!');
      return;
    }

    this.loading = true;

    const v = this.Form.value;
    const formData = new FormData();
    formData.append('full_name', full_name);
    formData.append('date_of_birth', this.withTime(v.date_of_birth ?? ''));
    formData.append('gender', v.gender ?? '');
    // const phoneVal = v.phone_number;
    // const dialCode = String(phoneVal?.dialCode ?? '').trim();
    // let phoneNumber =
    //   phoneVal?.number ??
    //   phoneVal?.nationalNumber ??
    //   (typeof phoneVal === 'string' ? phoneVal : '');
    // phoneNumber = String(phoneNumber ?? '').replace(/\s+/g, '');
    // if (dialCode && phoneNumber.startsWith(dialCode)) {
    //   phoneNumber = phoneNumber.slice(dialCode.length);
    // }
    // if (phoneNumber.startsWith('+')) {
    //   phoneNumber = phoneNumber.slice(1);
    // }
    // formData.append('country_code', dialCode);
    // formData.append('phone_number', phoneNumber);
    formData.append('country_code', v.phone_number?.dialCode);
    formData.append('phone_number', v.phone_number?.nationalNumber);
    formData.append('email', v.email ?? '');
    formData.append('current_address', v.current_address ?? '');
    formData.append('permanent_address', v.permanent_address ?? '');
    formData.append('designation', v.designation ?? '');
    formData.append('employment_from', this.withTime(v.employment_from ?? ''));
    formData.append('employment_to', this.withTime(v.employment_to ?? ''));
    formData.append('ctc_breakdown', v.ctc_breakdown ?? '');
    formData.append('bank_account_number', v.bank_account_number ?? '');
    formData.append('ifsc_code', v.ifsc_code ?? '');
    formData.append('bank_name', v.bank_name ?? '');

    const selfie = (this.uploadedFiles['selfie'] ?? [])[0];
    if (selfie) {
      formData.append('selfie', selfie, selfie.name);
    }

    (this.uploadedFiles['aadhar_card'] ?? []).forEach(file => {
      formData.append('aadhar_card', file, file.name);
    });

    (this.uploadedFiles['other_documents'] ?? []).forEach(file => {
      formData.append('other_documents', file, file.name);
    });

    if (this.employeeId && this.deleteKycIds.length) {
      formData.append('deleteDocIds', JSON.stringify(this.deleteKycIds));
    }

    const endpoint = this.employeeId ? `admin/employees/${this.employeeId}` : 'admin/employees';
    const request$ = this.employeeId
      ? this.apiService.put(endpoint, formData)
      : this.apiService.post(endpoint, formData);

    request$.subscribe({
      next: (resp: any) => {
        if (resp.success == true) {
          this.toastr.success(resp.message);
          this.router.navigateByUrl('/home/employees');
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
      error: () => {
        this.toastr.warning('Something went wrong.');
        this.loading = false;
      }
    });
  }

}
