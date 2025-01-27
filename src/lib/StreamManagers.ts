import { VirtualBackground } from "./VirtualBackground";

interface CreatedEventDetail{
    stream: MediaStream;
    cameraOn: boolean;
    micOn: boolean;
}

interface UpdatedEventDetail{
    stream: MediaStream;
    cameraOn: boolean;
    micOn: boolean;
}

class StreamManagerEvents extends EventTarget{
    on(type: "streamCreated", callback: (detail: CreatedEventDetail)=>void): void;
    on(type: "streamUpdated", callback: (detail: UpdatedEventDetail)=>void): void;
    on(type: "streamDestroyed", callback: ()=>void): void;
    on(type: string, callback: Function): void {
        super.addEventListener(type, e=>callback((e as any).detail));
    }
    protected fire(type: "streamCreated", detail: CreatedEventDetail): void;
    protected fire(type: "streamUpdated", detail: UpdatedEventDetail): void;
    protected fire(type: "streamDestroyed"): void;
    protected fire(type: string, detail?: object){
        this.dispatchEvent(new CustomEvent(type, {detail}));
    }
}

export class StreamManager extends StreamManagerEvents{
}

/**
 * 利用者のメディアストリームを管理するクラス。
 * 自撮り画像のストリームと送信用ストリームの作成・更新・廃棄を通知する。
 */
export class UserMediaStreamManager extends StreamManager{
    private micOn = false;
    private cameraOn = false;
    private userMediaStream: MediaStream | null = null;

    setStates(micOn: boolean, cameraOn: boolean, ){
        this.updateMediaStream(micOn, cameraOn);
    }

    setMicState(on: boolean){
        this.updateMediaStream(on, this.cameraOn);
    }

    setCameraState(on: boolean){
        this.updateMediaStream(this.micOn, on);
    }

    acquire(){
        navigator.mediaDevices
            .getUserMedia({audio: true, video: true})
            .then(stream=>{
                stream.getAudioTracks().forEach(t => t.enabled = false);
                stream.getVideoTracks().forEach(t => t.enabled = false);
                this.userMediaStream = stream;
                this.micOn = false;
                this.cameraOn = false;
                this.fire("streamCreated", {stream, micOn: false, cameraOn: false});
            });
    }

    private async updateMediaStream(micOn: boolean, cameraOn: boolean){
        if(this.micOn === micOn && this.cameraOn === cameraOn) return;
        if(this.userMediaStream === null){
            if(!micOn && !cameraOn) return;
            return;
        }
        if(this.cameraOn !== cameraOn){
            this.userMediaStream.getVideoTracks().forEach(t=>t.enabled = cameraOn);
        }
        if(this.micOn !== micOn){
            this.userMediaStream.getAudioTracks().forEach(track => track.enabled = micOn);
        }
        this.micOn = micOn;
        this.cameraOn = cameraOn;
        this.fire("streamUpdated", {stream: this.userMediaStream, cameraOn, micOn});
    }
}

export class VirtualBackgroundStreamManager extends StreamManager{
    private cameraOn = false;
    private micOn = false;
    private cameraWidth = 0;
    private cameraHeight = 0;
    private sourceVideo: HTMLVideoElement;
    private vb: VirtualBackground;
    private canvas: HTMLCanvasElement;
    private canvasStream: MediaStream;
    private outputStream: MediaStream;
    private prevTime = 0;

    constructor(vbImage: string = "./defaultBackground.png"){
        super();
        this.outputStream = new MediaStream();
        this.vb = new VirtualBackground(vbImage);

        const v = document.createElement("video");
        v.muted = true;
        v.width = 100;
        v.height = 100;
//        v.style.display = "none";
//        document.documentElement.appendChild(v);
        this.sourceVideo = v;

        const c = document.createElement("canvas");
        c.width = 100;
        c.height = 100;
        this.canvas = c;
        this.canvasStream = this.canvas.captureStream();
//        document.documentElement.appendChild(c);

    }

    attach(sm: StreamManager){
        sm.on("streamCreated", ({stream, cameraOn, micOn})=>{
            console.log(`VirtualBackgroundStreamManager.streamCreated(cameraOn: ${cameraOn}, micOn: ${micOn})`);
            this.cameraOn = cameraOn;
            this.micOn = micOn;
//            if(cameraOn){
                this.setupVbStream(stream)!;
                if(cameraOn) requestAnimationFrame(()=>this.drawVbImage());
/*            } else{
                const ctx = this.canvas.getContext("2d")!;
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                stream.getAudioTracks().forEach(t=>this.stream.addTrack(t));
                this.canvasStream.getVideoTracks().forEach(t=>this.stream.addTrack(t));
            }
*/            this.fire("streamCreated", {stream: this.outputStream, cameraOn, micOn});
        });

        sm.on("streamUpdated", ({stream, cameraOn, micOn})=>{
            console.log(`VirtualBackgroundStreamManager.streamUpdate(cameraOn: ${cameraOn}, micOn: ${micOn})`);
            this.cameraOn = cameraOn;
            this.micOn = micOn;
            if(cameraOn){
                requestAnimationFrame(()=>this.drawVbImage());
            } else{
                const ctx = this.canvas.getContext("2d")!;
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
            this.fire("streamUpdated", {stream: this.outputStream, cameraOn, micOn});
        });

        sm.on("streamDestroyed", ()=>{
            console.log("VirtualBackgroundStreamManager.streamDestroyed");
            this.fire("streamDestroyed");
        });
    }

    private setupVbStream(stream: MediaStream){
        stream.getAudioTracks().forEach(t=>this.outputStream.addTrack(t));

        const {width: cw, height: ch} = stream.getVideoTracks()[0].getSettings();
        if(!cw || !ch){
            console.error("カメラサイズが取得できません。");
            return;
        }
        this.cameraWidth = cw;
        this.cameraHeight = ch;
        const v = this.sourceVideo;
        v.width = cw / 2;
        v.height = ch / 2;
        v.srcObject = stream;
        // display: "none" の場合はautoplay=trueでもplay()が必要
        v.play();

        const c = this.canvas;
        c.width = cw / 2;
        c.height = ch / 2;

        this.canvasStream.getVideoTracks().forEach(t=>this.outputStream.addTrack(t));
    }

    private drawVbImage(){
        if (Date.now() - this.prevTime > 60 && this.sourceVideo.currentTime !== 0) {
            this.prevTime = Date.now();
            this.vb.update(this.sourceVideo, this.cameraWidth, this.cameraHeight, this.canvas);
        }
        if(this.cameraOn) requestAnimationFrame(()=>this.drawVbImage());
    }
}
