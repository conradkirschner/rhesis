export function formatDisplayDate(dateString: string | null | undefined) {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}