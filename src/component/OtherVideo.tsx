import { useEffect, useRef } from "react";
import { Peer } from "./Peer";
import { useEffectOnce } from "../lib/ReactUtil";
interface Props{
    peer: Peer;
}
export default function OtherVideo({peer}: Props){
    const video = useRef<HTMLVideoElement>(null!);

    useEffect(()=>{
        console.log("OtherVideo.useEffect", peer.stream.getTracks());
        video.current.srcObject = peer.stream;
        video.current.muted = false;
        video.current.play();
    });

    return <div style={{
          display: "inline-block", verticalAlign: "top", border: "1px solid darkgray",
          resize: "both", overflow: "hidden", width: "200px", height: "200px"}}>
          <video id={peer.peerId} ref={video} width="100%" height="100%"
              style={{ display: "inline-block" }} autoPlay playsInline />
    </div>;
}
