import { addMonths, format } from 'date-fns';

export function lastNMonthsLabels(n: number): ReadonlyArray<{ readonly key: string; readonly label: string }> {
  const now = new Date();
  const start = addMonths(now, -(n - 1));
  const out: Array<{ key: string; label: string }> = [];
  for (let i = 0; i < n; i += 1) {
    const d = addMonths(start, i);
    out.push({ key: format(d, 'yyyy-MM'), label: format(d, 'MMM yyyy') });
  }
  return out;
}

export function timelineDateLabel(dateStr: string): string {
  // Supports 'YYYY-MM' or ISO date
  const normalized = dateStr.length === 7 ? `${dateStr}-01` : dateStr;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return dateStr;
  return format(d, 'MMM yyyy');
}

export function shapeMonthlyTotals(
  monthlyCounts: Record<string, number>,
  months: ReadonlyArray<{ readonly key: string; readonly label: string }>,
  finalTotal: number,
): ReadonlyArray<{ readonly name: string; readonly total: number }> {
  const series = months.map(({ key, label }) => ({
    name: label,
    total: monthlyCounts[key] ?? 0,
  }));
  if (series.length > 0) {
    const last = series[series.length - 1];
    if (finalTotal > last.total) {
      series[series.length - 1] = { ...last, total: finalTotal };
    }
  }
  return series;
}