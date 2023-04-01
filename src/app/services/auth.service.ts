import { Router } from "@angular/router";
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { Login } from "../model/login.model";
import { catchError, tap } from "rxjs/operators";
import { throwError } from "rxjs";

@Injectable()
export class AuthService {
  constructor(
    public router: Router,
    private http: HttpClient,
  ) {}

  getScopes() {
    return this.http.get<any>(`${environment.baseUrl}auth/load-scopes-info`);
  }

  login(postData: Login) {
    return this.http
      .post<any>(`${environment.baseUrl}auth/login`, postData)
      .pipe(
        tap((res) => {
          let queryParams = btoa(
            JSON.stringify({
              email: postData.email,
              user_type: postData.user_type,
              password: postData.password,
            })
          );
          if (!res.data.email_verified && !res.data.admin_confirmed && !res.data.temporary_password) {
            this.router.navigate(["pages/email-verification"], {
              queryParams: { user: queryParams },
            });
          }
          if (res.data.temporary_password) {
            this.router.navigate(["pages/temporary-password"], {
              queryParams: { user: queryParams },
            });
          }
          if (res.data.email_verified && !res.data.admin_confirmed && postData.user_type == "rep") {
            // this.router.navigate(["pages/login/rep"]);
            // Swal.fire({
            //   text: "Thank you for your patience. Our admin team will assign it to the appropriate company(client). If you have an urgent enquiry please call us",
            //   icon: "info",
            //   showCancelButton: false,
            //   confirmButtonText: "I Understand",
            // })
          }
          if (
            res.data.email_verified &&
            !res.data.temporary_password &&
            res.data.admin_confirmed
          ) {
            console.log('here');
            localStorage.setItem("user_type", JSON.stringify(res.data.user.user_type));
            localStorage.setItem("user_id", JSON.stringify(res.data.user.id));
            localStorage.setItem("access_token", res.data.access_token.token);
            localStorage.setItem("refresh_token", res.data.refresh_token.token);
            this.router.navigate(["/home"]);
          }
        })
      );
  }

  getToken() {
    return localStorage.getItem("access_token");
  }

  getUserType() {
    return JSON.parse(localStorage.getItem("user_type"));
  }

  resendVerificationCode(postData: Partial<Login>) {
    return this.http.post<any>(
      `${environment.baseUrl}auth/resend-verification-code`,
      postData
    );
  }

  refreshToken() {
    return this.http.post<any>(`${environment.baseUrl}auth/refresh`, null);
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem("refresh_token");
  }

  verifyEmail(postData: Login) {
    return this.http.post<any>(
      `${environment.baseUrl}auth/verify-email`,
      postData
    );
  }

  changeTemporaryPassword(postData: {
    user_type: string;
    email: string;
    current_password: string;
    new_password: string;
  }) {
    return this.http.post<any>(
      `${environment.baseUrl}auth/change-temporary-password`,
      postData
    );
  }

  forgotPassword(postData: Partial<Login>){
    return this.http.post<any>(
      `${environment.baseUrl}forgot-password/request-code`,
      postData
    );
  }

  resetPassword(postData: Login){
    return this.http.post<any>(
      `${environment.baseUrl}forgot-password/reset-password`,
      postData
    );
  }

  logout() {
    return this.http.post<any>(`${environment.baseUrl}auth/logout`, null).pipe(
      tap((res) => {
        localStorage.clear();
        this.router.navigate(["/"]);
      })
    );
  }

  isAuthenticated() {
    return !!localStorage.getItem("access_token");
  }
}
