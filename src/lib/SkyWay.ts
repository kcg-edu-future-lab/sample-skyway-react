import { LocalAudioStream, LocalStream, LocalVideoStream, RemoteAudioStream, RemoteVideoStream, RoomPublication, SkyWayAuthToken, SkyWayContext, SkyWayRoom, SkyWayStreamFactory, nowInSec, uuidV4 } from "@skyway-sdk/room";

interface ConnectedDetail{
    selfPeerId: string;
}
interface PeerStreamArrivedEventDetail{
    peerId: string;
    track: MediaStreamTrack;
    type: "audio" | "video";
}
interface PeerStreamLeavedEventDetail{
    peerId: string;
}
interface PeerLeavedDetail{
    peerId: string;
}
class WebRtcEvents extends EventTarget{
    on(type: "connected", callbask: (detail: ConnectedDetail)=>void): void;
    on(type: "peerStreamArrived", callback: (detail: PeerStreamArrivedEventDetail)=>void): void;
    on(type: "peerStreamLeaved", callback: (detail: PeerStreamLeavedEventDetail)=>void): void;
    on(type: "peerLeaved", callback: (detail: PeerLeavedDetail)=>void): void;
    on(type: string, callback: Function): void {
        super.addEventListener(type, e=>callback((e as CustomEvent).detail));
    }
    protected fire(type: "connected", detail: ConnectedDetail): void;
    protected fire(type: "peerStreamArrived", detail: PeerStreamArrivedEventDetail): void;
    protected fire(type: "peerStreamLeaved", detail: PeerStreamLeavedEventDetail): void;
    protected fire(type: "peerLeaved", detail: PeerLeavedDetail): void;
    protected fire(type: string, detail: object){
        this.dispatchEvent(new CustomEvent(type, {detail}));
    }
}

export class SkyWay extends WebRtcEvents{
    async start(appId: string, secret: string, roomId: string, selfStream: MediaStream){
        const context = await SkyWayContext.Create(createSkywayAuthToken(appId, secret));
        const room = await SkyWayRoom.FindOrCreate(
            context, {type: 'p2p', name: roomId});
        const me = await room.join();
        window.addEventListener("beforeunload", ()=>{
            me.leave();
        });
        this.fire("connected", {selfPeerId: me.id});

        const audio = new LocalAudioStream(selfStream.getAudioTracks()[0], {stopTrackWhenDisabled: true});
        const video = new LocalVideoStream(selfStream.getVideoTracks()[0], {stopTrackWhenDisabled: true});
        await me.publish(audio);
        await me.publish(video);
      
        // 他のユーザのpublicationをsubscribeする
        const subscribeAndAttach = async (publication: RoomPublication<LocalStream>) => {
            const publisherId = publication.publisher.id;
            if (publisherId === me.id) return;
            const { stream } = await me.subscribe(publication.id);
            if(stream instanceof RemoteVideoStream || stream instanceof RemoteAudioStream){
                this.fire("peerStreamArrived", {
                    peerId: publisherId, track: stream.track, type: stream.contentType});
            }
        };
        room.publications.forEach(subscribeAndAttach);
        room.onStreamPublished.add((e) => subscribeAndAttach(e.publication));
        room.onMemberLeft.add((e) => {
            if (e.member.id === me.id) return;
            this.fire("peerLeaved", {peerId: e.member.id});
        });
    }

    stop(){
        
    }
}

function createSkywayAuthToken(applicationId: string, secretKey: string){
    return new SkyWayAuthToken({
        jti: uuidV4(), iat: nowInSec(), exp: nowInSec() + 60 * 60 * 24,
        scope: {
            app: {
                id: applicationId, turn: true, actions: ['read'],
                channels: [{
                    id: '*', name: '*', actions: ['write'],
                    members: [{
                        id: '*', name: '*', actions: ['write'],
                        publication: { actions: ['write']},
                        subscription: { actions: ['write']},
                    }],
                    sfuBots: [{
                        actions: ['write'],
                        forwardings: [{
                            actions: ['write']
                        }]
                    }]
                }]
            }
        }
    }).encode(secretKey);
}