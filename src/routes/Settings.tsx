export default function Settings() {
  return (
    <div className="max-w-2xl space-y-3">
      <h2 className="text-2xl font-bold">Settings</h2>
      <p className="text-sm text-slate-600">Default preview mode is Standard (0.5K). Premium mode is available for higher-quality patient presentation.</p>
      <p className="text-sm text-slate-600">Internal estimated output cost is calculated during preview generation.</p>
    </div>
  );
}
