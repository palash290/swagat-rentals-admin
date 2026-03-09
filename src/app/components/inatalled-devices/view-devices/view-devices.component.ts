import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { CommonModule, Location } from '@angular/common';

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

  constructor(private route: ActivatedRoute, private service: CommonService, private location: Location) { }

  ngOnInit() {
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


}
