import { z } from 'zod';
import { fail, handleApiError, ok, readJsonValidated } from '@/lib/api/http';
import { getAdmin } from '@/lib/getAdmin';
// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await readJsonValidated(
      request,
      z.object({
        accessToken: z.string().min(10),
      })
    );

    const admin = getAdmin();
    if (admin === null) {
      return fail('Service role key not configured', 500, 'MISSING_SERVICE_ROLE');
    }
    const { data: userData, error: userError } = await admin.auth.getUser(body.accessToken);
    if (userError || !userData?.user) {
      return ok({ confirmed: false, message: 'Unable to identify user.' }, 200);
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(userData.user.id, {
      email_confirm: true,
    });
    if (updateError) {
      return ok({ confirmed: false, message: updateError.message }, 200);
    }

    return ok({ confirmed: true }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
