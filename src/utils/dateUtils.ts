/**
 * ============================================================
 * DATE FORMAT REGISTRY
 * ============================================================
 * All date formats encountered across the app (Filings, News,
 * Daily Brief sheets). Update this list when new formats appear.
 *
 * FORMAT                        EXAMPLE                   USED IN
 * ─────────────────────────────────────────────────────────────
 * 'DD-Mon-YYYY HH:MM:SS        '26-Mar-2026 00:13:11     Filings PubDate
 * DD-Mon-YYYY HH:MM:SS         26-Mar-2026 00:13:11      Filings PubDate
 * DD-Mon-YYYY                   26-Mar-2026               Filings, News
 * Mon/DD/YYYY HH:MM:SS         Mar/25/2026 12:00:00      Filings (Google Sheets auto)
 * MM/DD/YYYY HH:MM:SS          3/25/2026 00:13:11        Filings PubDate
 * MM/DD/YYYY                   3/25/2026                 News, Daily Brief
 * YYYY-MM-DD                   2026-03-24                News, Daily Brief
 * 'YYYY-MM-DD                  '2026-03-24               Daily Brief (text cell)
 * 'DD-Mon-YYYY                 '26-Mar-2026              News Extraction_Date
 *
 * Leading apostrophe is always stripped before parsing.
 * All parsers use LOCAL time (no timezone conversion).
 * ============================================================
 */

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function clean(str: string): string {
  // Strip leading apostrophe(s) and trim whitespace
  return str.trim().replace(/^'+/, '');
}

/**
 * Universal date+time parser — handles every format in the registry.
 * Returns Date with time if present, midnight otherwise.
 */
export function parseDate(str: string): Date | null {
  if (!str) return null;
  str = clean(str);

  // DD-Mon-YYYY HH:MM:SS
  const a = str.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/);
  if (a && MONTHS[a[2]] !== undefined) return new Date(+a[3], MONTHS[a[2]], +a[1], +a[4], +a[5], +a[6]);

  // Mon/DD/YYYY HH:MM:SS
  const b = str.match(/^([A-Za-z]{3})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/);
  if (b && MONTHS[b[1]] !== undefined) return new Date(+b[3], MONTHS[b[1]], +b[2], +b[4], +b[5], +b[6]);

  // MM/DD/YYYY HH:MM:SS
  const c = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/);
  if (c) return new Date(+c[3], +c[1] - 1, +c[2], +c[4], +c[5], +c[6]);

  // DD-Mon-YYYY (no time)
  const d = str.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (d && MONTHS[d[2]] !== undefined) return new Date(+d[3], MONTHS[d[2]], +d[1]);

  // MM/DD/YYYY (no time)
  const e = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (e) return new Date(+e[3], +e[1] - 1, +e[2]);

  // YYYY-MM-DD (with optional time — ignored for date-only use)
  const f = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (f) return new Date(+f[1], +f[2] - 1, +f[3]);

  // Fallback: native Date parse
  const fallback = new Date(str);
  if (!isNaN(fallback.getTime())) return fallback;
  return null;
}

/**
 * Date-only parser (no time component) — used for News & Daily Brief dates.
 * Delegates to the universal parser for consistency.
 */
export function parseExtractionDate(str: string): Date | null {
  const d = parseDate(str);
  if (!d) return null;
  // Zero out time for date-only comparisons
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function formatDate(date: Date | null): string {
  if (!date) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function formatDateShort(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `W/${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]}`;
}

export function getDayKey(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]}`;
}

export function getDayName(date: Date): string {
  return DAY_NAMES[date.getDay()];
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}
