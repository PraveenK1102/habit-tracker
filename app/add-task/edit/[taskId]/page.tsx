import TaskForm from '@/components/task-form';

interface PageProps {
  params: { taskId: string };
}

export default function AddTaskPage({ params }: PageProps) {
  console.log('create', params.taskId);
  return <TaskForm mode="edit" taskId={params.taskId} />;
}
