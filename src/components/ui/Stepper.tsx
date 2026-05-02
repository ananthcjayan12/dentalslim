export function Stepper({ step }: { step: 1 | 2 | 3 | 4 }) {
  const labels = ["New Case", "Mark Tooth", "Create Preview", "Preview Ready"];
  return (
    <div className="mb-6 flex gap-2">
      {labels.map((label, i) => (
        <div key={label} className={`rounded-full px-3 py-1 text-xs ${i + 1 <= step ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"}`}>
          {i + 1}. {label}
        </div>
      ))}
    </div>
  );
}
