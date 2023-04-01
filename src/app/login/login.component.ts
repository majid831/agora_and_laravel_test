import { Component, OnInit } from '@angular/core';
import { NgForm, FormGroup, FormControl, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from '@angular/router';
import { Login } from '../model/login.model';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginFormSubmitted = false;
  userType: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
  ) {
    
  }


  

  loginForm = new FormGroup({
    email: new FormControl("", [Validators.required]),
    password: new FormControl("", [Validators.required]),
  });

  get lf() {
    return this.loginForm.controls;
  }

  ngOnInit() {
    this.userType = this.route.snapshot.paramMap.get('userType');
    console.log(this.userType);
  }

  onSubmit() {
    this.loginFormSubmitted = true;
    if (this.loginForm.invalid) {
      return;
    }

    let postData: Login = {
      user_type: this.userType,
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
    };

    this.authService.login(postData).subscribe(
      (res) => {
        console.log(res);
      },
      (err) => {

      }
    );
  }
}
