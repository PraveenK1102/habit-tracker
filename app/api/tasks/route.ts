import { NextResponse } from 'next/server';
import { getTaskTrackingDetails } from '../tasks';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

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
    const { id, ...taskData } = data;
    
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        user_id: userData.user.id
      })
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
    
    // Use the actual record ID from data.id
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .update({
        ...data,
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
