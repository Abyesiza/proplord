export const FREQUENCIES = [
  'biweekly',
  'monthly',
  'quarterly',
  'semiannual',
  'annual',
] as const;
export type Frequency = (typeof FREQUENCIES)[number];

const MONTHS: Record<Exclude<Frequency, 'biweekly'>, number> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
  annual: 12,
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const parse = (date: string) => new Date(`${date}T00:00:00Z`);

export const isValidDate = (date: string) =>
  !Number.isNaN(parse(date).getTime()) &&
  parse(date).toISOString().slice(0, 10) === date;

/** Month-based periods always begin on the 1st so they line up with calendar months. */
export const normalizeStart = (start: string, frequency: Frequency) =>
  frequency === 'biweekly' ? start : `${start.slice(0, 7)}-01`;

/** Exclusive end of `count` periods starting at `start` (YYYY-MM-DD). */
export function periodEnd(start: string, frequency: Frequency, count: number) {
  const date = parse(start);
  if (frequency === 'biweekly') date.setUTCDate(date.getUTCDate() + 14 * count);
  else date.setUTCMonth(date.getUTCMonth() + MONTHS[frequency] * count);
  return date.toISOString().slice(0, 10);
}

/** What one period costs: the agreed amount, else unit rent scaled from its monthly figure. */
export function installmentAmount(
  frequency: Frequency,
  monthlyRent: number,
  agreedAmount: number | null,
) {
  if (agreedAmount) return agreedAmount;
  const months = frequency === 'biweekly' ? 0.5 : MONTHS[frequency];
  return round2(monthlyRent * months);
}

export const totalFor = (installment: number, count: number) =>
  round2(installment * count);
