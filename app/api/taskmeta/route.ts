import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { requireUser } from '@/lib/api/auth';
import { handleApiError, ok } from '@/lib/api/http';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    await requireUser(supabase);
    const { data, error } = await supabase.from('taskmeta').select('*');
    if (error) {
      return handleApiError(error);
    }
    return ok(data ?? [], 200);
  } catch (error) {
    return handleApiError(error);
  }
}