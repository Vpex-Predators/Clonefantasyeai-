import { Link, useLocation } from "react-router-dom";
import { Crosshair, LayoutDashboard, Calculator, Radar, Swords } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

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
    <nav className="pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-2">
      <div className="no-callout no-scrollbar pointer-events-auto flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-white/15 bg-slate-900/60 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.45),0_0_24px_rgba(52,211,153,0.12)] backdrop-blur-2xl">
        {ITEMS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`no-callout flex min-h-[44px] shrink-0 items-center gap-1.5 px-2.5 text-sm font-bold uppercase tracking-wide transition-colors ${
                active
                  ? "rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow-[0_0_16px_rgba(52,211,153,0.45)]"
                  : "rounded-full text-white/60 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
        <div className="ml-0.5 h-5 w-px bg-white/15" />
        <ThemeToggle />
      </div>
    </nav>
  );
}