import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import { email, password, safeOptionalText } from '@/lib/api/schemas';
import { fail, handleApiError, ok, readJsonValidated } from '@/lib/api/http';
import { getAuthUserByEmail } from '@/lib/api/authUserLookup';
import { getAdmin } from '@/lib/getAdmin';
import { getAppBaseUrl, getAppName, getAppSupportEmail } from '@/lib/common';

const admin = getAdmin();
const appName = getAppName();
const supportEmail = getAppSupportEmail();

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await readJsonValidated(
      request,
      z.object({
        email,
        password,
        name: safeOptionalText({ max: 120 }),
      })
    );

    // Admin pre-check: use Service Role to see if user already exists in auth

    if (admin !== null) {
      const { data: authUser, error: authUserError } = await getAuthUserByEmail(admin, body.email);
      if (!authUserError && authUser) {
        return NextResponse.json(
          { ok: false, error: 'Account already exists. Please sign in.', code: 'ALREADY_EXISTS' },
          { status: 409 }
        );
      }
    }

    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase.auth.signUp({ email: body.email, password: body.password });
    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (data.user && msg.includes('already') && msg.includes('registered')) {
        return NextResponse.json({ ok: false, error: 'User already exists', code: 'ALREADY_EXISTS' }, { status: 409 });
      }
      return NextResponse.json({ ok: false, error: error.message, code: 'SIGNUP_FAILED' }, { status: 400 });
    }
    if (data.session) {
      await supabase.auth.signOut();
    }

    // Ensure profile row exists; if creation fails, roll back auth user.
    if (!data.user) {
      return NextResponse.json({ ok: false, error: 'Sign up not configured', code: 'SIGNUP_NOT_CONFIGURED' }, { status: 500 });
    }

    const { error: upsertError } = await admin
      .from('profiles')
      .upsert(
        {
          user_id: data.user.id,
          email: data.user.email,
          name: body.name || 'User',
        },
        { onConflict: 'user_id' }
      );

    if (upsertError) {
      await admin.auth.admin.deleteUser(data.user.id);
      return NextResponse.json(
        { ok: false, error: `Sign up failed: ${upsertError.message}`, code: 'PROFILE_CREATE_FAILED' },
        { status: 500 }
      );
    }

    const appBaseUrl = getAppBaseUrl();
    const redirectTo = appBaseUrl ? `${appBaseUrl.replace(/\/$/, '')}/auth/callback` : undefined;

    const { data: confirmationLinkData, error: confirmationLinkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: data.user.email,
      options: redirectTo ? { redirectTo } : undefined,
    });

    if (!confirmationLinkError) {
      const actionLink = confirmationLinkData?.properties?.action_link;
      if (actionLink) {
        return ok(
          {
            sent: false,
            message: 'Confirmation email sent. Check your inbox and follow the link to confirm your account.',
            action_link: actionLink,
            app_name: appName,
            support_email: supportEmail,
          },
          200
        );
      }
      return fail('Unable to generate confirmation link.', 500, 'MISSING_LINK');
    } 

    const message = confirmationLinkError.message || 'Failed to generate confirmation link';
    const msg = message.toLowerCase();
    if (msg.includes('already confirmed')) {
      return fail('Email already confirmed. Please sign in.', 409, 'ALREADY_CONFIRMED');
    }
    if (msg.includes('rate') || msg.includes('too many')) {
      return fail('Please wait before requesting another email.', 429, 'RATE_LIMITED');
    }
    if (msg.includes('not found') || msg.includes('no user')) {
      return ok({ sent: true, message: 'If an account exists, a confirmation email was sent.' }, 200);
    }
    return fail(message, 400, 'CONFIRMATION_LINK_FAILED');
  } catch (error) {
    return handleApiError(error);
  }
}