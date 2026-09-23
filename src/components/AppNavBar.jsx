import { Link, useLocation, useNavigate } from "react-router-dom";
import { Crosshair, LayoutDashboard, Calculator, Radar, Swords } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const ITEMS = [
  { to: "/", label: "Command", icon: Crosshair },
  { to: "/waivers", label: "Waivers", icon: Radar },
  { to: "/warroom", label: "War Room", icon: Swords },
  { to: "/dashboard", label: "Team", icon: LayoutDashboard },
  { to: "/analyst", label: "Analyst", icon: Calculator },
];

// Fixed, non-scrolling bottom bar: five equal cloudy tabs plus the theme toggle.
export default function AppNavBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Tapping the tab you're already on acts like a native app: drop any query
  // string (e.g. comparison picks) and settle back on the clean root path.
  const handleTabTap = (e, to) => {
    if (pathname !== to) return;
    e.preventDefault();
    navigate(to, { replace: true });
  };

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-[calc(0.625rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-2">
      <div className="no-callout pointer-events-auto flex w-full max-w-md items-center gap-1 rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-1 shadow-[0_8px_28px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
        <div className="grid min-w-0 flex-1 grid-cols-5 gap-1">
          {ITEMS.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={(e) => handleTabTap(e, to)}
                aria-current={active ? "page" : undefined}
                className={`cloud-tab no-callout flex min-h-[46px] min-w-0 flex-col items-center justify-center gap-0.5 text-sm font-semibold leading-none tracking-tight ${
                  active ? "cloud-tab--active" : ""
                }`}
              >
                <Icon className="h-[17px] w-[17px]" />
                <span className="nav-label whitespace-nowrap">{label}</span>
              </Link>
            );
          })}
        </div>
        <div className="flex w-8 shrink-0 justify-center [&>button]:w-8">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}