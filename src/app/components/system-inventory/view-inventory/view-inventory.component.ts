import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-view-inventory',
  imports: [CommonModule, RouterLink],
  templateUrl: './view-inventory.component.html',
  styleUrl: './view-inventory.component.css'
})
export class ViewInventoryComponent {

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
    this.service.get(`assets/system-inventory/${this.system_id}`).subscribe({
      next: (resp: any) => {
        this.assetData = resp.data;
      },
      error: (error) => {
        console.log(error.message);
      }
    });
  }

  get systemData() {
    return this.assetData?.system ?? null;
  }

  get assetsList(): any[] {
    return this.assetData?.assets ?? [];
  }

  formatLabel(value: string | null | undefined): string {
    if (!value) return '-';

    return String(value)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  parseSpecJson(specJson: unknown): Record<string, any> {
    if (!specJson) return {};

    if (typeof specJson === 'object') {
      return specJson as Record<string, any>;
    }

    if (typeof specJson === 'string') {
      try {
        return JSON.parse(specJson);
      } catch {
        return {};
      }
    }

    return {};
  }

  getSpecEntries(specJson: unknown): { key: string; value: any }[] {
    return Object.entries(this.parseSpecJson(specJson)).map(([key, value]) => ({ key, value }));
  }


}
