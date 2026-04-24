import { Component } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-asset',
  imports: [RouterLink, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-asset.component.html',
  styleUrl: './add-asset.component.css'
})
export class AddAssetComponent {

  constructor(
    private apiService: CommonService,
    private toastr: NzMessageService,
    private route: ActivatedRoute,
    private router: Router
  ) { }



}
