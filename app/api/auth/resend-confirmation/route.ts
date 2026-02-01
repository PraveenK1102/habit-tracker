// import { cookies } from 'next/headers';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import { email } from '@/lib/api/schemas';
import { fail, handleApiError, ok, readJsonValidated } from '@/lib/api/http';
import { getAuthUserByEmail, getProfileByUserId } from '@/lib/api/authUserLookup';
import { getAdmin } from '@/lib/getAdmin';  
import { getAppName, getAppSupportEmail, getAppBaseUrl } from '@/lib/common';
import { validateConfirmationEmail } from '@/lib/email/validateConfirmationEmail';
// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const appName = getAppName();
    const supportEmail = getAppSupportEmail();
    const appBaseUrl = getAppBaseUrl();
    const admin = getAdmin();
    if (admin === null) {
      return fail('Service role key not configured', 500, 'MISSING_SERVICE_ROLE');
    }
    const redirectTo = appBaseUrl ? `${appBaseUrl.replace(/\/$/, '')}/auth/callback` : undefined;
    const body = await readJsonValidated(
      request,
      z.object({
        email,
      })
    );

    const { data: authUser, error: authUserError } = await getAuthUserByEmail(admin, body.email);

    if (!authUserError && !authUser) {
      return fail('Account not found. Please sign up first.', 404, 'USER_NOT_FOUND');
    }

    if (!authUserError && authUser) {
      const { data: profile } = await getProfileByUserId(admin, authUser.id);
      if (!profile) {
        await admin.auth.admin.deleteUser(authUser.id);
        return fail('Account incomplete. Please sign up again.', 409, 'PROFILE_MISSING');
      }
    }

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: body.email,
      options: redirectTo ? { redirectTo } : undefined,
    });
    return validateConfirmationEmail(error, data?.properties?.action_link);

    // Need to configure SMTP in supabase to resend confirmation email and remove the above code.

    // const supabase = createRouteHandlerClient({ cookies });
    // const { error: resendError } = await supabase.auth.resend({
    //   type: 'signup',
    //   email: body.email,
    //   options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    // });

    // if (resendError) {
    //   const message = resendError.message || 'Failed to resend confirmation email';
    //   const msg = message.toLowerCase();
    //   if (msg.includes('already confirmed')) {
    //     return fail('Email already confirmed. Please sign in.', 409, 'ALREADY_CONFIRMED');
    //   }
    //   if (msg.includes('rate') || msg.includes('too many')) {
    //     return fail('Please wait before requesting another email.', 429, 'RATE_LIMITED');
    //   }
    //   if (msg.includes('not found') || msg.includes('no user')) {
    //     return ok({ sent: true, message: 'If an account exists, a confirmation email was sent.' }, 200);
    //   }
    //   return fail(message, 400, 'RESEND_FAILED');
    // }

  } catch (error) {
    return handleApiError(error);
  }
}
