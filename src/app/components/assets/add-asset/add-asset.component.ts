import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonService } from '../../../services/common.service';

type InventoryMode = 'with_serial_number' | 'without_serial_number';

@Component({
  selector: 'app-add-asset',
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  templateUrl: './add-asset.component.html',
  styleUrl: './add-asset.component.css'
})
export class AddAssetComponent {
  loading = false;
  submitted = false;
  categoryList: any[] = [];

  readonly inventoryModes = [
    { value: 'with_serial_number', label: 'With Serial Number' },
    { value: 'without_serial_number', label: 'Without Serial Number' }
  ];

  readonly statusOptions = [
    { value: 'in_stock', label: 'In Stock' },
    { value: 'rented', label: 'Rented' },
    { value: 'damaged', label: 'Damaged' },
    { value: 'retired', label: 'Retired' },
    { value: 'used_in_system', label: 'Used in System' }
  ];

  Form: FormGroup;
  inventoryModeControl = new FormControl<InventoryMode>('with_serial_number', { nonNullable: true });

  constructor(
    private fb: FormBuilder,
    private apiService: CommonService,
    private toastr: NzMessageService,
    private router: Router
  ) {
    this.Form = this.fb.group({
      asset_category_id: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      assets_details: this.fb.array([])
    });
  }

  ngOnInit() {
    this.getAssetCategories();
    this.resetAssetDetailsForMode(this.inventoryMode);

    this.inventoryModeControl.valueChanges.subscribe((mode: InventoryMode) => {
      this.resetAssetDetailsForMode(mode);
    });
  }

  get inventoryMode(): InventoryMode {
    return this.inventoryModeControl.value;
  }

  get assetsDetails(): FormArray {
    return this.Form.get('assets_details') as FormArray;
  }

  getAssetDetailControl(index: number, fieldName: string): AbstractControl | null {
    return this.assetsDetails.at(index)?.get(fieldName) ?? null;
  }

  isAssetDetailFieldInvalid(index: number, fieldName: string): boolean {
    const control = this.getAssetDetailControl(index, fieldName);
    return !!control && control.invalid && (control.touched || control.dirty || this.submitted);
  }

  hasAssetDetailRequiredError(index: number, fieldName: string): boolean {
    return this.getAssetDetailControl(index, fieldName)?.hasError('required') ?? false;
  }

  private getFirstAssetDetailSnapshot() {
    const firstAsset = this.assetsDetails.at(0)?.getRawValue();

    return {
      brand: firstAsset?.brand ?? '',
      model: firstAsset?.model ?? '',
      manufacturer: firstAsset?.manufacturer ?? '',
      serial_number: firstAsset?.serial_number ?? '',
      size: firstAsset?.size ?? '',
      status: firstAsset?.status ?? 'in_stock',
      is_available: firstAsset?.is_available ?? true
    };
  }

  private trimRequiredValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      return String(control.value ?? '').trim() ? null : { required: true };
    };
  }

  private createAssetDetail(
    serialRequired: boolean,
    initialValue?: Partial<{
      brand: string;
      model: string;
      manufacturer: string;
      serial_number: string;
      size: string;
      status: string;
      is_available: boolean;
    }>
  ): FormGroup {
    return this.fb.group({
      brand: [initialValue?.brand ?? '', this.trimRequiredValidator()],
      model: [initialValue?.model ?? '', this.trimRequiredValidator()],
      manufacturer: [initialValue?.manufacturer ?? '', this.trimRequiredValidator()],
      serial_number: [initialValue?.serial_number ?? '', serialRequired ? this.trimRequiredValidator() : []],
      size: [initialValue?.size ?? '', this.trimRequiredValidator()],
      status: [initialValue?.status ?? 'in_stock', Validators.required],
      is_available: [initialValue?.is_available ?? true]
    });
  }

  private resetAssetDetailsForMode(mode: InventoryMode): void {
    this.submitted = false;
    const firstAssetSnapshot = this.getFirstAssetDetailSnapshot();
    const currentQuantity = Number(this.Form.get('quantity')?.value) || 1;

    while (this.assetsDetails.length) {
      this.assetsDetails.removeAt(0);
    }

    if (mode === 'with_serial_number') {
      this.Form.patchValue({ quantity: 1 }, { emitEvent: false });
      this.assetsDetails.push(this.createAssetDetail(true, firstAssetSnapshot));
      this.assetsDetails.markAsPristine();
      this.assetsDetails.markAsUntouched();
      return;
    }

    this.Form.patchValue({ quantity: currentQuantity }, { emitEvent: false });
    this.assetsDetails.push(this.createAssetDetail(false, firstAssetSnapshot));
    this.assetsDetails.markAsPristine();
    this.assetsDetails.markAsUntouched();
  }

  addAssetRow(): void {
    if (this.inventoryMode !== 'with_serial_number') return;
    this.assetsDetails.push(this.createAssetDetail(true));
    this.Form.patchValue({ quantity: this.assetsDetails.length }, { emitEvent: false });
  }

  removeAssetRow(index: number): void {
    if (this.inventoryMode !== 'with_serial_number' || this.assetsDetails.length === 1) return;
    this.assetsDetails.removeAt(index);
    this.Form.patchValue({ quantity: this.assetsDetails.length }, { emitEvent: false });
  }

  private getAssetCategories(): void {
    this.apiService.get(`assets/asset-categories?page=1&limit=1000`).subscribe({
      next: (resp: any) => {
        this.categoryList = resp?.data?.items ?? resp?.data ?? [];
      },
      error: () => {
        this.categoryList = [];
      }
    });
  }

  private getPayload() {
    const rawValue = this.Form.getRawValue();
    const isSerialNumberAvailable = this.inventoryMode === 'with_serial_number';
    const assetDetails = rawValue.assets_details.map((item: any) => ({
      brand: String(item.brand ?? '').trim(),
      model: String(item.model ?? '').trim(),
      manufacturer: String(item.manufacturer ?? '').trim(),
      ...(isSerialNumberAvailable ? { serial_number: String(item.serial_number ?? '').trim() } : {}),
      size: String(item.size ?? '').trim(),
      spec_json: {},
      status: item.status,
      is_available: !!item.is_available
    }));

    return {
      asset_category_id: Number(rawValue.asset_category_id),
      quantity: isSerialNumberAvailable ? assetDetails.length : Number(rawValue.quantity),
      is_serial_number_available: isSerialNumberAvailable,
      assets_details: isSerialNumberAvailable ? assetDetails : [assetDetails[0]]
    };
  }

  onSubmit(): void {
    this.submitted = true;
    // this.Form.markAllAsTouched();

    if (this.inventoryMode === 'with_serial_number') {
      this.Form.patchValue({ quantity: this.assetsDetails.length }, { emitEvent: false });
    }

    if (this.Form.invalid) {
      this.toastr.warning('Please fill all required fields.');
      return;
    }

    const payload = this.getPayload();
    this.loading = true;

    this.apiService.post('assets/inventory', payload).subscribe({
      next: (resp: any) => {
        this.loading = false;
        this.toastr.success(resp?.message || 'Asset inventory created successfully.');
        this.router.navigateByUrl('/home/assets');
      },
      error: (error) => {
        this.loading = false;
        const message = error?.error?.message || error?.message || 'Something went wrong.';
        this.toastr.error(message);
      }
    });
  }

  trackByIndex(index: number): number {
    return index;
  }
}
