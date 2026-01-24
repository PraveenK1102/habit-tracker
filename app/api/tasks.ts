import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { ApiError } from '@/lib/api/errors'

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

  } else {
    throw new ApiError('Unsupported task frequency', 400, 'UNSUPPORTED_FREQUENCY')
  }
}

export async function getTaskTrackingDetails(taskId: string, date: string, userId: string) {
  const supabase = createSupabaseServerClient()
  
  const { data: taskData, error: taskError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single();

  if (taskError) {
    throw new ApiError(`Error fetching task: ${taskError.message}`, 500, 'TASK_FETCH_FAILED')
  }
  if (!taskData) {
    throw new ApiError('Task not found', 404, 'TASK_NOT_FOUND')
  }

  const { data, error } = await supabase
    .from('task_tracking')
    .select('*')
    .eq('task_id', taskId)
    .eq('date', date)
    .limit(2);

  if (error) {
    throw new ApiError(`Error fetching task tracking: ${error.message}`, 500, 'TRACKING_FETCH_FAILED');
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
    throw new ApiError('Multiple rows returned for task tracking query', 500, 'DATA_INTEGRITY');
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
      date_formatted: formattedcreatedDate,
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