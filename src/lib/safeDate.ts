import { format, formatDistanceToNow, parseISO, type Locale } from "date-fns";

/**
 * Centralized, defensive date utilities.
 * Always use these instead of `new Date(x)` / `parseISO(x)` followed by
 * `format(...)` to prevent `RangeError: Invalid time value` crashes.
 */

export type DateInput = Date | string | number | null | undefined;

/** Parse any input into a valid Date, or return null. Never throws. */
export function toValidDate(input: DateInput): Date | null {
  if (input == null || input === "") return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === "number") {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof input === "string") {
    // Try ISO first
    let d = parseISO(input);
    if (isNaN(d.getTime())) {
      // Fallback to native parser
      d = new Date(input);
    }
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** True if the input parses to a real Date. */
export function isValidDate(input: DateInput): boolean {
  return toValidDate(input) !== null;
}

interface SafeFormatOpts {
  locale?: Locale;
  fallback?: string;
}

/** Safe wrapper around date-fns `format`. Returns fallback (default "") on invalid. */
export function safeFormat(
  input: DateInput,
  pattern: string,
  opts: SafeFormatOpts = {}
): string {
  const d = toValidDate(input);
  if (!d) return opts.fallback ?? "";
  try {
    return format(d, pattern, { locale: opts.locale });
  } catch {
    return opts.fallback ?? "";
  }
}

/** Safe wrapper around date-fns `formatDistanceToNow`. */
export function safeFormatDistanceToNow(
  input: DateInput,
  opts: { locale?: Locale; addSuffix?: boolean; fallback?: string } = {}
): string {
  const d = toValidDate(input);
  if (!d) return opts.fallback ?? "";
  try {
    return formatDistanceToNow(d, { locale: opts.locale, addSuffix: opts.addSuffix });
  } catch {
    return opts.fallback ?? "";
  }
}
