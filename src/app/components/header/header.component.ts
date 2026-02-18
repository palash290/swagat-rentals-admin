import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  userData: any;

  constructor(private router: Router, private apiService: CommonService) { }

  ngOnInit() {
    this.apiService.refreshSidebar$.subscribe(() => {
      this.getProfile();
    });
  }

  getProfile() {
    this.apiService.get('admin/me').subscribe({
      next: (resp: any) => {
        this.userData = resp.data;
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  logout() {
    this.router.navigateByUrl('/');
    localStorage.clear();
  }


}
