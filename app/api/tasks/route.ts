import { NextResponse } from 'next/server';
import { getTaskTrackingDetails, createTaskTracking, updateTaskTracking } from '../tasks';

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
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.task_id || !body.date || body.value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: task_id, date, and value are required' },
        { status: 400 }
      );
    }

    const data = await createTaskTracking({
      task_id: body.task_id,
      date: body.date,
      value: body.value
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields including id
    if (!body.id || !body.task_id || !body.date || body.value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: id, task_id, date, and value are required' },
        { status: 400 }
      );
    }

    const data = await updateTaskTracking({
      id: body.id,
      task_id: body.task_id,
      date: body.date,
      value: body.value
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}