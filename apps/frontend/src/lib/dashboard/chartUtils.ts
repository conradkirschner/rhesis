export type MonthlyPoint = { readonly name: string; readonly total: number };

/** Returns labels for the last `n` months, oldest → newest, like `Sep 2025`. */
export function getLastNMonths(n: number): readonly string[] {
  const out: string[] = [];
  const now = new Date();
  now.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(
      new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(d),
    );
  }
  return out;
}

/** Builds a monthly time series from a `YYYY-MM -> count` map. */
export function createMonthlyData(
  counts: Record<string, number>,
  lastNLabels: readonly string[],
): readonly MonthlyPoint[] {
  const labelToKey = (label: string) => {
    const [mon, yr] = label.split(' ');
    const monthIndex = new Date(`${mon} 1, ${yr}`).getMonth() + 1;
    const mm = `${monthIndex}`.padStart(2, '0');
    return `${yr}-${mm}`;
  };

  let running = 0;
  const series = lastNLabels.map((label) => {
    const key = labelToKey(label);
    running += Number.isFinite(counts[key]) ? Number(counts[key]) : 0;
    return { name: label, total: running };
  });

  return series;
}