import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, LayoutDashboard, Calculator, Radar, GitCompareArrows } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/waivers", label: "Waivers", icon: Radar },
  { to: "/warroom?tab=trade", root: "/warroom", label: "Compare", icon: GitCompareArrows, primary: true },
  { to: "/dashboard", label: "Team", icon: LayoutDashboard },
  { to: "/analyst", label: "AI", icon: Calculator },
];

export default function AppNavBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleTabTap = (e, item) => {
    const root = item.root || item.to;
    if (pathname !== root) return;
    e.preventDefault();
    navigate(item.to, { replace: true });
  };

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-[calc(0.625rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-3"
      aria-label="Primary"
    >
      <div className="app-dock pointer-events-auto flex w-full max-w-lg items-center gap-1 rounded-[1.4rem] p-1.5">
        <div className="grid min-w-0 flex-1 grid-cols-5 gap-1">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const root = item.root || item.to;
            const active = pathname === root;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={(e) => handleTabTap(e, item)}
                aria-current={active ? "page" : undefined}
                className={
                  "no-callout group relative flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-1 rounded-[1rem] px-1 transition-all duration-200 " +
                  (active
                    ? "bg-white/[0.10] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                    : "text-white/55 hover:bg-white/[0.05] hover:text-white/85")
                }
              >
                <span
                  className={
                    "flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-200 " +
                    (active
                      ? "bg-emerald-400 text-slate-950 shadow-[0_0_18px_rgba(52,211,153,0.24)]"
                      : item.primary
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "text-current")
                  }
                >
                  <Icon className="h-[17px] w-[17px]" />
                </span>
                <span className="nav-label truncate font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="flex w-9 shrink-0 justify-center border-l border-white/10 pl-1 [&>button]:h-9 [&>button]:w-9">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
