import './App.css';
import { useContext, useState } from 'react';
import { useEffectOnce } from '../lib/ReactUtil';
import { SkyWayContext, UserMediaStreamManagerContext, VirtualBackgroundStreamManagerContext } from '..';
import { Peer } from './Peer';
import { HorizontalVideoPanel } from './HorizontalVideoPanel';
import { skyWayId, skyWayRoomId, skyWaySecret } from '../keys';
import { Stream } from 'stream';

export default function App() {
    const umsm = useContext(UserMediaStreamManagerContext);
    const vbsm = useContext(VirtualBackgroundStreamManagerContext);
    const skyway = useContext(SkyWayContext);
    const [peers, setPeers] = useState<Peer[]>([]);

    useEffectOnce(()=>{
        vbsm.attach(umsm);
        vbsm.on("streamCreated", ({stream})=>{
            skyway.start(skyWayId, skyWaySecret, skyWayRoomId, stream);
        });
        umsm.acquire();
        skyway.on("connected", ({selfPeerId})=>{
            console.log(`SkyWayに接続しました。IDは${selfPeerId}です。`);
        });
        skyway.on("peerStreamArrived", ({peerId, track, type})=>{
            const remoteMediaArea = document.getElementById("remote-media-area") as HTMLDivElement;
            console.log(`stream of ${peerId} arrived.`, track);
            let found = false;
            const ret = peers.map(p=>{
                if(p.peerId === peerId){
                    found = true;
                    const stream = new MediaStream();
                    p.stream.getTracks().forEach(t=>stream.addTrack(t));
                    stream.addTrack(track);
                    return {peerId, stream};
                }
                return p;
            });
            if(found){
                setPeers([...ret]);
            } else{
                const ms = new MediaStream();
                ms.addTrack(track);
                setPeers([...peers, {peerId, stream: ms}]);
            }
        });
        skyway.on("peerLeaved", ({peerId})=>{
            console.log(`${peerId}が退室しました。`);
        });
    });

    return <div className="App">
        <HorizontalVideoPanel sm={vbsm} peers={peers}/>
        <div>あなた
        <label><input onChange={e=>umsm.setCameraState(e.currentTarget.checked)} type="checkbox" />カメラ</label>
        <label><input onChange={e=>umsm.setMicState(e.currentTarget.checked)} type="checkbox" />マイク</label>
        </div>
    </div>;
}
