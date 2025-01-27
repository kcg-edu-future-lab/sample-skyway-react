import { InputImage, Results, SelfieSegmentation } from "@mediapipe/selfie_segmentation";

export class VirtualBackground{
    constructor(bgImagePath: string){
        this.ss = new SelfieSegmentation({
            locateFile: (file)=>`https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
        });
        this.ss.setOptions({ modelSelection: 1 });
        this.ss.onResults(results=>this.onSsResults(results));
        this.bgImage = new Image();
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
        const [x, y, w, h] = getTargetDrawingRect(
            this.targetCanvas,
            {width: this.sourceWidth, height: this.sourceHeight});
        const ctx = this.targetCanvas.getContext("2d")!;
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
    private currentResolve: ((value:void)=>void) | null = null;
    private ss: SelfieSegmentation;
    private bgImage: HTMLImageElement;
    private sourceWidth?: number;
    private sourceHeight?: number;
    private targetCanvas?: HTMLCanvasElement;
}

interface wh{
    width: number;
    height: number;
}

export function getTargetDrawingRect(target: wh, src: wh): [number, number, number, number]{
    const sw = src.width;
    const sh = src.height;
    const tw = target.width;
    const th = target.height;
    const s = Math.min(tw / sw, th / sh);
    const w = sw * s;
    const h = sh * s;
    const x = (tw - w) / 2;
    const y = (th - h) / 2;
    return [x, y, w, h];
}
