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
    this.service.get(`devices/${this.deviceId}`).subscribe({
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
    const find = (type: string) => inventory.find(x => x.type === type)?.details;

    this.parsedDevice = {
      os: find('os_info'),
      cpu: find('cpu'),
      processor: find('processor')?.value,
      ram: find('ram'),
      rom: find('rom'),
      network: find('network')?.json || [],
      mac: find('mac_address')?.value,
      ip: find('ip_address')?.value,
      uuid: find('device_uuid')?.value,
      device_name: find('device_name')?.value
    };
  }

  backClicked() {
    this.location.back();
  }


}
