import { NavLink } from "react-router-dom";

const nav = [
  ["/", "Dashboard"],
  ["/new", "New Case"],
  ["/cases", "Cases"],
  ["/settings", "Settings"],
] as const;

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-200 bg-white p-4">
      <h1 className="mb-6 text-xl font-bold text-slate-900">DentalSim Pro</h1>
      <nav className="space-y-1">
        {nav.map(([path, label]) => (
          <NavLink key={path} to={path} className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm ${isActive ? "bg-brand-50 text-brand-600" : "text-slate-600 hover:bg-slate-100"}`}>
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
