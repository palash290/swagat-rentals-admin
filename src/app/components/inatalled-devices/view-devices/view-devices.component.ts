import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
        this.deviceData = resp.data;
        this.parseInventory(resp.data.inventory);
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  parseInventory(inventory: any[]) {

    const find = (type: string) =>
      inventory.find(x => x.type === type)?.details || null;

    const cpu = find('cpu');
    const motherboard = find('motherboard');
    const ram = find('ram');
    const ssd = find('ssd');
    const hdd = find('hdd');
    const gpu = find('gpu');
    const monitor = find('monitor');

    this.parsedDevice = {
      // SYSTEM INFO
      device_name: this.deviceData?.device_name,
      device_type: this.deviceData?.device_type,
      uuid: this.deviceData?.system_uuid,
      ip: this.deviceData?.ip_address,
      mac: this.deviceData?.meta.mac_address,

      // CPU
      processor: cpu ? `${cpu.brand} ${cpu.model}` : 'N/A',
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

      // STORAGE
      rom: {
        ssd_gb: ssd?.sizeGB,
        ssd_brand: ssd?.brand,
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
        mac_address: motherboard?.mac_address
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
        size: monitor?.size,
        serial: monitor?.serial_number,
        brand: monitor?.brand
      }
    };
  }

  backClicked() {
    this.location.back();
  }


}
