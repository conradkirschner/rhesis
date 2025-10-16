export type MonthKey = `${number}-${`${number}` extends infer M ? M : never}`;

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export function lastNMonthKeys(n: number): readonly MonthKey[] {
  const now = new Date();
  const keys: MonthKey[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}` as MonthKey);
  }
  return keys;
}

export function formatTimelineDate(input: string): string {
  // Accepts YYYY-MM or ISO date strings
  const d = new Date(input.length === 7 ? `${input}-01` : input);
  if (Number.isNaN(d.getTime())) return input;
  if (input.length === 7) {
    return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(d);
  }
  return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short' }).format(d);
}

export function buildCumulativeMonthlySeries(
  monthlyCounts: Record<string, number> | undefined,
  months: readonly MonthKey[],
): readonly { readonly name: string; readonly total: number }[] {
  const series: { name: string; total: number }[] = [];
  let acc = 0;
  for (const key of months) {
    const v = monthlyCounts?.[key] ?? 0;
    acc += Number(v);
    series.push({ name: formatTimelineDate(key), total: acc });
  }
  return series;
}
