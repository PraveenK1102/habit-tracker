'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Tag, Users } from 'lucide-react';
import { useSupabaseClient } from '@/lib/supabaseClient'
import { RootState } from '@/lib/store';
import { useSelector, useDispatch } from 'react-redux';
import { setCanShowSideBar, setTaskTrackingId, setSelectedDate } from '@/lib/features/tasksSlice';
import Calendar from '@/components/Calendar';
import { useRouter } from 'next/navigation';
import { TaskData } from '@/lib/types';

export default function Home() {
  const session = useSelector((state: RootState) => state.session.session);
  const user = useSelector((state: RootState) => state.session.user);
  const supabase = useSupabaseClient();
  const taskMeta = useSelector((state: RootState) => state.tasks.taskmeta);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [tasks, setTask] = useState<TaskData[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const router = useRouter();
  console.log('Home component loaded');
  console.log('loading: ', loading);
  console.log('tasks: ', tasks);
  console.log('currentDate: ', currentDate);
  
  const loadDetails = React.useCallback(async (date) => {
    // console.log('loading in loadDetails: ', loading);
    
    // if (!loading) {
    //   setLoading(true);
    // }
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .lte('from_date', date)
      .or(`to_date.gte.${date},to_date.is.null`)
      .order('created_at', { ascending: false });  

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError.message);
      setLoading(false);
      return;
    } 

    if (tasksData && tasksData.length > 0) {
      const tasksDataWithMeta = tasksData.map(task => {
        let obj = taskMeta.find(meta => meta.id === task.task_id) || { id: undefined }; 
        let { id, ...taskObj } = obj;
        return {
          ...task,
          ...taskObj
        }
      });
      setTask(tasksDataWithMeta);
    } else {
      setTask([]);
    }
    // setLoading(false);
  }, [])

  useEffect(() => {
    loadDetails(currentDate);
  }, [currentDate]);


  const handleTaskDetails = (taskId: string) => () => {
    dispatch(setCanShowSideBar(true));
    dispatch(setTaskTrackingId(taskId));
    dispatch(setSelectedDate(currentDate));
  }

  const handleCloseSideBar = () => {
    dispatch(setCanShowSideBar(false));
    dispatch(setTaskTrackingId(''));
  }

  const onDateSelect = React.useCallback((dateStr: string) => {
    setCurrentDate(dateStr);
    loadDetails(dateStr);
  }, [])
  return (
    <div className="px-8 overflow-x-hidden">
      <div className="flex flex-col space-y-4 flex-1">
        <div className="w-full py-4 sticky top-0 bg-white dark:bg-black z-10">
            <Calendar 
              onDateSelect={onDateSelect}
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              />
            <div className="flex items-center justify-between py-4">
              <h1 className="text-lg font-bold">Your Health Tasks</h1>
              <Link 
                href="/add-task"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-xs"
                >
                Add New Task
              </Link>
            </div>
          </div>

        <div className="flex flex-1 flex-wrap items-center">
          {tasks.length === 0 && !loading ? (
            <div className="flex justify-center items-center text-lg w-full">
              You have no tasks. Click the button above to add a new task.
            </div>
          ) : null}
          {loading ? (
            <div className="flex justify-center items-center text-lg w-full">
              Loading...
            </div>
          ) : (
            <>
              {tasks.map((task) => (
                <div className="mx-4 w-64 my-4" key={task.id}>
                  <div onClick={handleTaskDetails(task.id)} className="block">
                    <div className="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-lg transition-shadow p-4 min-h-[250px]">
                      <div className="flex justify-between pb-2">
                        <h2 
                          className="text-lg font-medium cursor-pointer text-blue-500 hover:underline"
                          onClick={() => router.push(`/add-task/edit/${task.id}`)}
                        >
                          {task.task}
                        </h2>
                        <div className="flex gap-2">
                          <span 
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {task.tags.length ?
                                task.tags.length > 1 ?
                                  `${task.tags.length} tags` : 
                                  task.tags[0] :
                                'No Tags'}
                            </span>
                        </div>
                      </div>
                      <div className="flex text-sm justify-between text-gray-500 dark:text-gray-400">
                        <div className="flex">
                          {/* <Clock className="h-4 w-4 mr-1" />
                          {task.reminder_time.join(', ')} */}
                        </div>
                        <div className="flex">
                          <Users className="h-4 w-4 mr-1" />
                          {task.friends.length} friends
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {task.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}