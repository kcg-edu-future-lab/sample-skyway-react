import Peer, { SfuRoom } from "skyway-js";

interface PeerStreamArrivedEventDetail{
    peerId: string;
    stream: MediaStream;
}
interface PeerStreamLeavedEventDetail{
    peerId: string;
}
class WebRtcEvents extends EventTarget{
    on(type: "peerStreamArrived", callback: (detail: PeerStreamArrivedEventDetail)=>void): void;
    on(type: "peerStreamLeaved", callback: (detail: PeerStreamLeavedEventDetail)=>void): void;
    on(type: string, callback: Function): void {
        super.addEventListener(type, e=>callback((e as any).detail));
    }
    protected fire(type: "peerStreamArrived", detail: PeerStreamArrivedEventDetail): void;
    protected fire(type: "peerStreamLeaved", detail: PeerStreamLeavedEventDetail): void;
    protected fire(type: string, detail: object){
        this.dispatchEvent(new CustomEvent(type, {detail}));
    }
}

export class SkyWay extends WebRtcEvents{
    start(key: string, roomId: string, selfStream: MediaStream){
        this.peer = new Peer({key: key}); //, debug: 3 });
        this.peer.on("open", async () => {
            console.log(`skyway roomに接続しました. あなたのpeerIdは${this.peer!.id}です.`);
            this.room = this.peer!.joinRoom(
                roomId, {mode: "sfu", stream: selfStream}
            ).on('peerJoin', peerId=>{
                console.log(`skyway roomに${peerId}が参加しました.`);
            }).on("stream", stream=>{
                console.log(`peer streamを受け取りました. ${stream.peerId}`);
                if(typeof(stream) === 'object'){
                    console.log(`OtherVideoを追加.`);
                    this.fire("peerStreamArrived", {peerId: stream.peerId, stream});
                }
            }).on("peerLeave", peerId=>{
                this.fire("peerStreamLeaved", {peerId});
            }).on("error", err=>{
                console.log(err);
            });
        }).on("error", err=>{
          console.log(err);
        });
    }

    replaceStream(stream: MediaStream){
        if(!this.room) return;
        this.room.replaceStream(stream);
    }

    private peer: Peer | null = null;
    private room: SfuRoom | null = null;
}
