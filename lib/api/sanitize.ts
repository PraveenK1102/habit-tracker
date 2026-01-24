/**
 * "Sanitization" here means: normalize input to a safe, expected shape.
 * We are not doing HTML sanitization because we do not render user input as HTML.
 */

export function cleanString(input: unknown, opts?: { max?: number; allowEmpty?: boolean }): string {
  const max = opts?.max ?? 2000;
  const allowEmpty = opts?.allowEmpty ?? false;

  const s = String(input ?? '').trim();
  if (!allowEmpty && s.length === 0) return '';
  if (s.length > max) return s.slice(0, max);
  return s;
}

export function cleanEmail(input: unknown): string {
  return cleanString(input, { max: 254 }).toLowerCase();
}

export function isISODateOnly(s: string): boolean {
  // YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function containsAngleBrackets(s: string): boolean {
  return /[<>]/.test(s);
}

export function stripControlChars(s: string): string {
  // Remove ASCII control chars except \n and \t
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}


