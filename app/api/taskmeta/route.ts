import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  try {
    const { data, error } = await supabase.from('taskmeta').select('*');
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    throw new Error((error as Error)?.message || 'Internal Server Error');
  }
}