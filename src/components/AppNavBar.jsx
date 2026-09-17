import { Link, useLocation } from "react-router-dom";
import { Crosshair, LayoutDashboard, Calculator } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Command", icon: Crosshair },
  { to: "/dashboard", label: "My Team", icon: LayoutDashboard },
  { to: "/analyst", label: "Analyst", icon: Calculator },
];

export default function AppNavBar() {
  const { pathname } = useLocation();
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-slate-900/90 p-1.5 shadow-xl shadow-black/40 backdrop-blur">
        {ITEMS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-colors ${
                active ? "bg-emerald-400 text-slate-950" : "text-white/70 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}