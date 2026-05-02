import { Card } from "../ui/Card";

export function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </Card>
  );
}
