import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { requireUser } from '@/lib/api/auth';
import { fail, handleApiError, ok, readJsonValidated } from '@/lib/api/http';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const body = await readJsonValidated(
      request,
      z.object({
        task_id: z.string().trim().min(1),
        date: z.string().trim().min(1),
        value: z.number().optional(),
        unit: z.string().trim().max(50).optional(),
      })
    );
    const value = body.value ?? 1;
    const supabase = createSupabaseServerClient();
    const user = await requireUser(supabase);

    const { data: taskRow, error: taskErr } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', body.task_id)
      .eq('user_id', user.id)
      .single();

    if (taskErr || !taskRow) {
      return fail('Task not found or access denied', 404);
    }    
    const { data: existingTracking, error: checkError } = await supabase
      .from('task_tracking')
      .select('*')
      .eq('task_id', body.task_id)
      .eq('date', body.date)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing tracking:', checkError);
      return fail('Database error', 500);
    }    
    let result = {
      data: {}
    };
    if (existingTracking) {
      const { data: taskTrackingData, error } = await supabase
        .from('task_tracking')
        .update({ 
          value,
          updated_at: new Date().toISOString(),
          unit: body.unit
        })
        .eq('id', existingTracking.id)
        .eq('task_id', body.task_id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating task tracking:', error);
        return fail('Failed to update task completion', 500);
      }
      result = taskTrackingData;
    } else {
      const { data: taskTrackingData, error } = await supabase
        .from('task_tracking')
        .insert({
          task_id: body.task_id,
          date: body.date,
          value,
          unit: body.unit
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating task tracking:', error);
        return fail('Failed to create task completion', 500);
      }
      result = taskTrackingData;
    }
    return ok(
      {
        success: true,
        data: result.data,
        message: 'Task completed successfully!',
      },
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
