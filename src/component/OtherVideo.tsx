import { useEffect, useRef } from "react";

interface Props{
    stream: MediaStream;
}
const OtherVideo = ({stream}: Props)=>{
    const video = useRef<HTMLVideoElement>(null);

    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(!video.current) return;
        video.current.srcObject = stream;
    });

    return <div style={{
          display: "inline-block", verticalAlign: "top", border: "1px solid darkgray",
          resize: "both", overflow: "hidden", width: "200px", height: "200px"}}>
          <video ref={video} width="100%" height="100%"
              style={{ display: "inline-block" }} autoPlay playsInline />
    </div>;
};

export default OtherVideo;
