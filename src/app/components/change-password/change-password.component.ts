import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'app-change-password',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent {

  form!: FormGroup;
  passwordMismatch = false;
  loading: boolean = false;
  isPasswordVisible1: boolean = false;
  isPasswordVisible2: boolean = false;
  isPasswordVisible3: boolean = false;

  constructor(private service: CommonService, private toastr: NzMessageService) { }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.form = new FormGroup({
      current_password: new FormControl('', Validators.required),
      new_password: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirm_password: new FormControl('', Validators.required),
    });
    //, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    this.form.get('confirm_password')?.setValidators([
      Validators.required,
      this.passwordMatchValidator()
    ]);
  }

  submitForm() {
    this.form.markAllAsTouched();

    const currPassword = this.form.value.current_password?.trim();
    const newPassword = this.form.value.new_password?.trim();

    if (!currPassword || !newPassword) {
      //this.toastr.warning('Passwords cannot be empty or just spaces.');
      return;
    }

    if (this.form.valid && !this.passwordMismatch) {
      this.loading = true;
      const formURlData = new URLSearchParams();
      formURlData.set('current_password', this.form.value.current_password);
      formURlData.set('new_password', this.form.value.new_password);
      formURlData.set('confirm_new_password', this.form.value.confirm_password);
      this.service.post('admin/change-password', formURlData.toString()).subscribe({
        next: (resp: any) => {
          if (resp.success) {
            this.toastr.success(resp.message);
            console.log(resp.message)
            this.form.reset();
            this.loading = false;
          } else {
            this.toastr.warning(resp.message);
            this.loading = false;
          }
        },
        error: (error) => {
          this.loading = false;
          this.toastr.warning(error.message);
          console.error('Login error:', error.message);
        }
      });
    }
  }

  passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const password = this.form.get('new_password')?.value;
      const confirmPassword = control.value;
      if (password !== confirmPassword) {
        this.passwordMismatch = true;
        return { passwordMismatch: true };
      } else {
        this.passwordMismatch = false;
        return null;
      }
    };
  }


  togglePasswordVisibility1() {
    this.isPasswordVisible1 = !this.isPasswordVisible1;
  }


  togglePasswordVisibility2() {
    this.isPasswordVisible2 = !this.isPasswordVisible2;
  }


  togglePasswordVisibility3() {
    this.isPasswordVisible3 = !this.isPasswordVisible3;
  }


}
