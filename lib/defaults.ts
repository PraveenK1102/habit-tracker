import {TaskMetaProps, TaskProps, TaskTrackingDetails } from '@/lib/types';

export const taskMetaPropsDefaultValues: TaskMetaProps = {
  id: '',
  task: '',
  units: [],
  default_target: {},
  type: '',
  color: '',
  icon: '',
  measurable: false,
};

export const taskPropsDefaultValues: TaskProps = {
  id: '',
  task_id: '',
  from_date: '',
  to_date: '',
  task_frequency: 'DAILY',
  reminder_day: '',
  reminder_time: '',
  tags: [],
  friends: [],
  description: '',
  value: 0,
  created_at: '',
  updated_at: '',
  unit: '',
  user_id: '',
};

export const taskTrackingDetailsDefaultValues: TaskTrackingDetails = {
  id: '',
  taskId: '',
  value: 0,
  date: '',
  date_fromatted: '',
  updated_time: '',
  task_details: taskPropsDefaultValues,
  task_not_found: false,
}

const defaultValues = {
  taskMetaPropsDefaultValues,
  taskPropsDefaultValues,
  taskTrackingDetailsDefaultValues
};

export default defaultValues;