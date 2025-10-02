import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const { taskId, date, value = 1 } = await request.json();
    
    if (!taskId || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: taskId and date' },
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

    // Check if task tracking already exists for this date
    const { data: existingTracking, error: checkError } = await supabase
      .from('task_tracking')
      .select('*')
      .eq('task_id', taskId)
      .eq('date', date)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing tracking:', checkError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    let result;
    
    if (existingTracking) {
      // Update existing tracking
      const { data, error } = await supabase
        .from('task_tracking')
        .update({ 
          value,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTracking.id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating task tracking:', error);
        return NextResponse.json(
          { error: 'Failed to update task completion' },
          { status: 500 }
        );
      }
      
      result = data;
    } else {
      // Create new tracking entry
      const { data, error } = await supabase
        .from('task_tracking')
        .insert({
          task_id: taskId,
          date,
          value,
          user_id: userData.user.id
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating task tracking:', error);
        return NextResponse.json(
          { error: 'Failed to create task completion' },
          { status: 500 }
        );
      }
      
      result = data;
    }

    return NextResponse.json({ 
      success: true, 
      data: result,
      message: 'Task completed successfully!'
    });
    
  } catch (error) {
    console.error('Task completion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
