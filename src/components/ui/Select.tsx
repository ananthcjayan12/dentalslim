import type { SelectHTMLAttributes } from "react";

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" {...props} />;
}
