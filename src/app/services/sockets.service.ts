import { Injectable } from "@angular/core";
import { io } from "socket.io-client";
import { environment } from "src/environments/environment";
import { map } from "rxjs/operators";
import { Subject, Observable } from "rxjs";

interface callActionRequest {
  sessionId: number;
  responseType: string;
  isLastUser?: boolean;
  isReconnecting?: boolean;
  otherUsers?: boolean;
}

@Injectable({
  providedIn: "root",
})
export class SocketsService {
  private socket;

  constructor() {
    this.socket = io(environment.socketUrl, { transports: ["websocket"] });
  }

  disconnect(){
    this.socket.disconnect()
  }

  onError = () => {
    let observable = new Observable((observer) => {
      this.socket.on("error", (data) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    return observable;
  };

  onUpdateStatusOfSession = () => {
    let observable = new Observable((observer) => {
      this.socket.on("updateStatusOfSession", (data) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    return observable;
  };

  onCallSessionUpdate = () => {
    let observable = new Observable((observer) => {
      this.socket.on("onCallSessionUpdate", (data) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    return observable;
  };

  onCallSessionUserUpdate = () => {
    let observable = new Observable((observer) => {
      this.socket.on("onCallSessionUserUpdate", (data) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    return observable;
  };

  onConnectUserStatus = () => {
    let observable = new Observable((observer) => {
      this.socket.on("connectUserStatus", (data) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    return observable;
  };

  onMessage = () => {
    let observable = new Observable((observer) => {
      this.socket.on("message", (data) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    return observable;
  };

  // sendMessage(msg: string) {
  //   this.socket.emit("message", msg);
  // }

  public emitConnectUser(sessionId) {
    let message = {
      user_id: Number(localStorage.getItem("user_id")),
      user_type: localStorage.getItem("user_type").replace(/^"(.*)"$/, '$1'),
      session_id: sessionId,
    };
    this.socket.emit("connectUser", message);
  }

  public emitGetStatusOfSession(sessionId) {
    let message = {
      session_id: sessionId,
    };
    this.socket.emit("getStatusOfSession", message);
  }

  public emitConnectRoom(sessionId) {
    let message = {
      user_id: Number(localStorage.getItem("user_id")),
      user_type: localStorage.getItem("user_type"),
      session_id: sessionId,
    };
    this.socket.emit("connectRoom", message);
  }

  public emitCallActionForSession({
    sessionId,
    responseType,
    isLastUser = false,
    isReconnecting = false,
    otherUsers = true,
  }: callActionRequest) {
    let message = {
      user_id: Number(localStorage.getItem("user_id")),
      user_type: localStorage.getItem("user_type"),
      session_id: sessionId,
      response_type: responseType,
      is_last_user: isLastUser,
      is_reconnecting_user: isReconnecting,
      other_user: otherUsers,
    };
    this.socket.emit("callActionForSession", message);
  }
}
