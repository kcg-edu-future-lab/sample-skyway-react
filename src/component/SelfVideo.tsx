import { useRef } from "react";
import { StreamManager } from "../lib/StreamManagers";
import { useEffectOnce } from "../lib/ReactUtil";

interface Props{
    sm: StreamManager;
}
export default function SelfVideo({sm}: Props){
    const myVideo = useRef<HTMLVideoElement>(null!);

    useEffectOnce(()=>{
        sm.on("streamCreated", ({stream})=>{
            console.log("myVideo.current", myVideo.current);
            if(myVideo.current == null){
                console.error("myVideo.current is null.");
                return;
            }
            const s = new MediaStream();
            stream.getVideoTracks().forEach(t=>s.addTrack(t));
            myVideo.current.srcObject = s;
        });
    });

    return <div style={{
        display: "inline-block", verticalAlign: "top", border: "1px solid darkgray",
        resize: "both", overflow: "hidden", width: "200px", height: "200px"}}>
        <video ref={myVideo} width="100%" height="100%"
            style={{ display: "inline-block" }} autoPlay playsInline muted />
    </div>;
}
