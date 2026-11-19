/**
 * Indian date, number, and Firestore Timestamp formatting helpers.
 * Keeps ISO YYYY-MM-DD strings intact for HTML <input type="date"> values
 * while displaying user-facing dates in Indian standard formats (DD MMM YYYY / DD/MM/YYYY).
 */

export interface FirestoreTimestampLike {
  toDate?: () => Date;
  seconds?: number;
}

/**
 * Safely converts a Firestore Timestamp, Date object, or string into an ISO date string.
 * Returns YYYY-MM-DD when dateOnly is true, or full ISO string otherwise.
 */
export function toIsoDateString(
  value: unknown,
  fallback?: string,
  dateOnly = false
): string {
  const defaultVal =
    fallback ?? (dateOnly ? new Date().toISOString().slice(0, 10) : new Date().toISOString());

  if (!value) return defaultVal;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return defaultVal;
    return dateOnly ? trimmed.slice(0, 10) : trimmed;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const iso = value.toISOString();
    return dateOnly ? iso.slice(0, 10) : iso;
  }

  if (typeof value === 'object') {
    const ts = value as FirestoreTimestampLike;
    if (typeof ts.toDate === 'function') {
      const d = ts.toDate();
      if (d instanceof Date && !Number.isNaN(d.getTime())) {
        const iso = d.toISOString();
        return dateOnly ? iso.slice(0, 10) : iso;
      }
    }
    if (typeof ts.seconds === 'number' && Number.isFinite(ts.seconds)) {
      const d = new Date(ts.seconds * 1000);
      if (!Number.isNaN(d.getTime())) {
        const iso = d.toISOString();
        return dateOnly ? iso.slice(0, 10) : iso;
      }
    }
  }

  return defaultVal;
}

const INDIAN_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function parseDateParts(value: unknown): { year: number; monthIndex: number; day: number } | null {
  const iso = toIsoDateString(value, '', false);
  if (!iso) return null;

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const monthIndex = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);
    if (monthIndex >= 0 && monthIndex <= 11 && day >= 1 && day <= 31) {
      return { year, monthIndex, day };
    }
  }

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return {
    year: parsed.getFullYear(),
    monthIndex: parsed.getMonth(),
    day: parsed.getDate(),
  };
}

/**
 * Formats a date in readable Indian format: "19 Nov 2026".
 * Falls back to empty string or custom fallback if invalid.
 */
export function formatIndianDate(value: unknown, fallback = '—'): string {
  const parts = parseDateParts(value);
  if (!parts) return fallback;
  const dd = String(parts.day).padStart(2, '0');
  const mmm = INDIAN_MONTHS[parts.monthIndex];
  return `${dd} ${mmm} ${parts.year}`;
}

/**
 * Formats a date in compact Indian numeric format: "19/11/2026".
 */
export function formatIndianShortDate(value: unknown, fallback = '—'): string {
  const parts = parseDateParts(value);
  if (!parts) return fallback;
  const dd = String(parts.day).padStart(2, '0');
  const mm = String(parts.monthIndex + 1).padStart(2, '0');
  return `${dd}/${mm}/${parts.year}`;
}

/**
 * Formats a date as "19 Nov" for compact chart X-axis ticks in Indian day-first order.
 */
export function formatIndianDayMonth(value: unknown, fallback = ''): string {
  const parts = parseDateParts(value);
  if (!parts) return fallback;
  const dd = String(parts.day).padStart(2, '0');
  const mmm = INDIAN_MONTHS[parts.monthIndex];
  return `${dd} ${mmm}`;
}

/**
 * Formats a number using the Indian numbering system (en-IN).
 */
export function formatIndianNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('en-IN').format(value);
}
