import TaskForm from '@/components/task-form';
import { useSelector } from 'react-redux';

interface PageProps {
  params: { taskId: string };
}

export default function AddTaskPage({ params }: PageProps) {
  return <TaskForm mode="create" taskId={params.taskId} />;
}
