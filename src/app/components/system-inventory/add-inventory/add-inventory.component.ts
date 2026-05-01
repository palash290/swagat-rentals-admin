import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonService } from '../../../services/common.service';

@Component({
  selector: 'app-add-inventory',
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './add-inventory.component.html',
  styleUrl: './add-inventory.component.css'
})
export class AddInventoryComponent {
  system_id: any;
  categoryList: any[] = [];
  page = 1;
  limit = 100;
  submitted = false;
  loading = false;
  form: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private service: CommonService,
    private toastr: NzMessageService,
    private router: Router
  ) {
    this.form = this.fb.group({
      device_type: ['', Validators.required],
      system_info: this.fb.group({
        device_type: ['', Validators.required],
        os: ['', Validators.required],
        osInfo: this.fb.group({
          distro: [''],
          platform: [''],
          hostname: ['']
        }),
        mac_addres: ['', Validators.required]
      }),
      assets: this.fb.array([this.createAssetGroup()])
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.system_id = params['system_id'];
    });

    this.getAllCategory();

    this.form.get('device_type')?.valueChanges.subscribe((deviceType) => {
      this.form.get('system_info.device_type')?.setValue(deviceType ?? '', { emitEvent: false });
    });
  }

  get assets(): FormArray {
    return this.form.get('assets') as FormArray;
  }

  getAllCategory() {
    const params = new URLSearchParams();
    params.append('page', this.page.toString());
    params.append('limit', this.limit.toString());

    this.service.get(`assets/asset-categories?${params.toString()}`).subscribe({
      next: (resp: any) => {
        this.categoryList = resp?.data?.items ?? resp?.data ?? [];
      },
      error: (error) => {
        console.log(error.message);
        this.categoryList = [];
      }
    });
  }

  createAssetGroup(): FormGroup {
    return this.fb.group({
      category: ['', Validators.required],
      brand: ['', Validators.required],
      model: ['', Validators.required],
      serial: ['', Validators.required],
      manufacturer: ['', Validators.required],
      size: ['']
    });
  }

  addAsset(): void {
    this.assets.push(this.createAssetGroup());
  }

  removeAsset(index: number): void {
    if (this.assets.length === 1) return;
    this.assets.removeAt(index);
  }

  isFieldInvalid(path: string): boolean {
    const control = this.form.get(path);
    return !!control && control.invalid && (control.touched || control.dirty || this.submitted);
  }

  isAssetFieldInvalid(index: number, field: string): boolean {
    const control = this.assets.at(index)?.get(field);
    return !!control && control.invalid && (control.touched || control.dirty || this.submitted);
  }

  private getPayload() {
    const rawValue = this.form.getRawValue();

    return {
      device_type: String(rawValue.device_type ?? '').trim(),
      system_info: {
        device_type: String(rawValue.system_info?.device_type ?? '').trim(),
        os: String(rawValue.system_info?.os ?? '').trim(),
        osInfo: {
          distro: String(rawValue.system_info?.osInfo?.distro ?? '').trim(),
          platform: String(rawValue.system_info?.osInfo?.platform ?? '').trim(),
          hostname: String(rawValue.system_info?.osInfo?.hostname ?? '').trim()
        },
        mac_addres: String(rawValue.system_info?.mac_addres ?? '').trim()
      },
      assets: (rawValue.assets ?? []).map((asset: any) => ({
        category: String(asset.category ?? '').trim(),
        brand: String(asset.brand ?? '').trim(),
        model: String(asset.model ?? '').trim(),
        serial: String(asset.serial ?? '').trim(),
        manufacturer: String(asset.manufacturer ?? '').trim(),
        size: String(asset.size ?? '').trim(),
        spec_json: {}
      }))
    };
  }

  onSubmit(): void {
    this.submitted = true;
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.toastr.warning('Please fill all required fields.');
      return;
    }

    this.loading = true;
    const payload = this.getPayload();

    this.service.post('assets/system-inventory', payload).subscribe({
      next: (resp: any) => {
        this.loading = false;
        this.toastr.success(resp?.message || 'Inventory added successfully.');
        this.router.navigateByUrl('/home/system-inventory');
      },
      error: (error) => {
        this.loading = false;
        const message = error?.error?.message || error?.message || 'Something went wrong.';
        this.toastr.error(message);
      }
    });
  }
}
