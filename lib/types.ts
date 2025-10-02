export type TaskMetaProps = {
  id: string;
  task: string;
  units: string[];
  default_target: Record<string, number>;
  type: string;
  color: string;
  icon: string;
  measurable: boolean;
};

export type TaskProps = {
  id: string;
  task_id: string;
  from_date: string;
  to_date: string;
  task_frequency: string;
  reminder_day: string;
  reminder_time: string;
  tags: string[];
  friends: string[];
  description: string;
  value: number;
  created_at_formatted?: string; // Add this field
  created_at: string;
  updated_at: string;
  unit: string;
  user_id: string;
};

export type TaskTrackingDetails = {
  id: string;
  taskId: string;
  value: number;
  date: string;
  date_fromatted?: string; // Add this field
  updated_time: string;
  task_details: TaskProps;
  task_not_found?: boolean;
};

export type TaskData = {
  id: string;
  task: string;
  from_date: string;
  to_date: string;
  task_frequency: 'DAILY' | 'WEEKLY';
  reminder_day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY' | '';
  reminder_time: string;
  prefered_start_time: string;
  prefered_end_time: string;
  tags: string[];
  friends: string[];
  description?: string;
  value: number;
  unit: string;
};
