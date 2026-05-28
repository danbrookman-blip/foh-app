"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
      <header className="sticky top-0 z-10 bg-white border-b border-slate-100">
        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
          {back ? (
            <button
              onClick={() => router.push(back)}
              className="text-ink-muted text-sm w-8 h-8 -ml-1 rounded-full hover:bg-slate-100"
              aria-label="Back"
            >
              ←
            </button>
          ) : null}
          <div className="flex-1 min-w-0">
            {title ? (
              <div className="text-lg font-semibold leading-tight truncate">{title}</div>
            ) : (
              <div className="text-lg font-semibold leading-tight">Front of House</div>
            )}
            {manager ? (
              <div className="text-xs text-ink-muted truncate">
                {manager.venue} · {manager.name}
              </div>
            ) : null}
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
    { href: "/lookup", label: "Lookup", icon: "⌕" },
    { href: "/arrivals", label: "Arrivals", icon: "●" },
    { href: "/add-customer", label: "Add", icon: "＋" },
    { href: "/", label: "Settings", icon: "≡" },
  ];
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="grid grid-cols-4">
        {tabs.map((t) => {
          const active =
            (t.href === "/" && pathname === "/") ||
            (t.href !== "/" && pathname?.startsWith(t.href));
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center py-3 text-xs ${
                active ? "text-ink font-semibold" : "text-ink-subtle"
              }`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              <span className="mt-1">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
