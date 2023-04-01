import { HttpErrorResponse, HttpEvent, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take, tap } from "rxjs/operators";
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TokenInterceptorService {

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private injector: Injector, private router: Router, private authService: AuthService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler) {

    const token = this.authService.getToken();
    if (token != null) {
      if (!req.url.includes('https://accessorix.s3.eu-west-2.amazonaws.com')) {
        req = this.addTokenHeader(req, token);
      }
      if (req.url.includes('auth/refresh')) {
        const refreshToken = this.authService.getRefreshToken();
        req = this.addTokenHeader(req, refreshToken);
      }
    }
    return next.handle(req).pipe(catchError(error => {
      if (error instanceof HttpErrorResponse && !req.url.includes('auth/login') && error.status === 401) {
        return this.handle401(req, next);
      } else {
        return throwError(error);
      }
    }));
  }



  private handle401(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    /**
     * If we're not refreshing a token, refresh it
     * and retry the original request.
     */
    if (!this.isRefreshing) {
      this.isRefreshing = true;

      const refreshToken = this.authService.getRefreshToken();

      if (refreshToken) {
        return this.authService.refreshToken().pipe(
          tap((accessToken) => {
            this.isRefreshing = false;
            localStorage.setItem("access_token", accessToken.data.access_token.token);
            localStorage.setItem("refresh_token", accessToken.data.refresh_token.token);
          }),
          switchMap((accessToken) => {
            this.refreshTokenSubject.next(accessToken.data.access_token.token);
            return next.handle(this.addTokenHeader(request, accessToken.data.access_token.token));
          }),
          catchError((err) => {
            this.isRefreshing = false;
            localStorage.clear();
            this.router.navigate(["/"]);
            return throwError('Unauthorized');
          })
        );
      } else {
        this.isRefreshing = false;
        localStorage.clear();
        this.router.navigate(["/"]);
        return throwError('Unauthorized');
      }

    }

    /**
     * If we're already refreshing a token, wait
     * until we get the new one and perform the
     * request with the new Access Token.
     */
     return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => next.handle(this.addTokenHeader(request, token))),
    );
  }


  private addTokenHeader(request: HttpRequest<any>, token: string) {
    return request.clone({
      headers: request.headers
        .set("Authorization", `Bearer ${token}`)
        .set("Accept", `application/json`),
    });
  }
}


