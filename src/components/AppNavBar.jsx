import { Link, useLocation } from "react-router-dom";
import { Crosshair, LayoutDashboard, Calculator, Swords } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Command", icon: Crosshair },
  { to: "/warroom", label: "War Room", icon: Swords },
  { to: "/dashboard", label: "My Team", icon: LayoutDashboard },
  { to: "/analyst", label: "Analyst", icon: Calculator },
];

export default function AppNavBar() {
  const { pathname } = useLocation();
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-3">
      <div className="pointer-events-auto flex items-center gap-1 border border-white/10 bg-slate-950/95 p-1.5 shadow-xl shadow-black/50 backdrop-blur">
        {ITEMS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                active ? "bg-emerald-400 text-slate-950" : "text-white/60 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}