import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonService } from '../../../services/common.service';

@Component({
  selector: 'app-add-agreement',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './add-agreement.component.html',
  styleUrl: './add-agreement.component.css'
})
export class AddAgreementComponent {

  loading: boolean = false;
  selectedClientId: any = '';
  clientSystems: any[] = [];
  isSubmitting: boolean = false;
  isSubmitted: boolean = false;
  clientList: any[] = [];
  billingDays: number[] = [];
  agreementId: number | null = null;
  isEditMode: boolean = false;
  clientAssets: any = {
    assets: [],
    systems: [],
    gsm_gateways: [],
    servers: []
  };
  form: any = {
    client_id: '',
    billing_cycle_day: '',
    start_date: '',
    end_date: '',
    assets: [],
    systems: [],
    gsm_gateways: [],
    servers: []
  };

  constructor(
    private apiService: CommonService,
    private toastr: NzMessageService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.billingDays = Array.from({ length: 25 }, (_, i) => i + 1);
    this.getClientList();
    this.route.queryParams.subscribe(params => {
      this.agreementId = Number(params['agreement_id'] ?? 0) || null;
      this.isEditMode = !!this.agreementId;

      if (this.isEditMode && this.agreementId) {
        this.getAgreementDetails();
      } else {
        this.resetForm();
      }
    });
  }

  getClientSystems() {
    if (!this.selectedClientId) {
      this.clientSystems = [];
      this.clientAssets = {
        assets: [],
        systems: [],
        gsm_gateways: [],
        servers: []
      };
      this.clearAssetSelections();
      return;
    }

    this.apiService.get(`admin/agreements/options/${this.selectedClientId}`).subscribe({
      next: (resp: any) => {
        const data = resp?.data?.items || resp?.data || {};
        this.clientSystems = Array.isArray(data?.systems) ? data.systems : [];
        this.clientAssets = {
          assets: Array.isArray(data?.assets) ? data.assets : [],
          systems: Array.isArray(data?.systems) ? data.systems : [],
          gsm_gateways: Array.isArray(data?.gsm_gateways) ? data.gsm_gateways : [],
          servers: Array.isArray(data?.servers) ? data.servers : []
        };
        this.syncSelectionsWithAvailableAssets();
      },
      error: (error) => {
        console.log(error.message);
        this.clientSystems = [];
        this.clientAssets = {
          assets: [],
          systems: [],
          gsm_gateways: [],
          servers: []
        };
        this.clearAssetSelections();
      }
    });
  }

  onClientChange(clientId: any): void {
    this.form.client_id = clientId;
    this.selectedClientId = clientId;
    this.clearAssetSelections();
    this.getClientSystems();
  }

  getClientList() {
    this.apiService.get(`admin/clients`).subscribe({
      next: (resp: any) => {
        this.clientList = resp.data.items.filter((client: any) => client.kyc_status === 'approved');
      },
      error: (error) => {
        console.log(error.message);
        this.clientList = [];
      }
    });
  }

  getAgreementDetails() {
    if (!this.agreementId) return;

    this.loading = true;
    this.isSubmitted = false;

    this.apiService.get(`admin/agreements/${this.agreementId}`).subscribe({
      next: (resp: any) => {
        const item = resp?.data ?? {};
        this.form = {
          client_id: String(item?.client_id ?? item?.id ?? ''),
          billing_cycle_day: String(
            item?.agreement_billing_cycle_day ??
            item?.billing_cycle_day ??
            item?.billing_day ??
            ''
          ),
          start_date: this.toDateInput(item?.agreement_start_date ?? item?.start_date),
          end_date: this.toDateInput(item?.agreement_end_date ?? item?.end_date),
          assets: this.mapSelectedAssets(item?.assets),
          systems: this.mapSelectedSystems(item?.systems),
          gsm_gateways: this.mapSelectedGateways(item?.gsm_gateways),
          servers: this.mapSelectedServers(item?.servers)
        };
        this.selectedClientId = this.form.client_id;
        this.getClientSystems();
        this.updateEndDate();
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        console.log(error.message);
        this.toastr.error(error.error?.message || 'Failed to load agreement details.');
      }
    });
  }

  resetForm() {
    this.isSubmitted = false;
    this.selectedClientId = '';
    this.clientSystems = [];
    this.form = {
      client_id: '',
      billing_cycle_day: '',
      start_date: '',
      end_date: '',
      assets: [],
      systems: [],
      gsm_gateways: [],
      servers: []
    };
  }

  private toDateInput(value: any): string {
    return value ? String(value).slice(0, 10) : '';
  }

  onStartDateChange(): void {
    this.updateEndDate();
  }

  private updateEndDate(): void {
    this.form.end_date = this.calculateEndDate(this.form.start_date);
  }

