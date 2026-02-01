import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import { fail, handleApiError, ok, readJsonValidated } from '@/lib/api/http';

const phoneSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  },
  z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number')
);

export async function POST(request: Request) {
  try {
    const body = await readJsonValidated(
      request,
      z.object({
        phone: phoneSchema,
        token: z.string().trim().min(4, 'Invalid code').max(12, 'Invalid code'),
      })
    );
    if (!body.phone) {
      return fail('Phone number is required', 400, 'PHONE_REQUIRED');
    }
    const supabase = createRouteHandlerClient({ cookies });
    const { data, error } = await supabase.auth.verifyOtp({
      phone: body.phone,
      token: body.token,
      type: 'sms',
    });
    if (error) {
      return fail(error.message || 'Invalid code', 400, 'OTP_VERIFY_FAILED');
    }
    if (data?.session) {
      await supabase.auth.signOut();
    }
    return ok({ verified: true, message: 'Phone confirmed. Please sign in.' }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
