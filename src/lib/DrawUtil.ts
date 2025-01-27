

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
