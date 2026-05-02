import type { GeminiImageSize, PreviewQuality } from "../../lib/types";

type Props = {
  previewQuality: PreviewQuality;
  imageSize: GeminiImageSize;
  onChange: (value: { previewQuality: PreviewQuality; imageSize: GeminiImageSize }) => void;
};

export function PreviewQualitySelector({ previewQuality, imageSize, onChange }: Props) {
  const allowedSizes = previewQuality === "premium" ? (["1K", "2K", "4K"] as const) : (["0.5K", "1K", "2K", "4K"] as const);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold">Preview Quality</h3>
      <p className="mt-1 text-sm text-slate-500">Standard is enough for most chairside previews.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" className={previewQuality === "standard" ? "rounded-xl border border-brand-600 bg-brand-50 p-3 text-left" : "rounded-xl border border-slate-200 p-3 text-left"} onClick={() => onChange({ previewQuality: "standard", imageSize })}><div className="font-medium">Standard</div><div className="text-sm text-slate-500">Fast, lower cost</div></button>
        <button type="button" className={previewQuality === "premium" ? "rounded-xl border border-brand-600 bg-brand-50 p-3 text-left" : "rounded-xl border border-slate-200 p-3 text-left"} onClick={() => onChange({ previewQuality: "premium", imageSize: imageSize === "0.5K" ? "1K" : imageSize })}><div className="font-medium">Premium</div><div className="text-sm text-slate-500">Better patient presentation</div></button>
      </div>
      <div className="mt-5">
        <label className="text-sm font-medium">Resolution</label>
        <div className="mt-2 flex gap-2">
          {allowedSizes.map((size) => (
            <button type="button" key={size} className={imageSize === size ? "rounded-full bg-brand-600 px-3 py-1 text-xs text-white" : "rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"} onClick={() => onChange({ previewQuality, imageSize: size })}>{size}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
