import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-agreement-details',
  imports: [RouterLink, CommonModule],
  templateUrl: './agreement-details.component.html',
  styleUrl: './agreement-details.component.css'
})
export class AgreementDetailsComponent {

  agreement_id: any;
  agreementData: any;

  constructor(private route: ActivatedRoute, private service: CommonService) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.agreement_id = params['agreement_id'];
    });
    this.getClientDetails();
  }

  getClientDetails() {
    this.service.get(`admin/agreements/${this.agreement_id}`).subscribe({
      next: (resp: any) => {
        this.agreementData = resp.data;
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }


}
