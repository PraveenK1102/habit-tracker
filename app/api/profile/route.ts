import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { z } from 'zod';
import { requireUser } from '@/lib/api/auth';
import { handleApiError, ok, readJsonValidated } from '@/lib/api/http';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const user = await requireUser(supabase);
    const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
    if (error) {
        return handleApiError(error);
    }
    return ok(data, 200);
  } catch (error) {
    return handleApiError(error);
  }
  
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const user = await requireUser(supabase);

    const body = await readJsonValidated(
      request,
      z.object({
        data: z.object({
          user_id: z.string().optional(),
          name: z.string().trim().max(120).optional(),
          email: z.string().trim().max(254).optional(),
          age: z.union([z.string(), z.number()]).optional(),
          gender: z.string().trim().max(30).optional(),
          theme: z.string().trim().max(30).optional(),
          image: z.string().trim().max(5000).optional(),
        }),
      })
    );

    // Server is the source of truth: never trust `user_id` from client
    const data = { ...body.data, user_id: user.id };

    const { error } = await supabase
      .from('profiles')
      .upsert(
        data,
        { onConflict: 'user_id' }
      );

    if (error) {
      return handleApiError(error);
    }

    return ok({ success: true }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}