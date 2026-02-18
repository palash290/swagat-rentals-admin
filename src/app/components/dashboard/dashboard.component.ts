import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonService } from '../../services/common.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  dashboardData: any;

  constructor(private apiService: CommonService) { }

  ngOnInit() {
    this.apiService.refreshSidebar$.subscribe(() => {
      this.getProfile();
    });
  }

  getProfile() {
    this.apiService.get('admin/dashboard').subscribe({
      next: (resp: any) => {
        this.dashboardData = resp.data;
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }


}
