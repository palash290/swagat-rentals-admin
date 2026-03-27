import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { CommonModule, Location } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NzMessageService } from 'ng-zorro-antd/message';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-view-client',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './view-client.component.html',
  styleUrl: './view-client.component.css'
})
export class ViewClientComponent implements AfterViewInit, OnDestroy {

  clientId: any;
  clientData: any;
  documentsByType: Record<string, any[]> = {};
  selectedDocUrl: string = '';
  selectedDocTitle: string = '';
  selectedDocIsPdf: boolean = false;
  selectedDocIsVideo: boolean = false;
  loading: boolean = false;
  rejectionReason: string = '';
  userRole: string | null = null;

  readonly documentTypes = [
    { key: 'aadhaar_card', label: 'Aadhaar Card' },
    { key: 'security_cheque', label: 'Security Cheque' },
    { key: 'pan_card', label: 'PAN Card' },
    { key: 'office_rent_agreement', label: 'Office Rent Agreement' },
    { key: 'gst_certificate', label: 'GST Certificate' },
    { key: 'gumasta', label: 'Gumasta' },
    { key: 'selfie', label: 'Selfie' },
    { key: 'Verification_Video', label: 'Verification Video' }
  ];

  constructor(
    private route: ActivatedRoute,
    private service: CommonService,
    private location: Location,
    private sanitizer: DomSanitizer,
    private toastr: NzMessageService
  ) { }

  ngOnInit() {
    this.userRole = localStorage.getItem('role');
    this.route.queryParams.subscribe(params => {
      this.clientId = params['clientId'];
    });
    this.getClientDetails();
  }

  ngAfterViewInit(): void {
    const modalEl = this.docPreviewModal?.nativeElement as HTMLElement | undefined;
    if (!modalEl) return;

    this.onDocPreviewHidden = () => {
      const video = modalEl.querySelector('video') as HTMLVideoElement | null;
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    };

    modalEl.addEventListener('hidden.bs.modal', this.onDocPreviewHidden);
  }

  ngOnDestroy(): void {
    const modalEl = this.docPreviewModal?.nativeElement as HTMLElement | undefined;
    if (modalEl && this.onDocPreviewHidden) {
      modalEl.removeEventListener('hidden.bs.modal', this.onDocPreviewHidden);
    }
  }

