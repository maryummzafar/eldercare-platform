/**
 * Display formatting. Kept in one place so money and times read identically on
 * every screen — an elder comparing a quote to a receipt should not have to
 * reconcile two different renderings of the same number.
 */

/**
 * Rates and totals arrive as JSON numbers from BigDecimal(scale=2). Paise are shown
 * only when there are any: "₹1,000" reads cleaner than "₹1,000.00", while
 * "₹312.50" still shows exactly what was billed. Grouping follows Indian
 * convention (₹1,00,000).
 */
export function formatMoney(amount: number): string {
  const hasPaise = Math.round(amount * 100) % 100 !== 0;
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/** "Good morning" / "Good afternoon" / "Good evening", for the home screen greeting. */
export function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
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
