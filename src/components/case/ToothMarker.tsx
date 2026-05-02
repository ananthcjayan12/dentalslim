import { useEffect, useRef, useState } from "react";
import { canvasToPngFile } from "../../lib/image";
import { Button } from "../ui/Button";

export function ToothMarker({ imageUrl, onSave }: { imageUrl: string; onSave: (file: File) => Promise<void> }) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const drawRef = useRef<HTMLCanvasElement | null>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<"brush" | "erase">("brush");
  const [size, setSize] = useState(22);
  const [drawing, setDrawing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const img = imageRef.current;
    const draw = drawRef.current;
    const mask = maskRef.current;
    if (!img || !draw || !mask) return;
    const fit = () => {
      draw.width = img.clientWidth;
      draw.height = img.clientHeight;
      mask.width = img.clientWidth;
      mask.height = img.clientHeight;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const stroke = (x: number, y: number) => {
    const draw = drawRef.current!;
    const mask = maskRef.current!;
    const dctx = draw.getContext("2d")!;
    const mctx = mask.getContext("2d")!;
    dctx.globalCompositeOperation = tool === "erase" ? "destination-out" : "source-over";
    dctx.fillStyle = "rgba(168,85,247,0.55)";
    dctx.beginPath(); dctx.arc(x, y, size, 0, Math.PI * 2); dctx.fill();
    mctx.globalCompositeOperation = tool === "erase" ? "destination-out" : "source-over";
    mctx.fillStyle = "white";
    mctx.beginPath(); mctx.arc(x, y, size, 0, Math.PI * 2); mctx.fill();
  };

  const point = (e: import("react").MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button className={tool === "brush" ? "" : "bg-slate-600"} onClick={() => setTool("brush")}>Brush</Button>
        <Button className={tool === "erase" ? "" : "bg-slate-600"} onClick={() => setTool("erase")}>Erase</Button>
        <Button className="bg-slate-500" onClick={() => { drawRef.current?.getContext("2d")?.clearRect(0, 0, drawRef.current.width, drawRef.current.height); maskRef.current?.getContext("2d")?.clearRect(0, 0, maskRef.current.width, maskRef.current.height); }}>Reset</Button>
        <input type="range" min={8} max={48} value={size} onChange={(e) => setSize(Number(e.target.value))} />
      </div>
      <div className="relative inline-block">
        <img ref={imageRef} src={imageUrl} className="max-h-[70vh] rounded-xl border border-slate-200" />
        <canvas
          ref={drawRef}
          className="absolute inset-0 cursor-crosshair"
          onMouseDown={(e) => { setDrawing(true); const p = point(e); stroke(p.x, p.y); }}
          onMouseMove={(e) => { if (!drawing) return; const p = point(e); stroke(p.x, p.y); }}
          onMouseUp={() => setDrawing(false)}
          onMouseLeave={() => setDrawing(false)}
        />
        <canvas ref={maskRef} className="hidden" />
      </div>
      <Button disabled={saving} onClick={async () => { setSaving(true); try { const file = await canvasToPngFile(maskRef.current!, "mask.png"); await onSave(file); } finally { setSaving(false); } }}>{saving ? "Saving..." : "Save Marking"}</Button>
    </div>
  );
}
