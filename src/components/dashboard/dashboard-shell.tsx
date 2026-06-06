import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { TopNavbar } from "./top-navbar";
import { MobileNav } from "./mobile-nav";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-32 top-1/2 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <Sidebar />

      <div className="relative flex flex-1 flex-col min-w-0">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">{children}</main>
        <footer className="hidden md:block border-t border-border bg-muted/20 px-6 py-4">
          <p className="text-center text-xs text-muted-foreground">
            © 2026 Mohalla &nbsp;·&nbsp; Made in Pakistan 🇵🇰
          </p>
        </footer>
      </div>

      <MobileNav />
    </div>
  );
}
