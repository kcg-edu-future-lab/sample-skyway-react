import { VirtualBackground } from "./VirtualBackground";

interface StreamCreatedEventDetail{
    stream: MediaStream;
}
interface StreamUpdatedEventDetail{
    stream: MediaStream;
}
class UserStreamManagerEvents extends EventTarget{
    on(type: "streamCreated", callback: (detail: StreamCreatedEventDetail)=>void): void;
    on(type: "streamUpdated", callback: (detail: StreamUpdatedEventDetail)=>void): void;
    on(type: "streamDestroyed", callback: ()=>void): void;
    on(type: string, callback: Function): void {
        super.addEventListener(type, e=>callback((e as any).detail));
    }
    protected fire(type: "streamCreated", detail: StreamCreatedEventDetail): void;
    protected fire(type: "streamUpdated", detail: StreamUpdatedEventDetail): void;
    protected fire(type: "streamDestroyed"): void;
    protected fire(type: string, detail?: object){
        this.dispatchEvent(new CustomEvent(type, {detail}));
    }
}

/**
 * 利用者のメディアストリームを管理するクラス。
 * 自撮り画像のストリームと送信用ストリームの作成・更新・廃棄を通知する。
 */
export class UserStreamManager extends UserStreamManagerEvents{
    private micOn = false;
    private cameraOn = false;
    private cameraWidth = 0;
    private cameraHeight = 0;
    private userMediaStream: MediaStream | null = null;
    private vb: VirtualBackground;
    private video: HTMLVideoElement;
    private canvas: HTMLCanvasElement;
    private canvasStream: MediaStream;
    private prevTime = 0;

    constructor(vbImage: string | null = null){
        super();
        this.vb = new VirtualBackground();

        const v = document.createElement("video");
        v.muted = true;
        v.width = 100;
        v.height = 100;
//        v.style.display = "none";
//        document.documentElement.appendChild(v);
        this.video = v;

        const c = document.createElement("canvas");
        c.width = 100;
        c.height = 100;
        this.canvas = c;
        this.canvasStream = this.canvas.captureStream();
//        document.documentElement.appendChild(c);
    }

    setStates(micOn: boolean, cameraOn: boolean, ){
        this.updateMediaStream(micOn, cameraOn);
    }
    setMicState(on: boolean){
        this.updateMediaStream(on, this.cameraOn);
    }
    setCameraState(on: boolean){
        this.updateMediaStream(this.micOn, on);
    }
    private async updateMediaStream(micOn: boolean, cameraOn: boolean){
        if(this.micOn === micOn && this.cameraOn === cameraOn) return;
        if(this.userMediaStream == null){
            if(!micOn && !cameraOn) return;
            let ms = await navigator.mediaDevices.getUserMedia(
                {audio: true, video: true});
            if(!micOn) ms.getAudioTracks().forEach(t => t.enabled = false);
            if(cameraOn){
                ms = this.setupVbStream(ms)!;
                requestAnimationFrame(()=>this.drawVbImage());
            } else{
                const ctx = this.canvas.getContext("2d")!;
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                const cs = new MediaStream();
                ms.getAudioTracks().forEach(t=>cs.addTrack(t));
                this.canvasStream.getVideoTracks().forEach(t=>cs.addTrack(t));
                ms = cs;
            }
            this.userMediaStream = ms;
            this.micOn = micOn;
            this.cameraOn = cameraOn;
            this.fire("streamCreated", {stream: ms});
            return;
        }
        if(this.cameraOn !== cameraOn){
            if(cameraOn){
                this.userMediaStream.getVideoTracks().forEach(t=>t.enabled = true);
                requestAnimationFrame(()=>this.drawVbImage());
            } else{
                this.userMediaStream.getVideoTracks().forEach(t=>t.enabled = false);
                const ctx = this.canvas.getContext("2d")!;
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }
        if(this.micOn !== micOn){
            this.userMediaStream.getAudioTracks().forEach(track => track.enabled = micOn);
        }
        this.micOn = micOn;
        this.cameraOn = cameraOn;
        this.fire("streamUpdated", {stream: this.userMediaStream});
    }

    private setupVbStream(stream: MediaStream): MediaStream{
        const ret = new MediaStream();
        stream.getAudioTracks().forEach(t=>ret.addTrack(t));

        const {width: cw, height: ch} = stream.getVideoTracks()[0].getSettings();
        if(!cw || !ch){
            console.error("カメラサイズが取得できません。");
            return ret;
        }
        this.cameraWidth = cw;
        this.cameraHeight = ch;
        const v = this.video;
        v.width = cw / 2;
        v.height = ch / 2;
        v.srcObject = stream;
        // display: "none" の場合はautoplay=trueでもplay()が必要
        v.play();

        const c = this.canvas;
        c.width = cw / 2;
        c.height = ch / 2;

        this.canvasStream.getVideoTracks().forEach(t=>ret.addTrack(t));
        return ret;
    }

    private drawVbImage(){
        if (Date.now() - this.prevTime > 60 && this.video.currentTime !== 0) {
            this.prevTime = Date.now();
            this.vb.update(this.video, this.cameraWidth, this.cameraHeight, this.canvas);
        }
        if(this.cameraOn) requestAnimationFrame(()=>this.drawVbImage());
    }
}
