/** Formats a YYYY-MM or ISO date string to `MMM yyyy`. */
export function formatTimelineDate(input: string): string {
  const m = input.match(/^(\d{4})-(\d{2})$/);
  const date = m ? new Date(Number(m[1]), Number(m[2]) - 1, 1) : new Date(input);
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
}