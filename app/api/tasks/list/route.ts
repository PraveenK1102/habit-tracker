export const dynamic = 'force-dynamic';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { requireUser } from '@/lib/api/auth';
import { fail, handleApiError, ok } from '@/lib/api/http';
import { dateOnly } from '@/lib/api/schemas';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) return fail('Missing required parameter: date', 400);
    const parsedDate = dateOnly.safeParse(date);
    if (!parsedDate.success) return fail(parsedDate.error.errors[0]?.message || 'Invalid date', 400);

    const supabase = createSupabaseServerClient();

    // Get authenticated user
    const user = await requireUser(supabase);

    // Query tasks
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .lte('from_date', parsedDate.data)
      .or(`to_date.gte.${parsedDate.data},to_date.is.null`)
      .order('created_at', { ascending: false });

    if (tasksError) {
      return handleApiError(tasksError);
    }

    return ok(tasksData ?? [], 200);
  } catch (error) {
    return handleApiError(error);
  }
}