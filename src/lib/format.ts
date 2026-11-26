const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2026-11-22" → "Nov 22, 2026" (no timezone shifting). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** "2026-04-01" → "April 2026". */
export function formatMonthYear(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  return `${MONTHS_LONG[m - 1]} ${y}`;
}

export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
}

export const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`);
export const oneDecimal = (v: number | null) => (v === null ? '—' : v.toFixed(1));

export const ACCESS_LABEL = { public: 'Public', municipal: 'Municipal', 'semi-private': 'Semi-private', private: 'Private' } as const;

/** "Thu, Dec 3" for schedules (dates are local calendar days). */
export function formatDay(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** "6:40 PM" from "18:40". */
export function formatTeeTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Add days to an ISO date. */
export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
