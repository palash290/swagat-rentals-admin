import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-add-inventory',
  imports: [RouterLink],
  templateUrl: './add-inventory.component.html',
  styleUrl: './add-inventory.component.css'
})
export class AddInventoryComponent {

    system_id: any;
  assetData: any;

  constructor(private route: ActivatedRoute, private service: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.system_id = params['system_id'];
    });
    this.getClientDetails();
  }

  getClientDetails() {
    this.service.get(`assets/${this.system_id}`).subscribe({
      next: (resp: any) => {
        this.assetData = resp.data;
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }


}
