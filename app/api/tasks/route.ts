import { getTaskTrackingDetails } from '../tasks';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { z } from 'zod';
import { requireUser } from '@/lib/api/auth';
import { fail, handleApiError, ok, readJsonValidated } from '@/lib/api/http';
import { dateOnly, reminderDay, safeOptionalText, safeText, stringList, taskFrequency } from '@/lib/api/schemas';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const date = searchParams.get('date');
    const id = searchParams.get('id');

    const supabase = createSupabaseServerClient();
    const user = await requireUser(supabase);

    // Branch 1: fetch a single task row by id (edit screen)
    if (id) {

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) return handleApiError(error);
      return ok(data, 200);
    }

    // Branch 2: fetch tracking details for a task+date (sidebar)
    if (!taskId || !date) {
      return fail('Missing required parameters: taskId and date (or provide id)', 400);
    }
    const parsedDate = dateOnly.safeParse(date);
    if (!parsedDate.success) return fail(parsedDate.error.errors[0]?.message || 'Invalid date', 400);

    const data = await getTaskTrackingDetails(taskId, parsedDate.data, user.id);
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
        // ignore client id; DB generates UUID
        task_id: safeText({ max: 100 }),
        from_date: dateOnly.optional(),
        to_date: z.preprocess((v) => (v === '' || v === undefined ? null : v), dateOnly.nullable().optional()),
        task_frequency: taskFrequency.optional(),
        reminder_day: reminderDay.optional(),
        reminder_time: safeOptionalText({ max: 50 }),
        prefered_start_time: safeOptionalText({ max: 50 }),
        prefered_end_time: safeOptionalText({ max: 50 }),
        tags: stringList(50, 40).optional(),
        friends: stringList(50, 80).optional(),
        description: safeOptionalText({ max: 2000 }),
        unit: safeOptionalText({ max: 30 }),
        value: z.number().min(0).max(100000).optional(),
      })
    );

    // Business rule: infinite tasks => to_date NULL, but if to_date present must be >= from_date
    const fromDate = body.from_date ?? new Date().toISOString().split('T')[0];
    if (body.to_date && body.to_date < fromDate) return fail('to_date must be >= from_date', 400);
    
    // Map to the database schema - include fields that exist based on the error
    const taskData: any = {
      // Core fields from original schema - handle date mapping
      from_date: fromDate,
      // IMPORTANT: empty/omitted to_date means "infinite" => store NULL, don't default to today
      to_date: body.to_date ?? null,
      tags: body.tags ?? [],
      description: body.description || '',

      // Fields that exist based on NOT NULL constraint errors
      task_frequency: body.task_frequency || 'DAILY',
      task_id: body.task_id,
      reminder_day: body.reminder_day || '',
      unit: body.unit || '',
      value: body.value ?? 0,
    };
    
    // Handle friends array properly
    taskData.friends = body.friends ?? [];
    
    // Handle time fields as TEXT - store directly without conversion
    if (body.reminder_time) taskData.reminder_time = body.reminder_time;
    if (body.prefered_start_time) taskData.prefered_start_time = body.prefered_start_time;
    if (body.prefered_end_time) taskData.prefered_end_time = body.prefered_end_time;
    
    // If we have a title field in the original schema, use description as title
    // if (rawData.description) {
    //   taskData.title = rawData.description;
    // }

    const insertData = {
      ...taskData,
      user_id: user.id
    };

    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .insert(insertData)
      .select()
      .single();
      
    if (tasksError) {
      return handleApiError(tasksError);
    }
    
    return ok(tasksData, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
export async function PUT(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const user = await requireUser(supabase);

    const body = await readJsonValidated(
      request,
      z.object({
        id: safeText({ max: 100 }).optional(),
        task_id: safeText({ max: 100 }).optional(),
        from_date: dateOnly.optional(),
        to_date: z.preprocess((v) => (v === '' || v === undefined ? null : v), dateOnly.nullable().optional()),
        task_frequency: taskFrequency.optional(),
        reminder_day: reminderDay.optional(),
        reminder_time: safeOptionalText({ max: 50 }),
        prefered_start_time: safeOptionalText({ max: 50 }),
        prefered_end_time: safeOptionalText({ max: 50 }),
        tags: stringList(50, 40).optional(),
        friends: stringList(50, 80).optional(),
        description: safeOptionalText({ max: 2000 }),
        unit: safeOptionalText({ max: 30 }),
        value: z.number().min(0).max(100000).optional(),
      })
    );

    // First, verify the task exists and belongs to the user
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', body.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingTask) {
      return fail('Task not found or access denied', 404);
    }

    const nextFrom = body.from_date ?? existingTask.from_date;
    const nextTo = body.to_date ?? existingTask.to_date ?? null;
    if (nextTo && nextTo < nextFrom) return fail('to_date must be >= from_date', 400);
   
    // Update the task - don't use .single() to avoid the RLS issue
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .update({
        value: body.value ?? existingTask.value,
        unit: body.unit ?? existingTask.unit,
        from_date: nextFrom,
        to_date: nextTo,
        tags: body.tags ?? existingTask.tags,
        description: body.description ?? existingTask.description,
        task_frequency: body.task_frequency ?? existingTask.task_frequency,
        reminder_day: body.reminder_day ?? existingTask.reminder_day,
        prefered_start_time: body.prefered_start_time ?? existingTask.prefered_start_time,
        prefered_end_time: body.prefered_end_time ?? existingTask.prefered_end_time,
        reminder_time: body.reminder_time ?? existingTask.reminder_time,
        friends: body.friends ?? existingTask.friends,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .eq('user_id', user.id)
      .select();

    if (tasksError) {
      return handleApiError(tasksError);
    }

    if (!tasksData || tasksData.length === 0) {
      return fail('No rows updated', 404);
    }

    return ok(tasksData[0], 200);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const user = await requireUser(supabase);

    const body = await readJsonValidated(request, z.object({ id: safeText({ max: 100 }).optional() }));

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', body.id)
      .eq('user_id', user.id);

    if (error) {
      return handleApiError(error);
    }

    return ok({ success: true }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
