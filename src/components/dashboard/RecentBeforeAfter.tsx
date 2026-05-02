import type { DentalCase } from "../../lib/types";

export function RecentBeforeAfter({ cases }: { cases: DentalCase[] }) {
  const ready = cases.filter((c) => c.previewImageUrl && c.originalImageUrl).slice(0, 3);
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {ready.map((c) => (
        <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
          <div className="mb-2 font-semibold">{c.patientName}</div>
          <div className="grid grid-cols-2 gap-2">
            <img src={c.originalImageUrl} className="h-24 w-full rounded object-cover" />
            <img src={c.previewImageUrl} className="h-24 w-full rounded object-cover" />
          </div>
        </div>
      ))}
    </div>
  );
}
