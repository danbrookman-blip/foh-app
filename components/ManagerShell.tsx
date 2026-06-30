"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wordmark } from "./Wordmark";
import { Sidebar } from "./Sidebar";

type ShellProps = {
  children: React.ReactNode;
  manager?: { name: string; venue: string };
  title?: string;
  back?: string;
};

/**
 * Responsive shell:
 *  - Mobile (<md): header on top, content full-width within max-w-md, BottomNav fixed at the foot.
 *  - Desktop (md+): collapsible Sidebar on the left, main column offset by sidebar width, no BottomNav.
 *
 * The Sidebar's collapsed state lives here so the main column can react with the
 * right left margin (16 / 60 width tiers). No persistence across pages — kept
 * deliberately session-light.
 */
export function ManagerShell({ children, manager, title, back }: ShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [navCollapsed, setNavCollapsed] = useState(false);

  return (
    <div className="min-h-screen">
      {manager ? (
        <Sidebar
          collapsed={navCollapsed}
          onToggle={() => setNavCollapsed((v) => !v)}
          manager={manager}
        />
      ) : null}

      <div
        className={`min-h-screen flex flex-col transition-[margin] duration-200 ${
          manager ? (navCollapsed ? "md:ml-16" : "md:ml-60") : ""
        }`}
      >
        <header className="sticky top-0 z-10 bg-white/85 backdrop-blur border-b border-platinum">
          <div className="mx-auto max-w-md md:max-w-none px-4 md:px-8 pt-4 pb-3 flex items-center gap-3">
            {back ? (
              <button
                onClick={() => router.push(back)}
                className="text-ink-muted text-base w-8 h-8 -ml-1 rounded-full hover:bg-surface-tint flex items-center justify-center"
                aria-label="Back"
              >
                ←
              </button>
            ) : (
              <div className="md:hidden">
                <Wordmark />
              </div>
            )}
            <div className="flex-1 min-w-0">
              {title ? (
                <div className="text-lg md:text-xl font-bold leading-tight truncate text-pickled-bluewood">
                  {title}
                </div>
              ) : null}
              {manager ? (
                <div className="text-xs text-ink-muted truncate md:hidden">
                  {manager.venue} · {manager.name}
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-4 md:py-6 pb-28 md:pb-10">
          <div className="mx-auto max-w-md md:max-w-7xl">{children}</div>
        </main>

        {manager ? <BottomNav pathname={pathname} /> : null}
      </div>
    </div>
  );
}

function BottomNav({ pathname }: { pathname: string | null }) {
  const tabs = [
    { href: "/lookup", label: "Lookup", icon: LookupIcon },
    { href: "/arrivals", label: "Arrivals", icon: ArrivalsIcon },
    { href: "/add-customer", label: "Add", icon: AddIcon },
    { href: "/", label: "Profile", icon: ProfileIcon },
  ];
  return (
    <nav
      className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur border-t border-platinum"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="grid grid-cols-4">
        {tabs.map((t) => {
          const active =
            (t.href === "/" && pathname === "/") ||
            (t.href !== "/" && pathname?.startsWith(t.href));
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center py-3 text-[11px] tracking-wideish uppercase font-semibold ${
                active ? "text-warm-purple" : "text-ink-subtle"
              }`}
            >
              <Icon active={!!active} />
              <span className="mt-1">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const ICON_SIZE = 22;
const stroke = (active: boolean) => (active ? "#5E197C" : "#99A7BC");

function LookupIcon({ active }: { active: boolean }) {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke={stroke(active)} strokeWidth="1.8" />
      <path d="m20 20-4-4" stroke={stroke(active)} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function ArrivalsIcon({ active }: { active: boolean }) {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" aria-hidden>
      <ellipse cx="12" cy="11" rx="8" ry="3.5" stroke={stroke(active)} strokeWidth="1.8" />
      <circle cx="12" cy="11" r="1.5" fill={stroke(active)} />
      <path d="M11 14.5h2v3.5h-2z" fill={stroke(active)} />
    </svg>
  );
}
function AddIcon({ active }: { active: boolean }) {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke={stroke(active)} strokeWidth="1.8" />
      <path d="M12 8.5v7M8.5 12h7" stroke={stroke(active)} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8.5" r="3.5" stroke={stroke(active)} strokeWidth="1.8" />
      <path d="M5 19c0-3.5 3.2-6 7-6s7 2.5 7 6" stroke={stroke(active)} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
