import { getTargetDrawingRect } from "./DrawUtil";
import { VirtualBackground } from "./VirtualBackground";

class StreamAvailableEvent extends CustomEvent<{stream: MediaStream}>{
    constructor(stream: MediaStream){
        super("streamAvailable", {detail: {stream}});
    }
}
interface StreamAvailableEventListener{
    (detail: {stream: MediaStream}): void;
}
class StreamEvents extends EventTarget{
    on(type: "streamAvailable", callback: StreamAvailableEventListener): void {
        super.addEventListener(type, e=>callback((e as any).detail));
    }
}

export class MyMedia extends StreamEvents{
    constructor(){
        super();
        this.vb = new VirtualBackground();

        const v = document.createElement("video");
        v.muted = true;
        v.width = 100;
        v.height = 100;
        this.video = v;

        const c = document.createElement("canvas");
        c.width = 100;
        c.height = 100;
        this.canvas = c;
        this.canvasStream = this.canvas.captureStream();
    }

    setStates(micOn: boolean, cameraOn: boolean, ){
        this.resetMediaStream(micOn, cameraOn);
    }
    setMicState(on: boolean){
        this.resetMediaStream(on, this.cameraOn);
    }
    setCameraState(on: boolean){
        this.resetMediaStream(this.micOn, on);
    }
    private resetMediaStream(micOn: boolean, cameraOn: boolean){
        if(this.userMediaStream != null && this.micOn == micOn && this.cameraOn == cameraOn) return;
        if(this.cameraOn && !cameraOn){
            this.userMediaStream?.getVideoTracks().forEach(t=>t.stop())
        }

        this.micOn = micOn;
        this.cameraOn = cameraOn;
        if(micOn || cameraOn || true){
            navigator.mediaDevices
                .getUserMedia({audio: true, video: cameraOn})
                .then(stream=>{
                    this.userMediaStream = stream;
                    let s = new MediaStream();
                    stream.getTracks().forEach(t=>s.addTrack(t));
                    // ミュート状態に応じて有効/無効を切り替え
                    s.getAudioTracks().forEach(track => track.enabled = micOn);
                    if(!micOn){
                        s.getAudioTracks().forEach(t=>t.stop());
                    }
                    if(cameraOn){
                        s = this.setupVbStream(s)!;
                    } else{
                        const ctx = this.canvas.getContext("2d")!;
                        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                        s.addTrack(this.canvasStream.getVideoTracks()[0]);
                    }
                    this.dispatchEvent(new StreamAvailableEvent(s))
                })
                .catch(console.error);
        } else{
            // camera/mic offの場合両方ダミーのストリームを使う実験。うまくいかないため現在は無効。
            console.log("both off");
            const s = new MediaStream();
            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const dst = oscillator.connect(ctx.createMediaStreamDestination());
            oscillator.start();
            const t = (dst as any).stream.getAudioTracks()[0];
            s.addTrack(t);
            s.addTrack(this.canvasStream.getVideoTracks()[0]);
            this.dispatchEvent(new StreamAvailableEvent(s))
        }
    }

    private setupVbStream(stream: MediaStream): MediaStream | null{
        let {width: cw, height: ch} = stream.getVideoTracks()[0].getSettings();
        if(!cw || !ch){
            console.log("カメラサイズが取得できません。");
            return null;
        }
        const v = this.video;
        v.width = cw / 2;
        v.height = ch / 2;
        v.srcObject = stream;
        // display: "none" の場合はautoplay=trueでもplay()が必要
        v.play();

        const c = this.canvas;
        c.width = cw / 2;
        c.height = ch / 2;

        const drawImage = ()=>{
            if (Date.now() - this.prevTime > 60 && v.currentTime !== 0) {
                this.prevTime = Date.now();
//*
                this.vb.update(this.video, cw!, ch!, this.canvas);
/*/
                // 仮想背景を使わない場合
                const [x, y, w, h] = getTargetDrawingRect(
                    c, {width: cw! / 2, height: ch! / 2});
                const ctx = c.getContext("2d")!;
                ctx.drawImage(v, x, y, w, h);
//*/
            }
            if(this.cameraOn) requestAnimationFrame(drawImage);
        }
        if(this.cameraOn) requestAnimationFrame(drawImage);

        const ret = new MediaStream();
        stream.getAudioTracks().forEach(t=>ret.addTrack(t));
        this.canvasStream.getVideoTracks().forEach(t=>ret.addTrack(t));
        return ret;
    }

    private micOn = false;
    private cameraOn = false;
    private userMediaStream: MediaStream | null = null;
    private vb: VirtualBackground;
    private video: HTMLVideoElement;
    private canvas: HTMLCanvasElement;
    private canvasStream: MediaStream;
    private prevTime = 0;
}
