/**
 * Display formatting. Kept in one place so money and times read identically on
 * every screen — an elder comparing a quote to a receipt should not have to
 * reconcile two different renderings of the same number.
 */

/**
 * Rates and totals arrive as JSON numbers from BigDecimal(scale=2), so two
 * decimal places is the faithful rendering rather than a cosmetic choice.
 */
export function formatMoney(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "Tue 3 Sep, 10:00 am – 12:00 pm", collapsing the repeated date. */
export function formatTimeRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const day = start.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const time = (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${day}, ${time(start)} – ${time(end)}`;
}
