import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { TopNavbar } from "./top-navbar";
import { MobileNav } from "./mobile-nav";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="portal-shell flex min-h-dvh w-full text-foreground">
      <Sidebar />

      <div className="relative flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />
        <main className="min-w-0 flex-1 overflow-y-auto px-3 py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-5 sm:py-5 md:pb-6 lg:px-7">
          <div className="mx-auto w-full max-w-[1360px]">
            {children}
          </div>
        </main>
        <footer className="hidden border-t portal-soft-rule bg-card/72 px-6 py-3 backdrop-blur md:block">
          <p className="text-center text-xs text-muted-foreground">
            © 2026 Mohalla &nbsp;·&nbsp; Made in Pakistan
          </p>
        </footer>
      </div>

      <MobileNav />
    </div>
  );
}
