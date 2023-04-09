import Peer, { SfuRoom } from "skyway-js";

class PeerStreamArrivedEvent extends CustomEvent<{peerId: string; stream: MediaStream}>{
    constructor(peerId: string, stream: MediaStream){
        super("peerStreamArrived", {detail: {peerId, stream}});
    }
}
interface PeerStreamArrivedEventListener{
    (detail: { peerId: string; stream: MediaStream; }): void;
}
class PeerStreamLeavedEvent extends CustomEvent<{peerId: string}>{
    constructor(peerId: string){
        super("peerStreamLeaved", {detail: {peerId}});
    }
}
interface PeerStreamLeavedEventListener{
    (detail: {peerId: string}): void;
}
class WebRtcEvents extends EventTarget{
    on(type: "peerStreamArrived", callback: PeerStreamArrivedEventListener): void;
    on(type: "peerStreamLeaved", callback: PeerStreamLeavedEventListener): void;
    on(type: "peerStreamArrived" | "peerStreamLeaved",
        callback: PeerStreamArrivedEventListener | PeerStreamLeavedEventListener): void {
        super.addEventListener(type, e=>callback((e as any).detail));
    }
}

export class SkyWay extends WebRtcEvents{
    getSelfStream(){
        return this.selfStream;
    }

    start(key: string, selfStream: MediaStream){
        this.selfStream = selfStream;
        this.peer = new Peer({key: key}); //, debug: 3 });
        this.peer.on("open", async () => {
            console.log(`skyway roomに接続しました. あなたのpeerIdは${this.peer!.id}です.`);
            this.room = this.peer!.joinRoom(
                "room1", {mode: "sfu", stream: selfStream}
            ).on('peerJoin', peerId=>{
                console.log(`skyway roomに${peerId}が参加しました.`);
            }).on("stream", stream=>{
                console.log(`peer streamを受け取りました. ${stream.peerId}`);
                if(typeof(stream) === 'object'){
                    console.log(`OtherVideoを追加.`);
                    this.dispatchEvent(new PeerStreamArrivedEvent(stream.peerId, stream));
                } else {
                    console.log("peer streamなし");
                }
            }).on("peerLeave", peerId=>{
                this.dispatchEvent(new PeerStreamLeavedEvent(peerId));
            }).on("error", err=>{
                console.log(err);
            });
        }).on("error", err=>{
          console.log(err);
        });
    }

    replaceStream(stream: MediaStream){
        if(!this.room) return;
        this.selfStream = stream;
        this.room.replaceStream(stream);
    }

    private selfStream: MediaStream | null = null;
    private peer: Peer | null = null;
    private room: SfuRoom | null = null;
}
