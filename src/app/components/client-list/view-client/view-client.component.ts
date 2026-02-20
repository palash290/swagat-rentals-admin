import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-view-client',
  imports: [RouterLink, CommonModule],
  templateUrl: './view-client.component.html',
  styleUrl: './view-client.component.css'
})
export class ViewClientComponent {

  clientId: any;
  clientData: any;

  constructor(private route: ActivatedRoute, private service: CommonService, private location: Location) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.clientId = params['clientId'];
    });
    this.getClientDetails();
  }

  getClientDetails() {
    this.service.get(`admin/clients/${this.clientId}`).subscribe({
      next: (resp: any) => {
        this.clientData = resp.data;
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  backClicked() {
    this.location.back();
  }


}
