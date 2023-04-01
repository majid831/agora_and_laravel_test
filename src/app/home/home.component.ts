import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from "@angular/core";
import { OnDemandService } from "../services/on-demand-service";
import { SocketsService } from "../services/sockets.service";
import AgoraRTC from "agora-rtc-sdk-ng";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  @ViewChild("userStreams") userStreams: ElementRef;
  @ViewChild("footer") footer: ElementRef;
  @ViewChild("joinWrapper") joinWrapper: ElementRef;

  callScreen: string;

  sourceLanguage: string = "english";
  targetLanguage: string = "english";

  rtcClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

  localTracks: any = {
    audioTrack: null,
    videoTrack: null,
  };

  sessionId: number;
  channelId: number;

  config: {
    appid: string;
    token: string;
    uid: string | number;
    channel: string;
  };

  user_id = Number(localStorage.getItem("user_id"));
  user_type = localStorage.getItem("user_type").replace(/['"]+/g, "");

  remoteTracks = {};

  constructor(
    private socketsService: SocketsService,
    private onDemandService: OnDemandService,
    public renderer: Renderer2,
    private changeDetection: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.callScreen = "menu";

    this.onDemandService.getAppId().subscribe((res) => {

      this.config = {
        appid: res.data.app_id,
        token: '',
        uid:  `${this.user_type}|${this.user_id}`,
        channel: '',
      }
    });
  }

  public requestCall() {
    this.onDemandService
      .requestCall(this.sourceLanguage, this.targetLanguage, "video")
      .subscribe((res) => {
        (this.sessionId = res.data.session_id);
        (this.config.token = res.data.token);
        (this.config.channel = res.data.channel_id);
        console.log(res);
        this.callScreen = "waiting";
        this.emitConnectUser();
        this.emitConnectRoom();
        this.changeDetection.detectChanges();
        console.log(this.config);
      });
  }

  public emitConnectUser() {
    this.socketsService.emitConnectUser(this.sessionId);
  }

  public emitConnectRoom() {
    this.socketsService.emitConnectRoom(this.sessionId);
  }
  

  public acceptCall() {
    this.onDemandService
      .acceptCall("video", this.channelId)
      .subscribe((res) => {
        (this.sessionId = res.data.session_id),
          (this.config.token = res.data.token),
          (this.config.channel = res.data.channel_id);
        this.callScreen = "waiting";
        this.emitConnectUser();
        this.emitConnectRoom();
        this.changeDetection.detectChanges();
      });
  }

  async join() {
    await this.joinStreams();
    this.renderer.setStyle(this.footer.nativeElement, 'display', 'flex');
    // this.renderer.setStyle(this.joinWrapper.nativeElement, 'display', 'none');
  }

  async joinStreams() {
    this.rtcClient.on('user-published', this.handleUserJoined);
    this.rtcClient.on('user-left', this.handleUserLeft);

    this.rtcClient.enableAudioVolumeIndicator(); // Triggers the "volume-indicator" callback event every two seconds.
    this.rtcClient.on('volume-indicator', function (evt) {
      for (let i = 0; evt.length > i; i++) {
        let speaker = evt[i].uid;
        let volume = evt[i].level;
        if (volume > 0) {
          let ele = document.getElementById(
            `volume-${speaker}`
          ) as HTMLImageElement;
          ele.classList.remove('fa-volume-xmark');
          ele.classList.add('fa-volume-high');
        } else {
          let ele = document.getElementById(
            `volume-${speaker}`
          ) as HTMLImageElement;
          ele.classList.remove('fa-volume-high');
          ele.classList.add('fa-volume-xmark');
        }
      }
    });

    //#6 - Set and get back tracks for local user
    [
      this.config.uid,
      this.localTracks.audioTrack,
      // this.localTracks.videoTrack,
    ] = await Promise.all([
      this.rtcClient.join(
        this.config.appid,
        this.config.channel,
        this.config.token || null,
        this.config.uid || null
      ),
      AgoraRTC.createMicrophoneAudioTrack(),
      // AgoraRTC.createCameraVideoTrack(),
    ]);
    //#7 - Create player and add it to player list

    let div = this.renderer.createElement('div');
    this.renderer.setAttribute(div, 'id', `video-wrapper-${this.config.uid}`);
    this.renderer.addClass(div, 'video-containers');

    let player = ` <p class="user-uid">
                    <i id="volume-${this.config.uid}" class="volume-icon fa-solid fa-volume-high"></i>${this.config.uid}</p>
                    <div class="video-player player" id="stream-${this.config.uid}"></div>`;
    this.renderer.setProperty(div, 'innerHTML', player);
    // this.renderer.setProperty(div,'innerHTML', 'hello')
    this.renderer.appendChild(this.userStreams.nativeElement, div);
    // this.userStreams.nativeElement.insertAdjacentHTML('beforeend', player);
    //#8 - Player user stream in div
    // this.localTracks.videoTrack.play(`stream-${this.config.uid}`);
    //#9 Add user to user list of names/ids

    //#10 - Publish my local video tracks to entire channel so everyone can see it
    await this.rtcClient.publish([
      this.localTracks.audioTrack,
      // this.localTracks.videoTrack,
    ]);
  }


  handleUserJoined = async (user: any, mediaType: any) => {
    console.log('Handle user joined');

    //#11 - Add user to list of remote users

    this.remoteTracks[user.uid] = user;

    // if(!this.remoteTracks){
    //   this.remoteTracks = {userId: user}
    // } else
    // {
    //   Object.assign(this.remoteTracks, {userId: user})
    // }

    //#12 Subscribe to remote users
    await this.rtcClient.subscribe(user, mediaType);

    if (mediaType === 'video') {
      let player: any = document.getElementById(`video-wrapper-${user.uid}`);
      console.log('player:', player);
      if (player != null) {
        player.remove();
      }

      player = `<div class="video-containers" id="video-wrapper-${user.uid}">
                        <p class="user-uid">
                        <i id="volume-${user.uid}" class="volume-icon fa-solid fa-volume-high"></i>
                         ${user.uid}</p>
                        <div  class="video-player player" id="stream-${user.uid}"></div>
                      </div>`;
      document
        .getElementById('user-streams')
        .insertAdjacentHTML('beforeend', player);
      user.videoTrack.play(`stream-${user.uid}`);
    }

    if (mediaType === 'audio') {
      user.audioTrack.play();
    }
  };

  handleUserLeft = (user: any) => {
    console.log('Handle user left!');
    //Remove from remote users and remove users video wrapper
    delete this.remoteTracks[user.uid];
    document.getElementById(`video-wrapper-${user.uid}`)!.remove();
  };


}
