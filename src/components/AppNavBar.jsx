import { Link, useLocation } from "react-router-dom";
import { Crosshair, LayoutDashboard, Calculator, Radar, Swords } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Command", icon: Crosshair },
  { to: "/waivers", label: "Waivers", icon: Radar },
  { to: "/warroom", label: "War Room", icon: Swords },
  { to: "/dashboard", label: "My Team", icon: LayoutDashboard },
  { to: "/analyst", label: "Analyst", icon: Calculator },
];

export default function AppNavBar() {
  const { pathname } = useLocation();
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-3">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/15 bg-slate-900/60 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.45),0_0_24px_rgba(52,211,153,0.12)] backdrop-blur-2xl">
        {ITEMS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1 px-1.5 py-2 text-[9px] font-bold uppercase tracking-wide transition-colors sm:px-2.5 sm:text-[10px] ${
                active
                  ? "rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow-[0_0_16px_rgba(52,211,153,0.45)]"
                  : "text-white/60 hover:text-white"
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