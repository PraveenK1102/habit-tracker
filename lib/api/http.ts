import { NextResponse } from 'next/server';
import { ZodError, type ZodSchema } from 'zod';
import { ApiError, isApiError } from './errors';

export type ApiOk<T> = { ok: true; data: T };
// Keep `error` as a STRING for backward compatibility with existing frontend code.
export type ApiFail = { ok: false; error: string; code?: string };
export type ApiResponse<T> = ApiOk<T> | ApiFail;

export function ok<T>(data: T, status: number = 200) {
  return NextResponse.json({ ok: true, data } satisfies ApiOk<T>, { status });
}

export function fail(message: string, status: number = 400, code?: string) {
  return NextResponse.json({ ok: false, error: message, code } satisfies ApiFail, { status });
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError('Invalid JSON body', 400, 'INVALID_JSON');
  }
}

export async function readJsonValidated<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  const body = await readJson<unknown>(request);
  try {
    return schema.parse(body);
  } catch (e) {
    if (e instanceof ZodError) {
      throw new ApiError(e.errors[0]?.message || 'Invalid request body', 400, 'INVALID_BODY');
    }
    throw e;
  }
}

export function handleApiError(err: unknown) {
  if (isApiError(err)) return fail(err.message, err.status, err.code);
  if (err instanceof ZodError) return fail(err.errors[0]?.message || 'Invalid request', 400, 'INVALID_REQUEST');
  console.error('Unhandled API error:', err);
  return fail('Internal server error', 500, 'INTERNAL');
}


