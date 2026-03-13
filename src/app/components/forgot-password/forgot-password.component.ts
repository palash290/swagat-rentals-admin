import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonService } from '../../services/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-forgot-password',
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {

  Form!: FormGroup;
  loading: boolean = false;

  constructor(
    private apiSrevice: CommonService,
    private toastr: NzMessageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.Form = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email])
    })
  }

  onSubmit() {
    this.Form.markAllAsTouched();
    if (this.Form.valid) {
      this.loading = true;
      const formURlData = new URLSearchParams();
      formURlData.set('email', this.Form.value.email);
      this.apiSrevice
        .post('admin/forgot-password', formURlData.toString())
        .subscribe({
          next: (resp: any) => {
            if (resp.success == true) {
              this.loading = false;
              this.router.navigate(['/login']);
              this.toastr.success(resp.message);
              this.Form.reset();
            } else {
              this.loading = false;
              this.toastr.warning(resp.message);
            }
          },
          error: (error: any) => {
            this.loading = false;
            const msg =
              error.error?.message ||
              error.error?.error ||
              error.message ||
              "Something went wrong!";
            this.toastr.error(msg);
          }
        })
    }
  }


}
