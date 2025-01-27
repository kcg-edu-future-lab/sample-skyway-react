import './App.css';
import { UserStreamManager } from '../lib/UserStreamManager';
import { skyWayId, skyWayRoomId, skyWaySecret } from '../keys';
import { SkyWay } from '../lib/SkyWay';
import SelfVideo from './SelfVideo';

const usm = new UserStreamManager();
const skyway = new SkyWay();

window.addEventListener("load", async ()=>{
    usm.on("streamCreated", ({stream})=>{
        skyway.start(skyWayId, skyWaySecret, skyWayRoomId, stream);
    });
    usm.on("streamDestroyed", ()=>{
//        skyway.stop();
    });
});

export default function App() {
    return <div className="App">
        あなた
        <label><input onChange={e=>usm.setCameraState(e.currentTarget.checked)} type="checkbox" />カメラ</label>
        <label><input onChange={e=>usm.setMicState(e.currentTarget.checked)} type="checkbox" />マイク</label>
        <div style={{verticalAlign: "top", backgroundColor: "black", width: "100%"}}>
            <SelfVideo myMedia={usm} />
        </div>
    </div>;
}
