import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { CommonModule, Location } from '@angular/common';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-view-devices',
  imports: [CommonModule],
  templateUrl: './view-devices.component.html',
  styleUrl: './view-devices.component.css'
})
export class ViewDevicesComponent {

  deviceId: any;
  deviceData: any;
  parsedDevice: any;
  showOtherDetails: boolean = false;
  loading: boolean = false;
  userRole: string | null = null;

  constructor(private route: ActivatedRoute, private service: CommonService, private location: Location, private toastr: NzMessageService) { }

  ngOnInit() {
    this.userRole = localStorage.getItem('role');
    this.route.queryParams.subscribe(params => {
      this.deviceId = params['deviceId'];
    });
    this.getDeviceDetails();
  }

  getDeviceDetails() {
    this.service.get(`systems/${this.deviceId}`).subscribe({
      next: (resp: any) => {
        const data = resp?.data ?? resp;
        this.deviceData = data;
        this.parseInventory(data?.inventory ?? []);
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  parseInventory(inventory: any[]) {
    const source = Array.isArray(inventory) ? inventory : [];
    const find = (type: string) =>
      source.find(x => String(x?.type).toLowerCase() === type.toLowerCase())?.details || null;
    const findAll = (type: string) =>
      source
        .filter(x => String(x?.type).toLowerCase() === type.toLowerCase())
        .map(x => x?.details)
        .filter(Boolean);

    const cpu = find('cpu');
    const motherboard = find('motherboard');
    const ram = find('ram');
    const allRam = findAll('ram');
    const ssd = find('ssd');
    const hdd = find('hdd');
    const gpu = find('gpu');
    const monitor = find('monitor');

    const cpuName = [cpu?.brand, cpu?.model].filter(Boolean).join(' ').trim();

    this.parsedDevice = {
      // SYSTEM INFO
      device_name: this.deviceData?.device_name,
      device_type: this.deviceData?.device_type ?? this.deviceData?.meta?.device_type,
      uuid: this.deviceData?.system_uuid,
      ip: this.deviceData?.meta?.ip_address ?? this.deviceData?.ip_address,
      mac: this.deviceData?.meta?.mac_address ?? this.deviceData?.mac_address,

      // CPU
      processor: cpuName || 'N/A',
      cpu_cores: cpu?.cores,
      cpu_threads: cpu?.threads,
      cpu_speed: cpu?.speedGHz,

      // RAM
      ram: {
        total_gb: ram?.sizeGB,
        brand: ram?.brand,
        serial_no: ram?.serial_number,
        speed: ram?.clockSpeed
      },
      ram_modules: allRam.map((r: any) => ({
        total_gb: r?.sizeGB,
        brand: r?.brand,
        serial_no: r?.serial_number,
        speed: r?.clockSpeed
      })),

      // STORAGE
      rom: {
        ssd_gb: ssd?.sizeGB,
        ssd_brand: ssd?.brand ?? ssd?.model,
        ssd_serial_no: ssd?.serial_number,
        hdd_gb: hdd?.sizeGB
      },

      // MOTHERBOARD
      motherboard: {
        brand: motherboard?.brand,
        model: motherboard?.model,
        serial: motherboard?.serial_number,
        bios: motherboard?.bios_version,
        serial_number: motherboard?.serial_number,
        mac_address: motherboard?.mac_address ?? this.deviceData?.meta?.mac_address ?? this.deviceData?.mac_address
      },

      // GPU
      gpu: {
        brand: gpu?.brand,
        model: gpu?.model,
        vram: gpu?.vramMB
      },

      // MONITOR
      monitor: {
        resolution: monitor?.resolution,
        size: monitor?.manual_size_inches,
        serial: monitor?.serial_number,
        brand: monitor?.brand
      }
    };
  }

  backClicked() {
    this.location.back();
  }

  shouldShowSystemField(key: any): boolean {
    const hiddenKeys = [
      'inventory',
      'meta',
      'warranty_start_date',
      'warranty_end_date',
      'full_response',
      'client_id',
      'status',
      'id',
      'is_active',
      'updated_at'
    ];
    return !hiddenKeys.includes(String(key).toLowerCase());
  }

  hasValue(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return !Number.isNaN(value);
    if (typeof value === 'boolean') return true;
    if (value instanceof Date) return true;
    return false;
  }

  formatDisplayKey(key: any): string {
    const acronyms = ['id', 'ip', 'mac', 'uuid', 'uid', 'cpu', 'gpu', 'ram', 'ssd', 'hdd'];
    const withSpaces = String(key ?? '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .trim();

    return withSpaces
      .split(/\s+/)
      .map(part => {
        const lower = part.toLowerCase();
        if (acronyms.includes(lower)) return lower.toUpperCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(' ');
  }

  shouldShowDetailField(key: any): boolean {
    return String(key).toLowerCase() !== 'status';
  }

  // exportDeviceCsv() {
  //   if (!this.deviceData) return;
  //   const data = {
  //     device: this.deviceData ?? {},
  //     parsed: this.parsedDevice ?? {}
  //   };
  //   const rows = this.buildKeyValueRows(data);
  //   const fallbackId = this.deviceData?.system_uid ?? this.deviceId ?? 'details';
  //   const csv = this.buildCsv(rows, ['Field', 'Value']);
  //   this.downloadCsv(csv, `system-${fallbackId}.csv`);
  // }

  exportDeviceCsv() {
    if (!this.deviceData) return;

    const data = {
      device: this.deviceData ?? {},
      parsed: this.parsedDevice ?? {}
    };

    const flatData = this.flattenObject(data);

    const headers = Object.keys(flatData);
    const values = headers.map(key => this.formatCsvValue(flatData[key]));

    const csv = [
      headers.map(h => this.escapeCsv(h)).join(','),
      values.map(v => this.escapeCsv(v)).join(',')
    ].join('\n');

    const fallbackId = this.deviceData?.system_uid ?? this.deviceId ?? 'details';
    this.downloadCsv(csv, `system-${fallbackId}.csv`);
  }

  private buildKeyValueRows(source: any, prefix: string = ''): Array<[string, string]> {
    if (!source || typeof source !== 'object') return [];
    const rows: Array<[string, string]> = [];
    Object.keys(source).forEach((key) => {
      const value = source[key];
      const path = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        rows.push(...this.buildKeyValueRows(value, path));
      } else {
        rows.push([path, this.formatCsvValue(value)]);
      }
    });
    return rows;
  }

  private flattenObject(obj: any, prefix: string = '', res: any = {}) {
    Object.keys(obj || {}).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        this.flattenObject(value, newKey, res);
      } else {
        res[newKey] = value;
      }
    });

    return res;
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

  reject(): void {

    this.loading = true;
    const formURlData = new URLSearchParams();
    formURlData.set('approval_status', 'rejected');

    this.service.patch(`ststems/${this.deviceId}/change-approval`, formURlData.toString()).subscribe({
      next: (resp: any) => {
        this.loading = false;
        this.toastr.success(resp?.message || 'Systems assigned successfully.');
        this.closeModalAssign1?.nativeElement?.click();
        this.getDeviceDetails();
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
    formURlData.set('approval_status', 'approved');

    this.service.patch(`ststems/${this.deviceId}/change-approval`, formURlData.toString()).subscribe({
      next: (resp: any) => {
        this.loading = false;
        this.toastr.success(resp?.message || 'Systems assigned successfully.');
        this.closeModalAssign2?.nativeElement?.click();
        this.getDeviceDetails();
      },
      error: () => {
        this.loading = false;
        this.toastr.warning('Something went wrong.');
      }
    });
  }


}
