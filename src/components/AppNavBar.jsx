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

// Fixed, non-scrolling bottom bar: five equal tabs (icon over label) plus the
// theme toggle, all fitting inside a 360px-wide phone.
export default function AppNavBar() {
  const { pathname } = useLocation();
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-2">
      <div className="no-callout pointer-events-auto flex w-full max-w-md items-center rounded-[1.75rem] border border-white/15 bg-slate-900/70 p-1 shadow-[0_8px_32px_rgba(0,0,0,0.45),0_0_24px_rgba(52,211,153,0.12)] backdrop-blur-2xl">
        <div className="grid min-w-0 flex-1 grid-cols-5">
          {ITEMS.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? "page" : undefined}
                className={`no-callout flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-[1.4rem] text-sm font-semibold leading-none tracking-tight transition-colors ${
                  active
                    ? "bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow-[0_0_16px_rgba(52,211,153,0.45)]"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            );
          })}
        </div>
        <div className="flex w-9 shrink-0 justify-center [&>button]:w-9">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}