  getClientDetails() {
    this.service.get(`admin/clients/${this.clientId}`).subscribe({
      next: (resp: any) => {
        this.clientData = resp.data;
        this.documentsByType = this.groupDocumentsByType(this.clientData?.documents ?? []);
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  backClicked() {
    this.location.back();
  }

  trackByDocType = (_: number, item: { key: string }) => item.key;

  openDoc(docType: { key: string; label: string }, doc: any) {
    this.selectedDocUrl = this.getDocUrl(doc);
    this.selectedDocTitle = docType?.label ?? 'Document Preview';
    this.selectedDocIsPdf = this.isPdfUrl(this.selectedDocUrl);
    this.selectedDocIsVideo = this.isVideoUrl(this.selectedDocUrl);
  }

  getPrimaryDoc(typeKey: string): any | null {
    const docs = this.documentsByType[typeKey] ?? [];
    return docs.find(doc => this.getDocUrl(doc)) ?? null;
  }

  getDocFileName(doc: any): string {
    const url = this.getDocUrl(doc);
    if (!url) return '';
    const clean = url.split('?')[0].split('#')[0];
    const name = clean.substring(clean.lastIndexOf('/') + 1);
    return name || '';
  }

  exportClientCsv() {
    if (!this.clientData) return;

    const headers = Object.keys(this.clientData)
      .filter(key => !this.shouldSkipCsvField(key));

    const values = headers.map(key =>
      this.formatCsvValue(this.clientData[key])
    );

    const csv = [
      headers.map(h => this.escapeCsv(h)).join(','),
      values.map(v => this.escapeCsv(v)).join(',')
    ].join('\n');

    const fallbackId = this.clientData?.u_unique_id ?? this.clientId ?? 'details';
    this.downloadCsv(csv, `client-${fallbackId}.csv`);
  }

  private groupDocumentsByType(docs: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    (docs ?? []).forEach(doc => {
      const typeKey = this.mapDocTypeToField(doc?.doc_type);
      if (!typeKey) return;
      if (!grouped[typeKey]) grouped[typeKey] = [];
      grouped[typeKey].push(doc);
    });
    return grouped;
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
      gumasta: 'gumasta',
      selfie: 'selfie',
      verification_video: 'Verification_Video'
    };
    return mapping[normalized] ?? null;
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

  isPdfUrl(url: string): boolean {
    return /\.pdf(\?|#|$)/i.test(url ?? '');
  }

  isVideoUrl(url: string): boolean {
    return /\.(mp4|webm|ogg)(\?|#|$)/i.test(url ?? '');
  }

  getSafePdfUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  openPdfInNewTab(url: string): void {
    if (!url) return;
    window.open(url, '_blank');
  }

  private buildKeyValueRows(source: any, prefix: string = ''): Array<[string, string]> {
    if (!source || typeof source !== 'object') return [];
    const rows: Array<[string, string]> = [];
    Object.keys(source).forEach((key) => {
      if (this.shouldSkipCsvField(key)) return;
      const value = source[key];
      const path = prefix ? `${prefix}.${key}` : key;
      if (this.shouldSkipCsvValue(value)) return;
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        rows.push(...this.buildKeyValueRows(value, path));
      } else {
        rows.push([path, this.formatCsvValue(value)]);
      }
    });
    return rows;
  }

  private formatCsvValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) {
      return value.length ? JSON.stringify(value) : '';
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  private shouldSkipCsvField(key: string): boolean {
    const normalized = String(key ?? '').toLowerCase();
    const blockedKeys = [
      'documents',
      'document',
      'doc_url',
      'document_url',
      'file_url',
      'image',
      'image_url',
      'photo',
      'avatar',
      'logo',
      'path',
      'url'
    ];
    return blockedKeys.includes(normalized);
  }

  private shouldSkipCsvValue(value: any): boolean {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return false;
    if (trimmed.startsWith('data:image/')) return true;
    if (trimmed.endsWith('.png') || trimmed.endsWith('.jpg') || trimmed.endsWith('.jpeg') || trimmed.endsWith('.gif') || trimmed.endsWith('.webp')) {
      return true;
    }
    return false;
  }

  private buildCsv(rows: Array<[string, string]>, header: string[]): string {
    const lines = [header.map((value) => this.escapeCsv(value)).join(',')];
    rows.forEach(([key, value]) => {
      lines.push([key, value].map((cell) => this.escapeCsv(cell)).join(','));
    });
    return lines.join('\n');
  }

  private escapeCsv(value: string): string {
    const normalized = String(value ?? '');
    if (/[",\n]/.test(normalized)) {
      return `"${normalized.replace(/"/g, '""')}"`;
    }
    return normalized;
  }

  private downloadCsv(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  @ViewChild('closeModalAssign1') closeModalAssign1!: ElementRef;
  @ViewChild('closeModalAssign2') closeModalAssign2!: ElementRef;
  @ViewChild('docPreviewModal') docPreviewModal!: ElementRef;

  private onDocPreviewHidden?: () => void;

  reject(): void {
    const reason = this.rejectionReason?.trim();
    if (!reason) {
      this.toastr.warning('Please enter rejection reason.');
      return;
    }

    this.loading = true;
    const formURlData = new URLSearchParams();
    formURlData.set('status', 'rejected');
    formURlData.set('reject_reason', reason);
    formURlData.set('client_id', this.clientId);

    this.service.post(`admin/client/kyc-approvals`, formURlData.toString()).subscribe({
      next: (resp: any) => {
        this.loading = false;
        this.toastr.success(resp?.message || 'Systems assigned successfully.');
        this.rejectionReason = '';
        this.closeModalAssign1?.nativeElement?.click();
        this.getClientDetails();
      },
      error: () => {
        this.loading = false;
        this.toastr.warning('Something went wrong.');
      }
    });
  }

  approve(): void {

    this.loading = true;

    const formURlData = new URLSearchParams();
    formURlData.set('status', 'approved');
    formURlData.set('client_id', this.clientId);

    this.service.post(`admin/client/kyc-approvals`, formURlData.toString()).subscribe({
      next: (resp: any) => {
        this.loading = false;
        this.toastr.success(resp?.message || 'Systems assigned successfully.');
        this.closeModalAssign2?.nativeElement?.click();
        this.getClientDetails();
      },
      error: () => {
        this.loading = false;
        this.toastr.warning('Something went wrong.');
      }
    });
  }

}
