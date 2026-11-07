import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
            {headers.map((h) => (
              <th key={h} scope="col" className="px-3 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <td className={cn("px-3 py-3.5 align-middle", className)}>{children}</td>;
}
