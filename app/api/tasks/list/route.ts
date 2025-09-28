import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Missing required parameter: date' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Get authenticated user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Query tasks
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userData.user.id)
      .lte('from_date', date)
      .or(`to_date.gte.${date},to_date.is.null`)
      .order('created_at', { ascending: false });

    if (tasksError) {
      return NextResponse.json(
        { error: tasksError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: tasksData ?? [] }, { status: 200 });
  } catch (error) {
    // Let Next.js handle unexpected errors
    throw new Error((error as Error)?.message || 'Internal Server Error');
  }
}