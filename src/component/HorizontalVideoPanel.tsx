import { StreamManager } from "../lib/StreamManagers";
import { Peer } from "./Peer";
import OtherVideo from "./OtherVideo";
import SelfVideo from "./SelfVideo";

interface Props{
    sm: StreamManager;
    peers: Peer[];
}
export function HorizontalVideoPanel({sm, peers}: Props){
    return <div>
        <div style={{verticalAlign: "top", backgroundColor: "black", width: "100%"}}>
            <SelfVideo sm={sm} />
            {peers.map(p=><OtherVideo key={p.peerId} peer={p} />)}
        </div>
    </div>;
}
