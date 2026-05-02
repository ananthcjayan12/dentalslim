import type { DentalCase } from "../../lib/types";
import { CASE_STATUS_LABELS } from "../../lib/constants";

export function TodayCasesTable({ cases }: { cases: DentalCase[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50">
          <tr><th className="p-3">Patient</th><th>Tooth</th><th>Concern</th><th>Status</th></tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c.id} className="border-t border-slate-100">
              <td className="p-3">{c.patientName}</td><td>{c.toothNumber || "-"}</td><td>{c.concern || "-"}</td><td>{CASE_STATUS_LABELS[c.status]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
