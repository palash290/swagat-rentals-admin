import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-view-assets',
  imports: [CommonModule, RouterLink],
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
    this.service.get(`assets/inventory/${this.asset_id}`).subscribe({
      next: (resp: any) => {
        this.assetData = resp.data;
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  get statusLabel(): string {
    return this.formatLabel(this.assetData?.status);
  }

  get availabilityLabel(): string {
    return Number(this.assetData?.is_available) === 1 ? 'Available' : 'Not Available';
  }

  get availabilityBadgeStyles() {
    return Number(this.assetData?.is_available) === 1
      ? { 'background-color': '#4EC40014', color: '#22C55E' }
      : { 'background-color': '#EF444414', color: '#EF4444' };
  }

  get specEntries(): { key: string; value: any }[] {
    const specJson = this.assetData?.spec_json;

    if (!specJson || typeof specJson !== 'object') {
      return [];
    }

    return Object.entries(specJson).map(([key, value]) => ({ key, value }));
  }

  formatLabel(value: string | null | undefined): string {
    if (!value) return '-';

    return String(value)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }


}