  private calculateEndDate(startDate: string): string {
    if (!startDate) return '';

    const parsedDate = new Date(startDate);
    if (Number.isNaN(parsedDate.getTime())) return '';

    const targetYear = parsedDate.getFullYear();
    const targetMonth = parsedDate.getMonth() + 11;
    const targetDay = parsedDate.getDate();
    const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const endDate = new Date(targetYear, targetMonth, Math.min(targetDay, lastDayOfTargetMonth));

    return this.formatDate(endDate);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  isFieldInvalid(field: keyof typeof this.form): boolean {
    const value = this.form[field];

    return String(value ?? '').trim() === '';
  }

  private clearAssetSelections(): void {
    this.form.assets = [];
    this.form.systems = [];
    this.form.gsm_gateways = [];
    this.form.servers = [];
  }

  private syncSelectionsWithAvailableAssets(): void {
    this.form.assets = (this.form.assets || []).filter((selected: any) =>
      this.clientAssets.assets.some((asset: any) => Number(asset.asset_id) === Number(selected.asset_id))
    );

    this.form.systems = (this.form.systems || []).filter((selected: any) =>
      this.clientAssets.systems.some((asset: any) => Number(asset.id) === Number(selected.system_id))
    );

    this.form.gsm_gateways = (this.form.gsm_gateways || []).map((selected: any) => {
      const match = this.clientAssets.gsm_gateways.find((asset: any) => Number(asset.gateway_id) === Number(selected.gateway_id));
      return {
        gateway_id: Number(selected.gateway_id),
        quantity: Number(selected.quantity ?? match?.allocated_quantity ?? 0),
        price_per_unit: selected.price_per_unit ?? ''
      };
    }).filter((selected: any) =>
      this.clientAssets.gsm_gateways.some((asset: any) => Number(asset.gateway_id) === Number(selected.gateway_id))
    );

    this.form.servers = (this.form.servers || []).map((selected: any) => {
      const match = this.clientAssets.servers.find((asset: any) => Number(asset.server_id) === Number(selected.server_id));
      return {
        server_id: Number(selected.server_id),
        quantity: Number(selected.quantity ?? match?.allocated_quantity ?? 0),
        price_per_unit: selected.price_per_unit ?? ''
      };
    }).filter((selected: any) =>
      this.clientAssets.servers.some((asset: any) => Number(asset.server_id) === Number(selected.server_id))
    );
  }

  private mapSelectedAssets(items: any): any[] {
    if (!Array.isArray(items)) return [];
    return items.map((item: any) => ({
      asset_id: Number(item?.asset_id ?? item?.id),
      price: item?.asset_price ?? item?.price ?? ''
    })).filter((item: any) => !!item.asset_id);
  }

  private mapSelectedSystems(items: any): any[] {
    if (!Array.isArray(items)) return [];
    return items.map((item: any) => ({
      system_id: Number(item?.system_id ?? item?.id),
      price: item?.system_price ?? ''
    })).filter((item: any) => !!item.system_id);
  }

  private mapSelectedGateways(items: any): any[] {
    if (!Array.isArray(items)) return [];
    return items.map((item: any) => ({
      gateway_id: Number(item?.gateway_id ?? item?.id),
      quantity: Number(item?.quantity ?? item?.allocated_quantity ?? 0),
      price_per_unit: item?.price_per_unit ?? item?.price ?? ''
    })).filter((item: any) => !!item.gateway_id);
  }

  private mapSelectedServers(items: any): any[] {
    if (!Array.isArray(items)) return [];
    return items.map((item: any) => ({
      server_id: Number(item?.server_id ?? item?.id),
      quantity: Number(item?.quantity ?? item?.allocated_quantity ?? 0),
      price_per_unit: item?.price_per_unit ?? item?.price ?? ''
    })).filter((item: any) => !!item.server_id);
  }

  isSystemSelected(systemId: number): boolean {
    return this.form.systems.some((item: any) => Number(item.system_id) === Number(systemId));
  }

  isAssetSelected(assetId: number): boolean {
    return this.form.assets.some((item: any) => Number(item.asset_id) === Number(assetId));
  }

  onAssetToggle(asset: any, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const assetId = Number(asset.asset_id ?? asset.id);

    if (checked) {
      if (!this.isAssetSelected(assetId)) {
        this.form.assets = [
          ...this.form.assets,
          { asset_id: assetId, price: '' }
        ];
      }
      return;
    }

    this.form.assets = this.form.assets.filter((item: any) => Number(item.asset_id) !== assetId);
  }

  getSelectedAsset(assetId: number): any {
    return this.form.assets.find((item: any) => Number(item.asset_id) === Number(assetId));
  }

  onSystemToggle(system: any, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const systemId = Number(system.id);

    if (checked) {
      if (!this.isSystemSelected(systemId)) {
        this.form.systems = [
          ...this.form.systems,
          { system_id: systemId, price: '' }
        ];
      }
      return;
    }

    this.form.systems = this.form.systems.filter((item: any) => Number(item.system_id) !== systemId);
  }

  getSelectedSystem(systemId: number): any {
    return this.form.systems.find((item: any) => Number(item.system_id) === Number(systemId));
  }

  isGatewaySelected(gatewayId: number): boolean {
    return this.form.gsm_gateways.some((item: any) => Number(item.gateway_id) === Number(gatewayId));
  }

  onGatewayToggle(gateway: any, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const gatewayId = Number(gateway.gateway_id);

    if (checked) {
      if (!this.isGatewaySelected(gatewayId)) {
        this.form.gsm_gateways = [
          ...this.form.gsm_gateways,
          {
            gateway_id: gatewayId,
            quantity: Number(gateway.allocated_quantity ?? 0),
            price_per_unit: ''
          }
        ];
      }
      return;
    }

    this.form.gsm_gateways = this.form.gsm_gateways.filter((item: any) => Number(item.gateway_id) !== gatewayId);
  }

  getSelectedGateway(gatewayId: number): any {
    return this.form.gsm_gateways.find((item: any) => Number(item.gateway_id) === Number(gatewayId));
  }

  isServerSelected(serverId: number): boolean {
    return this.form.servers.some((item: any) => Number(item.server_id) === Number(serverId));
  }

  onServerToggle(server: any, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const serverId = Number(server.server_id);

    if (checked) {
      if (!this.isServerSelected(serverId)) {
        this.form.servers = [
          ...this.form.servers,
          {
            server_id: serverId,
            quantity: Number(server.allocated_quantity ?? 0),
            price_per_unit: ''
          }
        ];
      }
      return;
    }

    this.form.servers = this.form.servers.filter((item: any) => Number(item.server_id) !== serverId);
  }

  getSelectedServer(serverId: number): any {
    return this.form.servers.find((item: any) => Number(item.server_id) === Number(serverId));
  }

  isInvalidPositiveNumber(value: any): boolean {
    return value === '' || value === null || value === undefined || Number(value) <= 0;
  }

  private hasInvalidAssetPricing(): boolean {
    const invalidAsset = this.form.assets.some((item: any) => this.isInvalidPositiveNumber(item.price));
    if (invalidAsset) {
      this.toastr.warning('Please enter a valid price for each selected asset.');
      return true;
    }

    const invalidSystem = this.form.systems.some((item: any) => this.isInvalidPositiveNumber(item.price));
    if (invalidSystem) {
      this.toastr.warning('Please enter a valid price for each selected system.');
      return true;
    }

    const invalidGateway = this.form.gsm_gateways.some((item: any) =>
      Number(item.quantity) <= 0 || this.isInvalidPositiveNumber(item.price_per_unit)
    );
    if (invalidGateway) {
      this.toastr.warning('Please enter a valid price for each selected gateway.');
      return true;
    }

    const invalidServer = this.form.servers.some((item: any) =>
      Number(item.quantity) <= 0 || this.isInvalidPositiveNumber(item.price_per_unit)
    );
    if (invalidServer) {
      this.toastr.warning('Please enter a valid price for each selected server.');
      return true;
    }

    return false;
  }

  submitAgreement() {
    this.isSubmitted = true;

    if (this.isFieldInvalid('client_id')) {
      this.toastr.warning('Please select client.');
      return;
    }

    if (this.isFieldInvalid('billing_cycle_day')) {
      this.toastr.warning('Please select billing day.');
      return;
    }

    if (this.isFieldInvalid('start_date')) {
      this.toastr.warning('Please select start date.');
      return;
    }

    this.updateEndDate();

    if (this.isFieldInvalid('end_date')) {
      this.toastr.warning('End date is required.');
      return;
    }

    if (this.hasInvalidAssetPricing()) {
      return;
    }

    const payload = {
      client_id: Number(this.form.client_id),
      billing_cycle_day: Number(this.form.billing_cycle_day),
      start_date: this.form.start_date,
      end_date: this.form.end_date,
      assets: this.form.assets.map((item: any) => ({
        asset_id: Number(item.asset_id),
        price: Number(item.price)
      })),
      systems: this.form.systems.map((item: any) => ({
        system_id: Number(item.system_id),
        price: Number(item.price)
      })),
      gsm_gateways: this.form.gsm_gateways.map((item: any) => ({
        gateway_id: Number(item.gateway_id),
        quantity: Number(item.quantity),
        price_per_unit: Number(item.price_per_unit)
      })),
      servers: this.form.servers.map((item: any) => ({
        server_id: Number(item.server_id),
        quantity: Number(item.quantity),
        price_per_unit: Number(item.price_per_unit)
      }))
    };

    this.isSubmitting = true;
    this.loading = true;

    const request = this.isEditMode && this.agreementId
      ? this.apiService.put(`admin/agreements/${this.agreementId}`, payload)
      : this.apiService.post(`admin/agreements`, payload);

    request.subscribe({
      next: (resp: any) => {
        this.toastr.success(resp.message || (this.isEditMode ? 'Agreement updated.' : 'Agreement added.'));
        this.isSubmitting = false;
        this.loading = false;
        this.router.navigateByUrl('/home/agreements');
      },
      error: (error) => {
        this.isSubmitting = false;
        this.loading = false;
        const msg = error.error?.message || error.message || 'Something went wrong.';
        this.toastr.error(msg);
      }
    });
  }
}
