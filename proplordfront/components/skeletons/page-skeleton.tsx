import { cn } from "@/lib/cn";

export const Bone = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-md bg-muted motion-reduce:animate-none", className)} />
);

/** Mirrors the overview layout: header, stat row, two panels. */
export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Bone className="mb-8 h-12 w-full max-w-72" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Bone key={i} className="h-36" />
        ))}
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <Bone className="h-72" />
        <Bone className="h-72" />
      </div>
    </div>
  );
}

export function DashboardShellSkeleton() {
  return (
    <div className="min-h-screen lg:pl-64">
      <Bone className="fixed inset-y-0 left-0 hidden w-64 rounded-none lg:block" />
      <Bone className="h-16 rounded-none" />
      <main className="p-4 sm:p-6 lg:p-10">
        <PageSkeleton />
      </main>
    </div>
  );
}
