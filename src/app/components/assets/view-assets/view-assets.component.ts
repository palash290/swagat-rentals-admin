import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-view-assets',
  imports: [RouterLink],
  templateUrl: './view-assets.component.html',
  styleUrl: './view-assets.component.css'
})
export class ViewAssetsComponent {

  asset_id: any;
  assetData: any;

  constructor(private route: ActivatedRoute, private service: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.asset_id = params['asset_id'];
    });
    this.getClientDetails();
  }

  getClientDetails() {
    this.service.get(`assets/${this.asset_id}`).subscribe({
      next: (resp: any) => {
        this.assetData = resp.data;
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }


}
