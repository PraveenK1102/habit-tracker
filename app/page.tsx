'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tag, Users } from 'lucide-react';
import { RootState } from '@/lib/store';
import { useSelector, useDispatch } from 'react-redux';
import { setCanShowSideBar, setTaskTrackingId, setSelectedDate } from '@/lib/features/tasksSlice';
import Calendar from '@/components/Calendar';
import { useRouter, useSearchParams } from 'next/navigation';
import { TaskData } from '@/lib/types';

export default function Home() {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const user = useSelector((state: RootState) => state.session.user);
  const taskMeta = useSelector((state: RootState) => state.tasks.taskmeta);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [highlightTaskId, setHighlightTaskId] = useState(searchParams.get('highlight'));
  
  const loadDetails = React.useCallback(async (date) => {
    if (!user) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/tasks/list?date=${encodeURIComponent(date)}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Error fetching tasks:', err?.error || res.statusText);
        setLoading(false);
        return;
      }

      const json = await res.json();
      const tasksData = json?.data || [];

      if (tasksData.length > 0) {
        const tasksDataWithMeta = tasksData.map((task: any) => {
          let obj = taskMeta.find(meta => meta.id === task.task_id) || { id: undefined }; 
          let { id, ...taskObj } = obj as any;
          return {
            ...task,
            ...taskObj
          } as TaskData;
        });
        setTasks(tasksDataWithMeta);
      } else {
        setTasks([]);
      }
    } catch (e) {
      console.error('Error fetching tasks:', (e as Error)?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user, taskMeta])

  useEffect(() => {
    loadDetails(currentDate);
  }, [currentDate]);

  useEffect(() => {
    if (highlightTaskId) {
      const timer = setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete('highlight');
        window.history.replaceState({}, '', url.toString());
        setHighlightTaskId('');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [highlightTaskId]);


  const handleTaskDetails = (taskId: string) => () => {
    dispatch(setCanShowSideBar(true));
    dispatch(setTaskTrackingId(taskId));
    dispatch(setSelectedDate(currentDate));
  }

  const onDateSelect = React.useCallback((dateStr: string) => {
    setCurrentDate(dateStr);
  }, [])
  return (
    <div className="px-4 overflow-x-hidden w-full bg-white dark:bg-black">
      <div className="flex flex-col space-y-5 flex-1 h-full">
        <div className="w-full py-2 lg:pt-4 pb-1 sticky bg-white dark:bg-black z-40 border-b border-gray-200 dark:border-gray-700 pb-4">
            <Calendar 
              onDateSelect={onDateSelect}
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              />
            <div className="flex items-center justify-between pt-1">
              <h1 className="text-sm font-bold">Your Tasks</h1>
              <Link 
                href="/add-task"
                className="px-2 py-1 md:px-4 md:py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm touch-manipulation"
                >
                Add New Habit
              </Link>
            </div>
          </div>

        <div className="flex-1 overflow-y-auto pb-5">
          {tasks.length === 0 && !loading ? (
            <div className="flex justify-center items-center text-base w-full h-32 lg:h-48 text-center px-4 flex-col">
              <p>No habits yet for the date - ready to <Link  href="/add-task" className="text-blue-500 underline">start</Link> one?</p>
            </div>
          ) : null}
          {loading ? (
            <div className="flex justify-center items-center text-sm w-full h-32 lg:h-48">
              Loading your habits...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {tasks.map((task) => {
                const isHighlighted = highlightTaskId === task.id;
                return (
                  <div key={task.id} className="w-full">
                    <div onClick={handleTaskDetails(task.id)}>
                      <div className={`flex flex-col rounded-lg shadow-lg hover:shadow-xl transition-all p-4 h-full h-[80px] md:min-h-[250px] cursor-pointer touch-manipulation ${
                        isHighlighted 
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 animate-pulse' 
                          : 'bg-white dark:bg-gray-800'
                      }`}>
                      <div className="flex justify-between pb-2">
                        <h2 
                          className="text-sm font-medium cursor-pointer text-gray-400 hover:underline line-clamp-2 mr-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/add-task/edit/${task.id}`);
                          }}
                        >
                          {task.task}
                        </h2>
                        <div className="flex gap-1 lg:gap-2 flex-shrink-0">
                          <span 
                            className="inline-flex items-center px-2 py-1 rounded-full font-medium"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {task.tags.length ?
                                task.tags.length > 1 ?
                                  `${task.tags.length} tags` : 
                                  task.tags[0] :
                                  <span className="text-gray-400 text-xs md:text-sm">No Tags</span>
                                }
                            </span>
                        </div>
                      </div>
                      <div className="flex lg:text-sm justify-between text-gray-500 dark:text-gray-400 mb-3">
                        <div className="flex">
                        </div>
                        <div className="flex items-center">
                          <Users className="h-3 lg:h-4 w-3 lg:w-4 mr-1" />
                          <span className="truncate text-xs md:text-sm">{task.friends.length} friends</span>
                        </div>
                      </div>
                      <p className="mt-auto lg:text-sm text-gray-600 dark:text-gray-300 line-clamp-3 lg:line-clamp-2">
                        {task.description}
                      </p>
                      {task.prefered_start_time && 
                        <div className="flex gap-1">
                          <small className="text-bold">
                            Prefered time - 
                          </small>
                          <small className="text-gray-600 dark:text-gray-300">
                            {task.prefered_start_time} - {task.prefered_end_time}
                          </small>
                        </div>
                      }
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}