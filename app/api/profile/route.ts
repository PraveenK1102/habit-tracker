import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  try {
    const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userData.user.id)
    .single();
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    throw new Error((error as Error)?.message || 'Internal Server Error');
  }
  
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();

    const { data } = await request.json();
    // Need Validation for the data before upserting
    const { error } = await supabase
      .from('profiles')
      .upsert(
        data,
        { onConflict: 'user_id' }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    throw new Error((error as Error)?.message || 'Internal Server Error');
  }
}