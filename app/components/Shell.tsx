"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const APP_NAV = [
  { href: "/app", label: "Dashboard" },
  { href: "/create", label: "Request" },
  { href: "/offramp", label: "Offramp" },
  { href: "/p/chidera", label: "Profile" },
  { href: "/onboarding", label: "Onboarding" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isClientView = pathname.startsWith("/pay/");
  const isLanding = pathname === "/";

  if (isClientView) {
    return <div className="min-h-screen flex flex-col">{children}</div>;
  }

  if (isLanding) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="absolute top-0 left-0 right-0 z-10">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 font-mono text-sm tracking-tight"
            >
              <span className="size-2 rounded-full bg-signal" />
              <span>kano rails</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/p/chidera"
                className="text-sm text-muted hover:text-foreground transition"
              >
                Demo profile
              </Link>
              <Link
                href="/app"
                className="bg-signal text-background px-4 py-1.5 rounded-md text-sm font-medium hover:opacity-90 transition"
              >
                Launch app →
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-muted font-mono flex items-center justify-between">
            <span>kano rails · sui overflow 2026 · defi & payments</span>
            <span>v1.1</span>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-sm tracking-tight"
          >
            <span className="size-2 rounded-full bg-signal" />
            <span>kano rails</span>
            <span className="text-muted">/ testnet</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {APP_NAV.map((item) => {
              const active =
                item.href === "/app"
                  ? pathname === "/app"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 rounded-md transition-colors",
                    active
                      ? "bg-surface text-foreground"
                      : "text-muted hover:text-foreground hover:bg-surface/50"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        {children}
      </main>
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 text-xs text-muted font-mono flex items-center justify-between">
          <span>kano rails · sui overflow 2026 · defi & payments</span>
          <span>v1.1 · scaffold</span>
        </div>
      </footer>
    </div>
  );
}
