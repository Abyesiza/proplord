import Link from "next/link";
import { suspended } from "@/components/skeletons/suspended";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/dashboard/print-button";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api";
import { getReceipt } from "@/lib/data";
import { coverage, formatDate, humanize, location, money, personName } from "@/lib/format";

export const metadata = { title: "Receipt | Proplord" };

export default suspended(ReceiptPage);

async function ReceiptPage({ params }: PageProps<"/dashboard/receipts/[id]">) {
  const { id } = await params;
  const receipt = await getReceipt(id).catch((err) => {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  });
  const { payment, property } = receipt;
  if (!payment || !property) notFound();

  const rows: [string, string][] = [
    ["Received from", personName(payment.member)],
    ["Unit", payment.member?.unit?.name ?? "N/A"],
    ["For", payment.charge?.description ?? "General payment"],
    ...(coverage(payment) ? ([["Period covered", coverage(payment)!]] as [string, string][]) : []),
    ["Paid on", formatDate(payment.paidAt)],
    ["Method", humanize(payment.method)],
    ...(payment.reference ? ([["Reference", payment.reference]] as [string, string][]) : []),
  ];

  return (
    <>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/receipts" className="text-sm font-semibold text-link hover:underline">
          Back to receipts
        </Link>
        <PrintButton />
      </div>

      <article className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-5 shadow-sm sm:p-8 md:p-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <Logo />
          <div className="sm:text-right">
            <p className="section-label">Receipt</p>
            <p className="text-2xl font-black tracking-tight">{receipt.receiptNumber}</p>
            <p className="text-sm text-muted-foreground">{formatDate(receipt.issuedAt)}</p>
          </div>
        </div>

        <div className="gradient-brand mt-8 rounded-md p-5 text-primary-foreground sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-widest opacity-80">Amount received</p>
          <p className="mt-1 break-words text-3xl font-black tracking-tight sm:text-5xl">{money(payment.amount, property.currency)}</p>
        </div>

        <p className="mt-8 text-lg font-bold">{property.name}</p>
        <p className="text-sm text-muted-foreground">{location(property)}</p>

        <dl className="mt-6 divide-y divide-border text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-3">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="min-w-0 break-words text-right font-semibold">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Badge variant="accent">Payment received</Badge>
          {payment.note && <p className="text-sm text-muted-foreground">{payment.note}</p>}
        </div>
      </article>
    </>
  );
}
