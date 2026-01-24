import { z } from 'zod';
import { containsAngleBrackets, isISODateOnly, stripControlChars } from './sanitize';

export const uuid = z.string().uuid();

export const dateOnly = z
  .string()
  .refine((s) => isISODateOnly(s), 'Invalid date format. Expected YYYY-MM-DD');

export const safeText = (opts?: { max?: number; allowEmpty?: boolean }) => {
  const max = opts?.max ?? 2000;
  const allowEmpty = opts?.allowEmpty ?? false;

  return z
    .string()
    .transform((s) => stripControlChars(s).trim())
    .refine((s) => (allowEmpty ? true : s.length > 0), 'Required')
    .refine((s) => s.length <= max, `Must be <= ${max} characters`)
    .refine((s) => !containsAngleBrackets(s), 'HTML/angle brackets are not allowed');
};

export const safeOptionalText = (opts?: { max?: number }) => safeText({ max: opts?.max, allowEmpty: true }).optional();

export const taskFrequency = z.enum(['DAILY', 'WEEKLY']);
export const reminderDay = z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY', '']).default('');

export const stringList = (maxItems: number = 50, maxLen: number = 60) =>
  z
    .array(safeText({ max: maxLen, allowEmpty: false }))
    .max(maxItems)
    .default([]);

export const email = z
  .string()
  .transform((s) => stripControlChars(s).trim().toLowerCase())
  .pipe(z.string().email().max(254));

export const password = z
  .string()
  .transform((s) => stripControlChars(s))
  .pipe(z.string().min(8, 'Password must be at least 8 characters').max(200));


