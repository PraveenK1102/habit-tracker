'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSupabaseClient } from '@/lib/supabaseClient'
import { RootState } from '@/lib/store';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import taskData from '@/lib/data/health_tasks';
import { TaskData } from '@/lib/types';
// 1. Title -
// 2. Descriptions -
// 3. Associated Friends[] -
// 4. Task frequency - days | week
// 5. Reminder - If week  - get (day && time)
//            If month - get date and time
//            If date  - get time.
// 6. Accomplish Value - count [unit]/ selcted frequency
// 7. Task Active timeline - 

interface TaskFormProps {
  mode: 'create' | 'edit';
  taskId: string;
};

let modelData: {
  title?: string;
  units?: string[];
  default_target?: Record<string, number>;
  type?: string;
  color?: string;
  icon?: string;
  measurable?: boolean;
} = {};

const TaskForm: React.FC<TaskFormProps> = ({ mode, taskId }) => {
  const session = useSelector((state: RootState) => state.session.session);
  const user = useSelector((state: RootState) => state.session.user);
  const tasks = useSelector((state: RootState) => state.tasks.taskmeta);
  const supabase = useSupabaseClient();
  const router = useRouter();

  const [task, setTask] = useState<TaskData>({
    id: '',
    from_date: new Date().toISOString().split('T')[0],
    to_date: null,
    task_frequency: 'DAILY',
    reminder_day: '',
    reminder_time: '',
    tags: [],
    friends: [],
    description: '',
    unit: '',
    value: 0,
    task: ''
  });

  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isReminderEnabled, setIsReminderEnabled] = useState(false);

  const handleInputChange = ((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTag(e.target.value);
  });

  const handleEnterKeyInputSave = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };
  
  const loadDetails = async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    const selectedTask = tasks.find(task => task.id === data.task_id);  
    modelData = {
      title: selectedTask?.task ?? '',
      units: selectedTask?.units ?? [],
      default_target: selectedTask?.default_target ?? {},
      type: selectedTask?.type ?? '',
      color: selectedTask?.color ?? '',
      icon: selectedTask?.icon ?? '',
      measurable: selectedTask?.measurable ?? false,
    }
    setIsReminderEnabled(!!data.reminder_time);
    if (error) {
      console.error('Error fetching task:', error.message);
    } else if (data) {
      setTask(data);
    } else {
      console.warn('No task data found in this taskId.');
    }
    setLoading(false);
  }
  const setDetails = async (id: string ) => {
    const selectedTask = tasks.find(task => task.id === id);    
    setTask({
      id: '',
      task: '',
      from_date: new Date().toISOString().split('T')[0],
      to_date: null,
      task_frequency: 'DAILY',
      reminder_day: '',
      reminder_time: getTime(),
      tags: [],
      friends: [],
      description: '',
      unit: selectedTask?.units[0] ?? '',
      value: selectedTask?.default_target[selectedTask?.units[0]] ?? 0,
    });    
    modelData = {
      title: selectedTask?.task ?? '',
      units: selectedTask?.units ?? [],
      default_target: selectedTask?.default_target ?? {},
      type: selectedTask?.type ?? '',
      color: selectedTask?.color ?? '',
      icon: selectedTask?.icon ?? '',
      measurable: selectedTask?.measurable ?? false,
    }
  }
  useEffect(() => {    
    if (mode === 'create') {
      setDetails(taskId);
    } else if (mode === 'edit' && taskId) {
      loadDetails(taskId);
    }    
  }, [taskId, mode, modelData.title]); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!isReminderEnabled) {
      task.reminder_time = '';
      task.reminder_day = '';
    }
    delete task.task;
    if (mode === 'create') {
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...task,
            task_id: taskId,
          }),
        });
        const data = await response.json().catch((error) => console.error(error));
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to create task');
        }
        router.push('/add-task');
        console.info('Task created successfully');
      } catch (error) {
        console.error('Error creating task:', error.message);
      }
    } else {
      try {
        const response = await fetch('/api/tasks', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...task,
            task_id: taskId,
          }),
        });
        const data = await response.json().catch((error) => console.error(error));
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to update task');
        }
        router.push('/add-task');
        console.info('Task updated successfully');
      } catch (error) {
        console.error('Error updating task:', error.message);
      }
    }
        // delete task.task;
    // if (mode === 'create') {
    //   const { error } = await supabase
    //     .from('tasks')
    //     .insert({
    //       ...task,
    //       task_id: taskId,
    //       user_id: user.id,
    //     });
    
    //   if (error) {
    //     console.error('Error inserting task:', error.message);
    //   } else {
    //     router.push('/add-task');
    //     console.info('Task created successfully');
    //   }
    // } else {
    //   const { error } = await supabase
    //     .from('tasks')
    //     .update({
    //       ...task,
    //       user_id: user.id
    //     })
    //     .eq('id', taskId);
    
    //   if (error) {
    //     console.error('Error updating task:', error.message);
    //   } else {
    //     router.push('/add-task');
    //     console.log('Task updated successfully');
    //   }
    // }
  };  

  const addTag = () => {
    if (newTag && !task.tags.includes(newTag)) {
      setTask(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      setNewTag('');
    }
  };

  const getTime = () => {
    const date = new Date();
    const hours = date.getHours();
    if (hours < 10) {
      return `0${hours}:00`;
    }
    return `${hours}:00`;
  };

  const deleteTask = async () => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    if (error) {
      console.error('Error deleting task:', error.message);
    } else {
      router.push('/add-task');
      console.log('Task deleted successfully');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="lg:w-1/2 flex-1 lg:flex-none">
      <div className="bg-white dark:bg-gray-800 lg:rounded-lg shadow-lg p-8 flex flex-col h-full">
        <h1 className="font-bold mb-6 text-gray-900 dark:text-white mb-[40px]">
          Task - {modelData.title}
        </h1>

        <div className="flex flex-col gap-6 flex-1">
          {/* Task Frequency */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Task Frequency
            </label>
            <div className="flex gap-2"> 
              <select
                id="task_frequency"
                className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white basis-1/2"              
                value={task.task_frequency || 'DAILY'}
                onChange={e => setTask(prev => ({ ...prev, task_frequency: e.target.value as 'DAILY' | 'WEEKLY' }))}>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
              </select>
              {/* measurable value */}
              {modelData.measurable &&
                <>
                  <input
                    type="number"
                    id="value"
                    value={task.value}
                    onChange={e => setTask(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    placeholder="Value"
                    min={0}
                    className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white basis-1/4"
                  />
                  <select
                    id="unit"
                    className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white basis-1/4"                
                    value={task.unit}
                    onChange={e => {
                      const newUnit = e.target.value;
                      setTask(prev => ({
                        ...prev,
                        unit: newUnit,
                        value: modelData.default_target?.[newUnit] || 0
                      } as TaskData));
                    }}>
                      {modelData.units.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                  </select>
                </>
              }
            </div>
          </div>
          {/* Date Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                From Date
              </label>
              <input
                type="date"
                value={task.from_date}
                onChange={e => setTask(prev => ({ ...prev, from_date: e.target.value }))}
                className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                To Date
              </label>
              <input
                type="date"
                value={task.to_date}
                onChange={e => setTask(prev => ({ ...prev, to_date: e.target.value }))}
                className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          {/* Reminder section */}
          <div className="space-y-2 flex mt-4">
            <input
              type="checkbox"
              checked={isReminderEnabled}
              onChange={e => setIsReminderEnabled(e.target.checked)}
              className="w-5 h-5"
            />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 ms-2" style={{ marginTop: '0px' }}>
              Enable Reminder
            </label>
          </div>
          {isReminderEnabled && (
            <div className="flex flex-col md:flex-row items-center gap-6">
              {task.task_frequency === 'WEEKLY' && (
                <div className="space-y-2 w-full">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Which day we need to remind you
                  </label>
                  <select
                  id="reminder_day"
                  className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white"                value={task.reminder_day || ''}
                  onChange={e => setTask(prev => ({ ...prev, reminder_day: e.target.value as TaskData['reminder_day'] }))}>
                    <option value="MONDAY">Monday</option>
                    <option value="TUESDAY">Tuesday</option>
                    <option value="WEDNESDAY">Wednesday</option>
                    <option value="THURSDAY">Thursday</option>
                    <option value="FRIDAY">Friday</option>
                    <option value="SATURDAY">Saturday</option>
                    <option value="SUNDAY">Sunday</option>
                  </select>
                </div>
              )}
              <div className="space-y-2 w-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mr-[40px]">
                Time
                </label>
                <input
                  type="time"
                  value={task.reminder_time} // Default time set to 08:00 if reminder_time is not set
                  onChange={e => setTask(prev => ({ ...prev, reminder_time: e.target.value }))}
                  className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          )}
          {/* Description */}
          <div className="space-y-2 flex items-center row">
            <textarea
              id="description"
              value={task.description}
              onChange={e => setTask(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Task description"
              rows={1}
              className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white"
            />
          </div>
          {/* Tags Section */}
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-full flex gap-2">
                <input
                type="text"
                value={newTag}
                onChange={handleInputChange}
                onKeyDown={handleEnterKeyInputSave}
                placeholder="Add tag"
                className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white"
                />
                <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                Add
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {task.tags.map(tag => (
                <span 
                  key={tag} 
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTask(prev => ({
                      ...prev,
                      tags: prev.tags.filter(t => t !== tag)
                    }))}
                    className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-row gap-4 mt-auto">
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              {mode === 'create' ? 'Create Task' : 'Update Task'}
            </button>
            {mode === 'edit' && (
              <button
                type="button"
                className="w-full py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                onClick={deleteTask}
            >
                Delete Task
              </button>
            )}
          </div>
          
        </div>
      </div>
    </form>
  );
}

export default TaskForm;

