import { Component, HostListener, OnDestroy } from '@angular/core';
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
  billingDays: any;
  agreementStatus: string = '';

  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
  private readonly MAX_SIZE_MB = 30;
  private readonly MAX_FILES_PER_DOC = 10;
  private readonly PHONE_PATTERN = /^\+?[0-9]{10,15}$/;
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
    this.billingDays = Array.from({ length: 25 }, (_, i) => i + 1);
    this.route.queryParams.subscribe(params => {
      this.clientId = params['clientId'];
    });
    this.initForm();
    this.watchAgreementStartDate();
    this.getClientDetails();
    this.getServerList();
    this.getGatewayList();
  }

  ngOnDestroy(): void {
    this.clearAllSelectedFiles();
  }

  serverList: any[] = [];
  serverAllocations: Array<{ server_id: number; allocated_quantity: number }> = [];
  selectedServerIds: number[] = [];
  serverDropdownOpen: boolean = false;
  serverQtyErrors: Record<number, string> = {};
  gatewayList: any[] = [];
  gatewayAllocations: Array<{ gateway_id: number; allocated_quantity: number }> = [];
  selectedGatewayIds: number[] = [];
  gatewayDropdownOpen: boolean = false;
  gatewayQtyErrors: Record<number, string> = {};

  getServerList() {
    this.apiService.get(`admin/servers`).subscribe({
      next: (resp: any) => {
        this.serverList = resp.data.items;
      },
      error: (error) => {
        console.log(error.message);
        this.serverList = [];
      }
    });
  }

  getGatewayList() {
    this.apiService.get(`admin/gsm-gateways`).subscribe({
      next: (resp: any) => {
        this.gatewayList = resp.data.items;
      },
      error: (error) => {
        console.log(error.message);
        this.gatewayList = [];
      }
    });
  }

  getClientDetails() {
    if (!this.clientId) return;

    this.apiService.get(`admin/clients/${this.clientId}`).subscribe({
      next: (resp: any) => {
        const client = resp?.data ?? resp;
        this.agreementStatus = String(client?.agreement_status ?? '').toLowerCase();

        this.Form.patchValue({
          full_name: client?.full_name ?? '',
          company_name: client?.company_name ?? '',
          company_address: client?.company_address ?? '',
          gst_no: client?.gst_number ?? client?.gst_no ?? '',
          rent_amount: client?.rent_amount ?? '',
          payment_type: client?.payment_type ?? '',
          mobile_no: client?.mobile_no ?? client?.phone_number ?? '',
          email: client?.email ?? '',
          it_person_name: client?.it_person_name ?? '',
          it_person_contact: client?.it_person_contact_number ?? client?.it_person_contact ?? '',
          admin_contact_name: client?.administration_contact_name ?? client?.admin_contact_name ?? '',
          admin_contact_no: client?.administration_contact_number ?? client?.admin_contact_no ?? '',
          // total_computers: Number(client?.total_computers ?? 0),
          // total_laptops: Number(client?.total_laptops ?? 0),
          total_servers: Number(client?.total_servers ?? 0),
          total_gsm_gateway: Number(client?.total_gsm_gateways ?? client?.total_gsm_gateway ?? 0),
          billing_day: client?.billing_day ? String(client.billing_day).slice(0, 10) : '',
          agreement_start_date: client?.agreement_start_date ? String(client.agreement_start_date).slice(0, 10) : '',
          // security_cheque_number: client?.security_cheque_number ?? ''
        });
        this.updateAgreementLockedFields();
        this.syncAgreementEndDate(this.Form.get('agreement_start_date')?.value);

        const allocations = (client?.server_allocations ?? client?.server_allocation ?? []) as Array<any>;
        if (Array.isArray(allocations) && allocations.length) {
          this.serverAllocations = allocations.map(a => ({
            server_id: Number(a.server_id ?? a.server?.id ?? a.id),
            allocated_quantity: Number(a.allocated_quantity ?? a.quantity ?? 0)
          })).filter(a => !!a.server_id);
          this.selectedServerIds = this.serverAllocations.map(a => a.server_id);
          this.Form.patchValue({ server_ids: this.selectedServerIds });
        }

        const gatewayAllocations = (client?.gateway_allocations ?? client?.gateway_allocation ?? []) as Array<any>;
        if (Array.isArray(gatewayAllocations) && gatewayAllocations.length) {
          this.gatewayAllocations = gatewayAllocations.map(a => ({
            gateway_id: Number(a.gateway_id ?? a.gateway?.id ?? a.id),
            allocated_quantity: Number(a.allocated_quantity ?? a.quantity ?? 0)
          })).filter(a => !!a.gateway_id);
          this.selectedGatewayIds = this.gatewayAllocations.map(a => a.gateway_id);
          this.Form.patchValue({ gateway_ids: this.selectedGatewayIds });
        }

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
        rent_amount: new FormControl('', [Validators.required, Validators.min(1)]),
        payment_type: new FormControl(''),
        mobile_no: new FormControl('', [Validators.required, Validators.pattern(this.PHONE_PATTERN)]),
        email: new FormControl('', [Validators.required, Validators.email]),

        // ── Contact Persons ─────────────────────────────────────────────────
        it_person_name: new FormControl(''),
        it_person_contact: new FormControl('', [Validators.pattern(this.PHONE_PATTERN)]),
        admin_contact_name: new FormControl(''),
        admin_contact_no: new FormControl('', [Validators.pattern(this.PHONE_PATTERN)]),

        // ── Infrastructure ──────────────────────────────────────────────────
        // total_computers: new FormControl(0, [Validators.min(0)]),
        // total_laptops: new FormControl(0, [Validators.min(0)]),
        total_servers: new FormControl(''),
        server_ids: new FormControl([]),
        total_gsm_gateway: new FormControl(''),
        gateway_ids: new FormControl([]),

        // ── Agreement Details ───────────────────────────────────────────────
        billing_day: new FormControl('', Validators.required),
        agreement_start_date: new FormControl('', Validators.required),
        agreement_end_date: new FormControl({ value: '', disabled: true }),
        // security_cheque_number: new FormControl(''),
      },
      { validators: endDateAfterStart }
    );
    this.updateAgreementLockedFields();
  }

  private shouldLockAgreementFields(): boolean {
    return !!this.clientId && ['active', 'renewed'].includes(this.agreementStatus);
  }

  private updateAgreementLockedFields(): void {
    if (!this.Form) return;

    const controlNames = ['billing_day', 'agreement_start_date', 'rent_amount', 'payment_type'];
    const shouldDisable = this.shouldLockAgreementFields();

    controlNames.forEach(controlName => {
      const control = this.Form.get(controlName);
      if (!control) return;

      if (shouldDisable) {
        control.disable({ emitEvent: false });
      } else {
        control.enable({ emitEvent: false });
      }
    });
  }

  // ── File upload handler ─────────────────────────────────────────────────────
  private watchAgreementStartDate(): void {
    this.Form.get('agreement_start_date')?.valueChanges.subscribe((startDate: string) => {
      this.syncAgreementEndDate(startDate);
    });
  }

  private syncAgreementEndDate(startDate: string): void {
    const agreementEndDateControl = this.Form.get('agreement_end_date');
    if (!agreementEndDateControl) return;

    if (!startDate) {
      agreementEndDateControl.setValue('', { emitEvent: false });
      agreementEndDateControl.markAsUntouched();
      return;
    }

    agreementEndDateControl.setValue(this.calculateAgreementEndDate(startDate), { emitEvent: false });
  }

  private calculateAgreementEndDate(startDate: string): string {
    const parsedDate = new Date(startDate);
    if (Number.isNaN(parsedDate.getTime())) return '';

    const targetYear = parsedDate.getFullYear();
    const targetMonth = parsedDate.getMonth() + 11;
    const targetDay = parsedDate.getDate();
    const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const agreementEndDate = new Date(targetYear, targetMonth, Math.min(targetDay, lastDayOfTargetMonth));

    return this.formatDateForInput(agreementEndDate);
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

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

  getRentAmountError(): string {
    const control = this.Form.get('rent_amount');

    if (control?.errors?.['required']) {
      return 'Rent amount is required.';
    }

    if (control?.errors?.['min']) {
      return 'Rent amount must be greater than 0.';
    }

    return '';
  }

  onSubmit() {
    this.Form.markAllAsTouched();

    const formValue = this.Form.getRawValue();
    const full_name = (formValue.full_name ?? '').trim();

    if (this.Form.invalid) {
      this.loading = false;
      this.toastr.warning('Please check all the fields!');
      return;
    }
    // debugger
    if (this.serverAllocations.length > 0) {
      // this.loading = false;
      // this.toastr.warning('Please select at least one server.');
      // return;

      const invalidAllocation = this.serverAllocations.find(a => a.allocated_quantity === null || a.allocated_quantity === undefined || a.allocated_quantity === 0);
      if (invalidAllocation) {
        this.loading = false;
        this.toastr.warning('Please enter quantity for selected servers.');
        return;
      }

      const overAllocated = this.serverAllocations.find(a => {
        const maxQty = this.getServerTotalQuantity(a.server_id);
        return maxQty && Number(a.allocated_quantity || 0) > maxQty;
      });
      if (overAllocated) {
        this.loading = false;
        this.toastr.warning('Allocated quantity cannot exceed server total quantity.');
        return;
      }
    }


    if (this.gatewayAllocations.length > 0) {
      // this.loading = false;
      // this.toastr.warning('Please select at least one gateway.');
      // return;

      const invalidGatewayAllocation = this.gatewayAllocations.find(a => a.allocated_quantity === null || a.allocated_quantity === undefined || a.allocated_quantity === 0);
      if (invalidGatewayAllocation) {
        this.loading = false;
        this.toastr.warning('Please enter quantity for selected gateways.');
        return;
      }

      const overGatewayAllocated = this.gatewayAllocations.find(a => {
        const maxQty = this.getGatewayTotalQuantity(a.gateway_id);
        return maxQty && Number(a.allocated_quantity || 0) > maxQty;
      });
      if (overGatewayAllocated) {
        this.loading = false;
        this.toastr.warning('Allocated gateway quantity cannot exceed gateway total quantity.');
        return;
      }
    }


    this.loading = true;

    const formData = new FormData();
    // const formData = new URLSearchParams();

    // Append all reactive-form values
    const v = formValue;
    formData.append('full_name', full_name);
    formData.append('company_name', v.company_name ?? '');
    formData.append('company_address', v.company_address ?? '');
    formData.append('gst_number', (v.gst_no ?? '').toUpperCase());
    if (!this.shouldLockAgreementFields()) {
      formData.append('rent_amount', v.rent_amount ?? '');
    }
    formData.append('payment_type', v.payment_type ?? '');
    formData.append('mobile_no', v.mobile_no ?? '');
    formData.append('email', v.email ?? '');
    formData.append('it_person_name', v.it_person_name ?? '');
    formData.append('it_person_contact_number', v.it_person_contact ?? '');
    formData.append('administration_contact_name', v.admin_contact_name ?? '');
    formData.append('administration_contact_number', v.admin_contact_no ?? '');
    formData.append('admin_contact_no', v.admin_contact_no ?? '');
    // formData.append('total_computers', v.total_computers ?? 0);
    // formData.append('total_laptops', v.total_laptops ?? 0);
    const totalServersAllocated: any = this.serverAllocations.reduce((sum, a) => sum + Number(a.allocated_quantity || 0), 0);
    formData.append('total_servers', totalServersAllocated ?? 0);
    const totalGatewaysAllocated: any = this.gatewayAllocations.reduce((sum, a) => sum + Number(a.allocated_quantity || 0), 0);
    formData.append('total_gsm_gateways', totalGatewaysAllocated ?? 0);
    
    if (!this.shouldLockAgreementFields()) {
      formData.append('billing_day', v.billing_day ?? '');
      formData.append('agreement_start_date', v.agreement_start_date ?? '');
    }
    // formData.append('agreement_end_date', v.agreement_end_date ?? '');
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

    formData.append('server_allocations', JSON.stringify(this.serverAllocations));
    formData.append('gateway_allocations', JSON.stringify(this.gatewayAllocations));

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

  toggleServerDropdown(event?: Event) {
    if (event) event.stopPropagation();
    this.serverDropdownOpen = !this.serverDropdownOpen;
  }

  closeServerDropdown() {
    this.serverDropdownOpen = false;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.closeServerDropdown();
    this.closeGatewayDropdown();
  }

  isServerSelected(serverId: number): boolean {
    return this.selectedServerIds.includes(Number(serverId));
  }

  toggleServerSelection(serverId: number, event?: Event) {
    if (event) event.stopPropagation();
    const id = Number(serverId);
    if (this.selectedServerIds.includes(id)) {
      this.selectedServerIds = this.selectedServerIds.filter(sid => sid !== id);
    } else {
      this.selectedServerIds = [...this.selectedServerIds, id];
    }
    this.Form.patchValue({ server_ids: this.selectedServerIds });
    this.syncServerAllocations(this.selectedServerIds);
  }

  onServerSelectionChange() {
    const ids = (this.Form.get('server_ids')?.value ?? []).map((v: any) => Number(v));
    this.selectedServerIds = ids;
    this.syncServerAllocations(ids);
  }

  private syncServerAllocations(ids: number[]) {
    const existing = new Map(this.serverAllocations.map(a => [a.server_id, a]));
    this.serverAllocations = ids.map(id => existing.get(id) ?? { server_id: id, allocated_quantity: 0 });
    Object.keys(this.serverQtyErrors).forEach(key => {
      const id = Number(key);
      if (!ids.includes(id)) {
        delete this.serverQtyErrors[id];
      }
    });
  }

  toggleGatewayDropdown(event?: Event) {
    if (event) event.stopPropagation();
    this.gatewayDropdownOpen = !this.gatewayDropdownOpen;
  }

  closeGatewayDropdown() {
    this.gatewayDropdownOpen = false;
  }

  isGatewaySelected(gatewayId: number): boolean {
    return this.selectedGatewayIds.includes(Number(gatewayId));
  }

  toggleGatewaySelection(gatewayId: number, event?: Event) {
    if (event) event.stopPropagation();
    const id = Number(gatewayId);
    if (this.selectedGatewayIds.includes(id)) {
      this.selectedGatewayIds = this.selectedGatewayIds.filter(gid => gid !== id);
    } else {
      this.selectedGatewayIds = [...this.selectedGatewayIds, id];
    }
    this.Form.patchValue({ gateway_ids: this.selectedGatewayIds });
    this.syncGatewayAllocations(this.selectedGatewayIds);
  }

  onGatewaySelectionChange() {
    const ids = (this.Form.get('gateway_ids')?.value ?? []).map((v: any) => Number(v));
    this.selectedGatewayIds = ids;
    this.syncGatewayAllocations(ids);
  }

  private syncGatewayAllocations(ids: number[]) {
    const existing = new Map(this.gatewayAllocations.map(a => [a.gateway_id, a]));
    this.gatewayAllocations = ids.map(id => existing.get(id) ?? { gateway_id: id, allocated_quantity: 0 });
    Object.keys(this.gatewayQtyErrors).forEach(key => {
      const id = Number(key);
      if (!ids.includes(id)) {
        delete this.gatewayQtyErrors[id];
      }
    });
  }

  getServerName(serverId: number): string {
    const server = this.serverList.find(s => Number(s.id) === Number(serverId));
    return server?.server_name ?? `Server #${serverId}`;
  }

  getServerTotalQuantity(serverId: number): number {
    const server = this.serverList.find(s => Number(s.id) === Number(serverId));
    return Number(server?.total_left ?? 0);
  }

  getGatewayName(gatewayId: number): string {
    const gateway = this.gatewayList.find(g => Number(g.id) === Number(gatewayId));
    return gateway?.gateway_name ?? `Gateway #${gatewayId}`;
  }

  getGatewayTotalQuantity(gatewayId: number): number {
    const gateway = this.gatewayList.find(g => Number(g.id) === Number(gatewayId));
    return Number(gateway?.total_left ?? 0);
  }

  onAllocatedQuantityChange(alloc: { server_id: number; allocated_quantity: number }) {
    const maxQty = this.getServerTotalQuantity(alloc.server_id);
    const qty = Number(alloc.allocated_quantity || 0);
    if (qty < 0) {
      this.serverQtyErrors[alloc.server_id] = 'Quantity must be 0 or more.';
      return;
    }
    if (maxQty && qty > maxQty) {
      this.serverQtyErrors[alloc.server_id] = `Quantity cannot exceed ${maxQty}.`;
      return;
    }
    delete this.serverQtyErrors[alloc.server_id];
  }

  onGatewayAllocatedQuantityChange(alloc: { gateway_id: number; allocated_quantity: number }) {
    const maxQty = this.getGatewayTotalQuantity(alloc.gateway_id);
    const qty = Number(alloc.allocated_quantity || 0);
    if (qty < 0) {
      this.gatewayQtyErrors[alloc.gateway_id] = 'Quantity must be 0 or more.';
      return;
    }
    if (maxQty && qty > maxQty) {
      this.gatewayQtyErrors[alloc.gateway_id] = `Quantity cannot exceed ${maxQty}.`;
      return;
    }
    delete this.gatewayQtyErrors[alloc.gateway_id];
  }

  getSelectedServersLabel(): string {
    if (!this.selectedServerIds.length) return 'Select Server';
    return this.selectedServerIds.map(id => this.getServerName(id)).join(', ');
  }

  getSelectedGatewaysLabel(): string {
    if (!this.selectedGatewayIds.length) return 'Select Gateway';
    return this.selectedGatewayIds.map(id => this.getGatewayName(id)).join(', ');
  }

}
