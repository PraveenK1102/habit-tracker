import { z } from 'zod';
import { email } from '@/lib/api/schemas';
import { fail, handleApiError, ok, readJsonValidated } from '@/lib/api/http';
import { getAuthUserByEmail, getProfileByUserId } from '@/lib/api/authUserLookup';
import { getAdmin } from '@/lib/getAdmin';
import { getAppName, getAppSupportEmail, getAppBaseUrl } from '@/lib/common';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await readJsonValidated(
      request,
      z.object({
        email,
      })
    );

    const appName = getAppName();
    const supportEmail = getAppSupportEmail();
    const appBaseUrl = getAppBaseUrl();
    const redirectTo = appBaseUrl ? `${appBaseUrl.replace(/\/$/, '')}/reset-password` : undefined;

    const admin = getAdmin();
    if (admin === null) {
      return fail('Service role key not configured', 500, 'MISSING_SERVICE_ROLE');
    }
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
      type: 'recovery',
      email: body.email,
      options: redirectTo ? { redirectTo } : undefined,
    });

    if (error) {
      const message = error.message || 'Failed to generate reset link';
      const msg = message.toLowerCase();
      if (msg.includes('not found') || msg.includes('no user')) {
        return ok({ sent: true, message: 'If an account exists, a reset email was sent.' }, 200);
      }
      return fail(message, 400, 'RESET_FAILED');
    }

    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      return fail('Unable to generate reset link.', 500, 'MISSING_LINK');
    }

    return ok(
      {
        sent: false,
        message: 'Reset link generated.',
        action_link: actionLink,
        app_name: appName,
        support_email: supportEmail,
      },
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
