import { Component, HostListener } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-view-employees',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './view-employees.component.html',
  styleUrl: './view-employees.component.css'
})
export class ViewEmployeesComponent {

  employeeId: any;
  employeeData: any;
  deviceList: any;
  clientList: any;

  documentsByType: Record<string, any[]> = {};
  selectedDocUrl: string = '';
  selectedDocTitle: string = '';
  selectedDocIsPdf: boolean = false;

  readonly documentTypes = [
    { key: 'aadhar_card', label: 'Aadhar Card' },
    { key: 'other_documents', label: 'Other Documents' },
    { key: 'selfie', label: 'Selfie' }
  ];

  constructor(
    private route: ActivatedRoute,
    private service: CommonService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.employeeId = params['employeeId'];
    });
    this.getDeviceDetails();
  }

  getDeviceDetails() {
    this.service.get(`admin/employees/${this.employeeId}`).subscribe({
      next: (resp: any) => {
        this.employeeData = resp.data;
        this.normalizeEmployeeData();
        this.getDevices();
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  private normalizeEmployeeData(): void {
    const employee = this.employeeData ?? {};

    if (employee?.profile_image) {
      employee.profile_image = this.toAbsoluteUrl(employee.profile_image);
    }

    this.documentsByType = {};
    (employee?.documents ?? []).forEach((doc: any) => {
      const fieldName = this.mapDocTypeToField(doc?.doc_type);
      const docUrl = this.getDocUrl(doc);
      if (!fieldName || !docUrl) return;
      if (!this.documentsByType[fieldName]) {
        this.documentsByType[fieldName] = [];
      }
      this.documentsByType[fieldName].push({
        ...doc,
        url: docUrl
      });
    });

    const profileUrl = String(employee?.profile_image ?? '').trim();
    if (profileUrl && !(this.documentsByType['selfie']?.length)) {
      this.documentsByType['selfie'] = [{
        id: null,
        doc_type: 'Selfie',
        url: this.toAbsoluteUrl(profileUrl)
      }];
    }
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
    const raw = String(doc?.doc_url ?? doc?.document_url ?? doc?.file_url ?? doc?.url ?? doc?.path ?? '').trim();
    return this.toAbsoluteUrl(raw);
  }

  private toAbsoluteUrl(path: string): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return `${this.service.baseUrl}${path.startsWith('/') ? path.slice(1) : path}`;
  }

  isPdfUrl(url: string): boolean {
    return /\.pdf(\?|#|$)/i.test(url ?? '');
  }

  getSafePdfUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  trackByDocType = (_: number, item: { key: string }) => item.key;

  openDoc(docType: { key: string; label: string }, doc: any) {
    this.selectedDocUrl = this.getDocUrl(doc);
    this.selectedDocTitle = docType?.label ?? 'Document Preview';
    this.selectedDocIsPdf = this.isPdfUrl(this.selectedDocUrl);
  }

  openPdfInNewTab(url: string): void {
    if (!url) return;
    window.open(url, '_blank');
  }

  getDevices() {
    this.service.get(`admin/employees/${this.employeeId}/devices`).subscribe({
      next: (resp: any) => {
        this.deviceList = resp.data;
        this.getClientList();
      },
      error: (error) => {
        console.log(error.message);
        this.deviceList = [];
      }
    });
  }

  getClientList() {
    this.service.get(`admin/clients`).subscribe({
      next: (resp: any) => {
        this.clientList = resp.data.items;

        if (this.clientList.length > 0) {
          this.clientId = this.clientList[0].id;
          this.getClientDevices();
        }
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  clientId: any;
  clientDevices: any;
  selectedDeviceIds: any[] = [];
  isSystemDropdownOpen: boolean = false;

  getClientDevices() {
    if (!this.clientId) return;

    this.service.get(`admin/clients/${this.clientId}/devices`).subscribe({
      next: (resp: any) => {
        this.clientDevices = resp.data.items;
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  onClientChange(clientId: any) {
    this.clientId = clientId;
    this.selectedDeviceIds = [];
    this.isSystemDropdownOpen = false;

    if (this.clientId) {
      this.getClientDevices();
    } else {
      this.clientDevices = []; // reset if no client selected
    }
  }

  toggleSystemDropdown(event: Event) {
    event.stopPropagation();
    this.isSystemDropdownOpen = !this.isSystemDropdownOpen;
  }

  isSystemSelected(deviceId: number | string): boolean {
    return this.selectedDeviceIds.includes(deviceId);
  }

  onSystemToggle(deviceId: number | string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.selectedDeviceIds.includes(deviceId)) {
        this.selectedDeviceIds.push(deviceId);
      }
      return;
    }
    this.selectedDeviceIds = this.selectedDeviceIds.filter(id => id !== deviceId);
  }

  get selectedSystemsLabel(): string {
    if (!this.selectedDeviceIds.length) return 'Select Systems';
    const selectedNames = (this.clientDevices ?? [])
      .filter((item: any) => this.selectedDeviceIds.includes(item.id))
      .map((item: any) => item.device_name || item.system_uid || `System ${item.id}`);
    return selectedNames.join(', ');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.ct_custom_multi_select')) {
      this.isSystemDropdownOpen = false;
    }
  }


}
