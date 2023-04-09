import { InputImage, InputMap, Results, SelfieSegmentation } from "@mediapipe/selfie_segmentation";
import bgImagePath from "./defaultBackground.png";
import { getTargetDrawingRect } from "./DrawUtil";

export class VirtualBackground{
    constructor(){
        this.ss = new SelfieSegmentation({
            locateFile: (file)=>`https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
        });
        this.ss.setOptions({ modelSelection: 1 });
        this.ss.onResults(results=>this.onSsResults(results));
        this.bgImage = new Image();
        this.bgImage.crossOrigin = "anonymous";
        this.bgImage.src = bgImagePath;
    }

    update(image: InputImage, sourceWidth: number, sourceHeight: number, targetCanvas: HTMLCanvasElement)
    : Promise<void>{
        return new Promise<void>((resolve, reject)=>{
            if(!this.enabled) return;
            if(this.currentResolve) return;
            this.sourceWidth = sourceWidth;
            this.sourceHeight = sourceHeight;
            this.targetCanvas = targetCanvas;
            this.working = true;
            this.currentResolve = resolve;
            this.ss.send({image: image})
                .catch(err=>{
                    console.error(err);
                    this.enabled = false;
                    this.currentResolve = null;
                });
            });
    }

    private onSsResults(results: Results){
        if(!this.sourceWidth || !this.sourceHeight || !this.targetCanvas || !this.currentResolve) return;
        const c = this.targetCanvas;
        const [x, y, w, h] = getTargetDrawingRect(
            c,
            {width: this.sourceWidth, height: this.sourceHeight});
        const ctx = c.getContext("2d")!;
        ctx.save();
        ctx.clearRect(0, 0, w + x, h + y);
        ctx.drawImage(results.segmentationMask, x, y, w, h);
        ctx.globalCompositeOperation = "source-in";
        ctx.drawImage(results.image, x, y, w, h);
        ctx.globalCompositeOperation = "destination-atop";
        ctx.drawImage(this.bgImage, x, y, w, h);
        ctx.restore();
        this.currentResolve();
        this.currentResolve = null;
    }

    private enabled = true;
    private working = false;
    private currentResolve: ((value:void)=>void) | null = null;
    private ss: SelfieSegmentation;
    private bgImage: HTMLImageElement;
    private sourceWidth?: number;
    private sourceHeight?: number;
    private targetCanvas?: HTMLCanvasElement;
}