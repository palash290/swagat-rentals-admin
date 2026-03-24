import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ValidationErrorService } from '../../services/validation-error.service';
import { CommonModule } from '@angular/common';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Router, RouterLink } from "@angular/router";
import { CommonService } from '../../services/common.service';
@Component({
  selector: 'app-log-in',
  imports: [ReactiveFormsModule, CommonModule, FormsModule, RouterLink],
  templateUrl: './log-in.component.html',
  styleUrl: './log-in.component.css'
})
export class LogInComponent {

  Form!: FormGroup;
  loading: boolean = false;
  loginRole: 'admin' | 'sub_admin' = 'admin';

  constructor(private fb: FormBuilder, public validationErrorService: ValidationErrorService, private toastr: NzMessageService,
    private service: CommonService, private router: Router
  ) { }

  ngOnInit(): void {
    this.Form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  login() {
    // this.closeModalAdd.nativeElement.click();
    // this.router.navigateByUrl('/admin/my-profile')
    // return;
    this.Form.markAllAsTouched();

    if (this.Form.valid) {
      this.loading = true;
      const formURlData = new URLSearchParams();
      formURlData.set('email', this.Form.value.email);
      formURlData.set('password', this.Form.value.password);
      if (this.loginRole === 'sub_admin') {
        formURlData.set('role', 'sub_admin');
      }
      if (this.loginRole === 'admin') {
        formURlData.set('role', 'admin');
      }
      this.service.post('admin/login', formURlData.toString()).subscribe({
        next: (resp: any) => {
          if (resp.success == true) {
            this.service.setToken(resp.data.token);
            this.loading = false;
            this.toastr.success(resp.message);
            this.router.navigateByUrl('/home/dashboard');
            localStorage.setItem('role', resp.data.role);
          } else {
            this.toastr.warning(resp.message);
            this.loading = false;
          }
        },
        error: (error) => {
          this.loading = false;

          const msg =
            error.error?.message ||
            error.error?.error ||
            error.message ||
            "Something went wrong!";

          this.toastr.error(msg);
        }
      });
    }
  }

  isPasswordVisible: boolean = false;

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  setRole(role: 'admin' | 'sub_admin') {
    this.loginRole = role;
  }

}
