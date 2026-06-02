"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wordmark } from "./Wordmark";

type ShellProps = {
  children: React.ReactNode;
  manager?: { name: string; venue: string };
  title?: string;
  back?: string;
};

export function ManagerShell({ children, manager, title, back }: ShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <>
      <header className="sticky top-0 z-10 bg-white/85 backdrop-blur border-b border-navy-100/60">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            {back ? (
              <button
                onClick={() => router.push(back)}
                className="text-ink-muted text-base w-8 h-8 -ml-1 rounded-full hover:bg-surface-tint flex items-center justify-center"
                aria-label="Back"
              >
                ←
              </button>
            ) : (
              <Wordmark />
            )}
            <div className="flex-1 min-w-0">
              {title ? (
                <div className="text-lg font-semibold leading-tight truncate text-navy-900">
                  {title}
                </div>
              ) : null}
              {manager ? (
                <div className="text-xs text-ink-muted truncate">
                  {manager.venue} · {manager.name}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 px-4 py-4 pb-28">{children}</main>
      {manager ? <BottomNav pathname={pathname} /> : null}
    </>
  );
}

function BottomNav({ pathname }: { pathname: string | null }) {
  const tabs = [
    { href: "/lookup", label: "Lookup", icon: LookupIcon },
    { href: "/arrivals", label: "Arrivals", icon: ArrivalsIcon },
    { href: "/add-customer", label: "Add", icon: AddIcon },
    { href: "/", label: "Settings", icon: SettingsIcon },
  ];
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur border-t border-navy-100/60"
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
                active ? "text-pink-500" : "text-ink-subtle"
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
const stroke = (active: boolean) => (active ? "#E5277B" : "#8E91A8");

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
function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke={stroke(active)} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
