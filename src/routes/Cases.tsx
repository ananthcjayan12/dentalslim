import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { CASE_STATUS_LABELS } from "../lib/constants";
import type { DentalCase } from "../lib/types";

export default function Cases() {
  const [cases, setCases] = useState<DentalCase[]>([]);
  useEffect(() => { api.listCases().then((d) => setCases(d.cases)).catch(() => setCases([])); }, []);
  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Cases</h2>
      <div className="space-y-2">
        {cases.map((c) => (
          <Link key={c.id} to={`/cases/${c.id}/preview`} className="block rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50">
            <div className="font-semibold">{c.patientName}</div>
            <div className="text-sm text-slate-500">{c.toothNumber || "-"} • {CASE_STATUS_LABELS[c.status]}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
