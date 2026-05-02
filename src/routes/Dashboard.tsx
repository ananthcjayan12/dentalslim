import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SummaryCard } from "../components/dashboard/SummaryCard";
import { TodayCasesTable } from "../components/dashboard/TodayCasesTable";
import { HowItWorksCard } from "../components/dashboard/HowItWorksCard";
import { RecentBeforeAfter } from "../components/dashboard/RecentBeforeAfter";
import { api } from "../lib/api";
import type { DentalCase } from "../lib/types";
import { Button } from "../components/ui/Button";

export default function Dashboard() {
  const [cases, setCases] = useState<DentalCase[]>([]);
  useEffect(() => { api.listCases().then((d) => setCases(d.cases)).catch(() => setCases([])); }, []);
  const stats = useMemo(() => ({ total: cases.length, ready: cases.filter((c) => c.status === "preview_ready").length, inProgress: cases.filter((c) => c.status === "draft" || c.status === "photo_uploaded" || c.status === "marked" || c.status === "generating").length }), [cases]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">Dashboard</h2><Link to="/new"><Button>Create New Preview</Button></Link></div>
      <div className="grid gap-4 md:grid-cols-3"><SummaryCard title="Total Cases" value={stats.total} /><SummaryCard title="Ready" value={stats.ready} /><SummaryCard title="In Progress" value={stats.inProgress} /></div>
      <HowItWorksCard />
      <TodayCasesTable cases={cases.slice(0, 10)} />
      <RecentBeforeAfter cases={cases} />
    </div>
  );
}
