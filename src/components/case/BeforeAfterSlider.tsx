import { useState } from "react";

export function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const [v, setV] = useState(50);
  return (
    <div className="space-y-3">
      <div className="relative h-72 overflow-hidden rounded-xl border border-slate-200 bg-black">
        <img src={before} className="absolute inset-0 h-full w-full object-contain" />
        <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${v}%` }}><img src={after} className="h-full w-full object-contain" /></div>
      </div>
      <input type="range" min={0} max={100} value={v} onChange={(e) => setV(Number(e.target.value))} className="w-full" />
    </div>
  );
}
