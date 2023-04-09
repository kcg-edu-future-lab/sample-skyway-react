import { useEffect, useRef } from "react";

interface Props{
    stream: MediaStream | null;
}
const SelfVideo = ({stream}: Props)=>{
    const myVideo = useRef<HTMLVideoElement>(null);

    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(!myVideo.current) return;
        if(!stream) return;

        // 自分の映像と音声を再生するvideoタグに関連づける
        const s = new MediaStream();
        stream.getVideoTracks().forEach(t=>s.addTrack(t));
        myVideo.current.srcObject = s;
    });

    return <div style={{
        display: "inline-block", verticalAlign: "top", border: "1px solid darkgray",
        resize: "both", overflow: "hidden", width: "200px", height: "200px"}}>
        <video ref={myVideo} width="100%" height="100%"
            style={{ display: "inline-block" }} autoPlay playsInline muted />
    </div>;
};

export default SelfVideo;
