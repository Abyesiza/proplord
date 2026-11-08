import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

type RowProps = { children?: ReactNode; className?: string };
type CellProps = { label?: string };

/** Table on md+, stacked label/value cards below it. Cells are matched to `headers` by position. */
export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  const rows = Children.toArray(children).map((row) => {
    if (!isValidElement<RowProps>(row)) return row;
    const cells = Children.toArray(row.props.children).map((cell, i) =>
      isValidElement<CellProps>(cell)
        ? cloneElement(cell as ReactElement<CellProps>, { label: headers[i] })
        : cell,
    );
    return cloneElement(
      row as ReactElement<RowProps>,
      {
        className:
          "max-md:block max-md:rounded-md max-md:border max-md:border-border max-md:bg-background max-md:px-4 max-md:py-2",
      },
      cells,
    );
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm max-md:block md:min-w-[32rem]">
        <thead className="max-md:hidden">
          <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
            {headers.map((h, i) => (
              <th key={i} scope="col" className="px-3 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="max-md:block max-md:space-y-3 md:divide-y md:divide-border">{rows}</tbody>
      </table>
    </div>
  );
}

export function Td({
  className,
  children,
  label,
}: {
  className?: string;
  children: ReactNode;
  label?: string;
}) {
  const empty = children == null || children === false || children === "";
  return (
    <td
      className={cn(
        "px-3 py-3.5 align-middle",
        empty
          ? "max-md:hidden"
          : "max-md:flex max-md:items-center max-md:justify-between max-md:gap-4 max-md:px-0 max-md:py-2",
        className,
      )}
    >
      {label && (
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:hidden">
          {label}
        </span>
      )}
      <div className="min-w-0 max-md:ml-auto max-md:text-right">{children}</div>
    </td>
  );
}
