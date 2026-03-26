function stripLeadingApostrophe(str: string): string {
  return str.startsWith("'") ? str.slice(1) : str;
}

export function parseDate(str: string): Date | null {
  if (!str) return null;
  str = stripLeadingApostrophe(str.trim());
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  // DD-Mon-YYYY HH:MM:SS
  const m = str.match(/(\d{1,2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (m) return new Date(+m[3], months[m[2]], +m[1], +m[4], +m[5], +m[6]);
  // Mon/DD/YYYY HH:MM:SS (Google Sheets format)
  const m2 = str.match(/([A-Za-z]{3})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})/);
  if (m2) return new Date(+m2[3], months[m2[1]], +m2[2], +m2[4], +m2[5], +m2[6]);
  // MM/DD/YYYY HH:MM:SS
  const m3 = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})/);
  if (m3) return new Date(+m3[3], +m3[1] - 1, +m3[2], +m3[4], +m3[5], +m3[6]);
  // DD-Mon-YYYY (no time)
  const m4 = str.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (m4) return new Date(+m4[3], months[m4[2]], +m4[1]);
  // MM/DD/YYYY (no time)
  const m5 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m5) return new Date(+m5[3], +m5[1] - 1, +m5[2]);
  // YYYY-MM-DD
  const m6 = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m6) return new Date(+m6[1], +m6[2] - 1, +m6[3]);
  // Fallback: try native Date parse
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  return null;
}

export function parseExtractionDate(str: string): Date | null {
  if (!str) return null;
  str = stripLeadingApostrophe(str.trim());
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  // DD-Mon-YYYY
  const dmy = str.match(/(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
  if (dmy) return new Date(+dmy[3], months[dmy[2]], +dmy[1]);
  // YYYY-MM-DD
  const iso = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  // MM/DD/YYYY
  const mdy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) return new Date(+mdy[3], +mdy[1] - 1, +mdy[2]);
  return null;
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
