import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { skyway as skywayKey } from '../keys';
import { SkyWay } from '../lib/SkyWay';
import { MyMedia } from '../lib/MyMedia';
import SelfVideo from './SelfVideo';
import OtherVideo from './OtherVideo';

function App() {
    const [myStream, setMyStream] = useState<MediaStream | null>(null);
    const [peers, setPeers] = useState<{peerId: string, stream: MediaStream}[]>([]);
    const skyWay = useRef<SkyWay>();
    const myMedia = useRef<MyMedia>();

    const refFirst = useRef(true);
    useEffect(()=>{
        if(process.env.NODE_ENV === "development" && refFirst.current){
            refFirst.current = false;
            return;
        }

        if(myMedia.current) return;
        const mm = new MyMedia();
        mm.on("streamAvailable", ({stream})=>{
            setMyStream(stream);
            if(!skyWay.current){
                const sw = new SkyWay();
                sw.on("peerStreamArrived", ({peerId, stream})=>{
                    setPeers([...peers, {peerId: peerId, stream: stream}]);
                });
                sw.on("peerStreamLeaved", ({peerId})=>{
                    setPeers(peers.filter(s=>s.peerId!==peerId));
                });
                sw.start(skywayKey, stream);
                skyWay.current = sw;
            } else{
                skyWay.current.replaceStream(stream);
            }
        });
        mm.setStates(false, false);
        myMedia.current = mm;
    });

    return <div className="App">
        あなた
        <label><input onChange={e=>myMedia.current!.setCameraState(e.target.checked)} type="checkbox" />カメラ</label>
        <label><input onChange={e=>myMedia.current!.setMicState(e.target.checked)} type="checkbox" />マイク</label>
        <div style={{verticalAlign: "top", backgroundColor: "black", width: "100%"}}>
            <SelfVideo stream={myStream} />
            { peers.map(p=><OtherVideo key={p.peerId} stream={p.stream} />) }
        </div>
    </div>;
}

export default App;
