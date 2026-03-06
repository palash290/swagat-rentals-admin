import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  constructor(private route: ActivatedRoute, private service: CommonService) { }

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
        this.getDevices();
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  getDevices() {
    this.service.get(`systems`).subscribe({
      next: (resp: any) => {
        this.deviceList = resp.data.items;
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

    if (this.clientId) {
      this.getClientDevices();
    } else {
      this.clientDevices = []; // reset if no client selected
    }
  }

  selectedDeviceIds: any[] = [];

  onDevicesChange(selectElement: HTMLSelectElement) {
    const selectedOptions = Array.from(selectElement.selectedOptions);

    this.selectedDeviceIds = selectedOptions.map((option: any) => option.value);

    console.log('Selected System IDs:', this.selectedDeviceIds);
  }


}
