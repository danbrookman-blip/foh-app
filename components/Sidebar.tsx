"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./Wordmark";

type Manager = { name: string; venue: string };

const NAV = [
  { href: "/arrivals", label: "Arrivals", icon: ArrivalsIcon },
  { href: "/lookup", label: "Lookup", icon: LookupIcon },
  { href: "/add-customer", label: "Add customer", icon: AddIcon },
  { href: "/", label: "Profile", icon: ProfileIcon },
];

export function Sidebar({
  collapsed,
  onToggle,
  manager,
}: {
  collapsed: boolean;
  onToggle: () => void;
  manager: Manager;
}) {
  const pathname = usePathname();
  return (
    <aside
      className={`hidden md:flex md:fixed md:inset-y-0 md:left-0 md:flex-col md:z-20 bg-white border-r border-platinum transition-[width] duration-200 ${
        collapsed ? "md:w-16" : "md:w-60"
      }`}
    >
      <div className={`flex items-center gap-2 px-3 py-4 border-b border-platinum ${collapsed ? "justify-center" : ""}`}>
        {collapsed ? <CompactMark /> : <Wordmark />}
      </div>

      <nav className="flex-1 px-2 py-3 space-y-1">
        {NAV.map((item) => {
          const active =
            (item.href === "/" && pathname === "/") ||
            (item.href !== "/" && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-xl2 px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-accent-soft text-warm-purple"
                  : "text-ink hover:bg-surface-tint"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon active={!!active} />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-platinum px-3 py-3">
        {!collapsed ? (
          <div className="mb-2 px-1">
            <div className="text-[11px] font-bold uppercase tracking-wideish text-light-gray">
              Signed in
            </div>
            <div className="text-sm font-semibold text-ink truncate">{manager.name}</div>
            <div className="text-xs text-ink-muted truncate">{manager.venue}</div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={onToggle}
          className={`w-full flex items-center gap-2 rounded-xl2 px-3 py-2 text-xs font-semibold text-ink-muted hover:text-ink hover:bg-surface-tint transition ${
            collapsed ? "justify-center" : ""
          }`}
          aria-label={collapsed ? "Expand side navigation" : "Collapse side navigation"}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform ${collapsed ? "" : "rotate-180"}`}
          >
            <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {!collapsed ? <span>Collapse</span> : null}
        </button>
      </div>
    </aside>
  );
}

function CompactMark() {
  return (
    <svg
      width={28}
      height={28}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="48" height="48" rx="12" fill="#3D0A4D" />
      <ellipse
        cx="24"
        cy="22"
        rx="15"
        ry="6.5"
        fill="none"
        stroke="#D824D8"
        strokeWidth="2.5"
      />
      <rect x="20.5" y="29" width="7" height="2" rx="1" fill="#D824D8" />
      <rect x="22.5" y="31" width="3" height="5" rx="1" fill="#D824D8" />
    </svg>
  );
}

const ICON = 20;
const stroke = (active: boolean) => (active ? "#5E197C" : "#5D6F89");

function LookupIcon({ active }: { active: boolean }) {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <circle cx="11" cy="11" r="6.5" stroke={stroke(active)} strokeWidth="1.8" />
      <path d="m20 20-4-4" stroke={stroke(active)} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function ArrivalsIcon({ active }: { active: boolean }) {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <ellipse cx="12" cy="11" rx="8" ry="3.5" stroke={stroke(active)} strokeWidth="1.8" />
      <circle cx="12" cy="11" r="1.5" fill={stroke(active)} />
      <path d="M11 14.5h2v3.5h-2z" fill={stroke(active)} />
    </svg>
  );
}
function AddIcon({ active }: { active: boolean }) {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <circle cx="12" cy="12" r="8.5" stroke={stroke(active)} strokeWidth="1.8" />
      <path d="M12 8.5v7M8.5 12h7" stroke={stroke(active)} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <circle cx="12" cy="8.5" r="3.5" stroke={stroke(active)} strokeWidth="1.8" />
      <path d="M5 19c0-3.5 3.2-6 7-6s7 2.5 7 6" stroke={stroke(active)} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
