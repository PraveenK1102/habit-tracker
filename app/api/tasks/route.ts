import { NextResponse } from 'next/server';
import { getTaskTrackingDetails } from '../tasks';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('taskId')
  const date = searchParams.get('date')

  if (!taskId || !date) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    )
  }

  try {
    const data = await getTaskTrackingDetails(taskId, date)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// export async function POST(request: Request) {
//   try {
//     const body = await request.json();
    
//     // Validate required fields
//     if (!body.task_id || !body.date || body.value === undefined) {
//       return NextResponse.json(
//         { error: 'Missing required fields: task_id, date, and value are required' },
//         { status: 400 }
//       );
//     }

//     const data = await createTaskTracking({
//       task_id: body.task_id,
//       date: body.date,
//       value: body.value
//     });

//     return NextResponse.json(data);
//   } catch (error) {
//     return NextResponse.json(
//       { error: error instanceof Error ? error.message : 'Unknown error' },
//       { status: 500 }
//     );
//   }
// }

// export async function PUT(request: Request) {
//   try {
//     const body = await request.json();
    
//     // Validate required fields including id
//     if (!body.id || !body.task_id || !body.date || body.value === undefined) {
//       return NextResponse.json(
//         { error: 'Missing required fields: id, task_id, date, and value are required' },
//         { status: 400 }
//       );
//     }

//     const data = await updateTaskTracking({
//       id: body.id,
//       task_id: body.task_id,
//       date: body.date,
//       value: body.value
//     });

//     return NextResponse.json(data);
//   } catch (error) {
//     return NextResponse.json(
//       { error: error instanceof Error ? error.message : 'Unknown error' },
//       { status: 500 }
//     );
//   }
// }

export async function POST(request: Request) {
  try {
    // Check if request has body
    if (!request.body) {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      );
    }

    const data = await request.json();
    console.log('Received data:', data);
    
    const supabase = createSupabaseServerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Remove empty id field to let database auto-generate
    const { id, ...rawData } = data;
    
    // Map to the database schema - include fields that exist based on the error
    const taskData: any = {
      // Core fields from original schema
      from_date: rawData.from_date,
      to_date: rawData.to_date,
      tags: Array.isArray(rawData.tags) ? rawData.tags : [],
      description: rawData.description || '',
      
      // Fields that exist based on NOT NULL constraint errors
      task_frequency: rawData.task_frequency || 'DAILY',
      task_id: rawData.task_id || '',
      reminder_day: rawData.reminder_day || '',
      unit: rawData.unit || '',
      value: rawData.value || 0,
    };
    
    // Handle friends array properly
    if (rawData.friends) {
      taskData.friends = Array.isArray(rawData.friends) ? rawData.friends : [];
    }
    
    // Handle time fields as TEXT - store directly without conversion
    if (rawData.reminder_time) {
      taskData.reminder_time = rawData.reminder_time; // Store as-is (e.g., "11:31 PM")
    }
    
    if (rawData.prefered_start_time) {
      taskData.prefered_start_time = rawData.prefered_start_time; // Store as-is (e.g., "11:31 AM")
    }
    
    if (rawData.prefered_end_time) {
      taskData.prefered_end_time = rawData.prefered_end_time; // Store as-is (e.g., "11:31 PM")
    }
    
    // If we have a title field in the original schema, use description as title
    if (rawData.description) {
      taskData.title = rawData.description;
    }

    console.log('Processed task data:', taskData);
    console.log('Data types:', {
      prefered_start_time: typeof taskData.prefered_start_time,
      prefered_end_time: typeof taskData.prefered_end_time,
      reminder_time: typeof taskData.reminder_time,
      tags: Array.isArray(taskData.tags) ? 'array' : typeof taskData.tags,
      friends: Array.isArray(taskData.friends) ? 'array' : typeof taskData.friends
    });
    
    const insertData = {
      ...taskData,
      user_id: userData.user.id
    };
    
    console.log('Final insert data:', insertData);
    
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .insert(insertData)
      .select()
      .single();
      
    if (tasksError) {
      console.error('Supabase error:', tasksError);
      return NextResponse.json(
        { error: tasksError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data: tasksData ?? [] }, { status: 200 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: (error as Error)?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    console.log('PUT data:', data);
    
    const supabase = createSupabaseServerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Process the update data - map to original schema
    const rawData = { ...data };
    
    // Map to the database schema - include fields that exist based on the error
    const updateData: any = {
      // Core fields from original schema
      from_date: rawData.from_date,
      to_date: rawData.to_date,
      tags: Array.isArray(rawData.tags) ? rawData.tags : [],
      description: rawData.description || '',
      
      // Fields that exist based on NOT NULL constraint errors
      task_frequency: rawData.task_frequency || 'DAILY',
      task_id: rawData.task_id || '',
      reminder_day: rawData.reminder_day || '',
      unit: rawData.unit || '',
      value: rawData.value || 0,
    };
    
    // Handle friends array properly
    if (rawData.friends) {
      updateData.friends = Array.isArray(rawData.friends) ? rawData.friends : [];
    }
    
    // Handle time fields as TEXT - store directly without conversion
    if (rawData.reminder_time) {
      updateData.reminder_time = rawData.reminder_time; // Store as-is (e.g., "11:31 PM")
    }
    
    if (rawData.prefered_start_time) {
      updateData.prefered_start_time = rawData.prefered_start_time; // Store as-is (e.g., "11:31 AM")
    }
    
    if (rawData.prefered_end_time) {
      updateData.prefered_end_time = rawData.prefered_end_time; // Store as-is (e.g., "11:31 PM")
    }
    
    // If we have a title field in the original schema, use description as title
    if (rawData.description) {
      updateData.title = rawData.description;
    }
    
    console.log('Processed update data:', updateData);
    
    // Use the actual record ID from data.id
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .update({
        ...updateData,
        user_id: userData.user.id
      })
      .eq('id', data.id)
      .select();
    if (tasksError) {
      return NextResponse.json(
        { error: tasksError.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ data: tasksData ?? [] }, { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: (error as Error)?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
