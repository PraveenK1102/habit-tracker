import TaskForm from '@/components/task-form';

interface PageProps {
  params: { taskId: string };
}

export default function AddTaskPage({ params }: PageProps) {

  return <TaskForm mode="edit" taskId={params.taskId} />;
}
