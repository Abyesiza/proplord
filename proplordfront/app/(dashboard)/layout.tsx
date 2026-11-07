import { Suspense, type ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { DashboardShellSkeleton } from "@/components/skeletons/page-skeleton";
import { requireUser } from "@/lib/session";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<DashboardShellSkeleton />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-screen">
      <div className="no-print">
        <DashboardSidebar role={user.role} />
      </div>
      <div className="lg:pl-64 print:pl-0">
        <DashboardTopbar name={user.fullName ?? user.username ?? "Account"} role={user.role} />
        <main className="p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
