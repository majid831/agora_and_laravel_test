import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class OnDemandService {
  constructor(public router: Router, private http: HttpClient) {}

  requestCall(source_language, target_language, call_type) {
    let data = { source_language, target_language, call_type };

    return this.http.post<any>(
      `${environment.baseUrl}on-demand/request-call`,
      data
    );
  }

  acceptCall(call_type, channel_id) {
    let data = { call_type, channel_id };
    return this.http.post<any>(
      `${environment.baseUrl}on-demand/accept-call`,
      data
    );
  }
  toggleAvailability() {}

  getAppId() {
    return this.http.get<any>(`${environment.baseUrl}on-demand/app-id`);
  }
}
