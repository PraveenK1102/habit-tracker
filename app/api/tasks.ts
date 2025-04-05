import { createSupabaseServerClient } from '@/lib/supabaseServer'

function processDateQuery (date: string, taskFrequency: string) {
  console.error('processDateQuery', date, taskFrequency)
  if (taskFrequency === 'DAILY' || taskFrequency === 'WEEKLY') {
    const from = new Date(date)
    const to = new Date(date)
    if (taskFrequency === 'DAILY') {
      from.setHours(0, 0, 0, 0) // Set to the start of the day (12:00 AM)
      to.setHours(23, 59, 59, 999) // Set to the end of the day (11:59:59 PM)
    } else if (taskFrequency === 'WEEKLY') {
      from.setDate(from.getDate() - from.getDay()) // Get the start of the week (Sunday)
      from.setHours(0, 0, 0, 0) // Set to the start of the day (12:00 AM)
      to.setDate(from.getDate() + 6) // Get the end of the week (Saturday)
      to.setHours(23, 59, 59, 999) // Set to the end of the day (11:59:59 PM)
    }
    return {
      from,
      to
    }
    // query = query.gte('date', from.toISOString()).lte('date', to.toISOString())
  } else {
    throw new Error('Unsupported task frequency')
  }
}

export async function getTaskTrackingDetails(taskId: string, date: string) {
  const supabase = createSupabaseServerClient()
  
  const { data: taskData, error: taskError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (taskError) {
    throw new Error(`Error fetching task: ${taskError.message}`)
  }
  if (!taskData) {
    throw new Error('Task not found')
  }

  const { data, error } = await supabase
    .from('task_tracking')
    .select('*')
    .eq('task_id', taskId)
    .eq('date', date)
    .limit(2);

  if (error) {
    throw new Error(`Error fetching task tracking: ${error.message}`);
  }
  const createdTimeFormatted = new Date(taskData.created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  if (!data || data.length === 0) {
    return {
      tracking_details: {
        task_not_found: true,
        task_details: {
          ...taskData,
          created_at_formatted: createdTimeFormatted
        }      
      },
    };
  }
  if (data.length > 1) {
    throw new Error('Multiple rows returned for task tracking query');
  }
  const updatedTime = new Date(data[0].updated_at);

  const updatedTimeFormatted = updatedTime.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const formattedcreatedDate = new Date(data[0].date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return {
    tracking_details: {
      ...data[0],
      date_fromatted: formattedcreatedDate,
      updated_time: updatedTimeFormatted,
      task_details: {
        ...taskData,
        created_at_formatted: createdTimeFormatted
      }
    },
  };
}

interface TaskTrackingInput {
  task_id: string;
  date: string;
  value: number;
}

interface TaskTrackingUpdateInput extends TaskTrackingInput {
  id: string;
}

export async function createTaskTracking(input: TaskTrackingInput) {
  const supabase = createSupabaseServerClient();

  // First verify if the task exists
  const { data: taskData, error: taskError } = await supabase
  .from('tasks')
  .select('*')
  .eq('id', input.task_id)
  .single() // Since task_id is a primary key, we expect only one row

  if (taskError) {
    throw new Error(`Error fetching task: ${taskError.message}`)
  }

  if (!taskData) {
    throw new Error('Task not found')
  }

  const { data: existingTracking, error: checkError } = await supabase
    .from('task_tracking')
    .select('id')
    .eq('task_id', input.task_id)
    .eq('date', input.date)
    .single();

  if (existingTracking) {
    throw new Error('Task tracking already exists for this date');
  }

  const { data, error } = await supabase
    .from('task_tracking')
    .insert([
      {
        task_id: input.task_id,
        date: input.date,
        value: input.value,
        unit: taskData.unit
      }
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating task tracking: ${error.message}`);
  }

  return data;
}

export async function updateTaskTracking(input: TaskTrackingUpdateInput) {
  const supabase = createSupabaseServerClient();

  const { data: taskData, error: taskError } = await supabase
  .from('tasks')
  .select('*')
  .eq('id', input.task_id)
  .single() // Since task_id is a primary key, we expect only one row

  if (taskError) {
    throw new Error(`Error fetching task: ${taskError.message}`)
  }

  if (!taskData) {
    throw new Error('Task not found')
  }

  // Verify if the tracking record exists
  const { data: exists, error: checkError } = await supabase
    .from('task_tracking')
    .select('id')
    .eq('id', input.id)
    .single();

  if (checkError || !exists) {
    throw new Error('Task tracking record not found');
  }

  const { data, error } = await supabase
    .from('task_tracking')
    .update({
      task_id: input.task_id,
      date: input.date,
      value: input.value,
      unit: taskData.unit,
    })
    .eq('id', input.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating task tracking: ${error.message}`);
  }

  return data;
}