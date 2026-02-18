import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view-employees',
  imports: [RouterLink, CommonModule],
  templateUrl: './view-employees.component.html',
  styleUrl: './view-employees.component.css'
})
export class ViewEmployeesComponent {

  employeeId: any;
  employeeData: any;

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
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }


}
