'use client'

import { useEffect, useState, useRef } from 'react'
import { useSupabaseClient } from '@/lib/supabaseClient';
import { useSelector, useDispatch } from 'react-redux';
import { TaskMetaProps, TaskTrackingDetails } from '@/lib/types';
import { taskTrackingDetailsDefaultValues, taskMetaPropsDefaultValues } from '@/lib/defaults';
import { setCanShowSideBar, setTaskTrackingId, setSelectedDate } from '@/lib/features/tasksSlice';
import { convertUnit } from '@/lib/convertion';
import { RootState } from '@/lib/store';

export default function SideBar(props: { taskId: string; date: string}) {
  let { taskId, date } = props;
  const [taskTrackingDetails, setTaskTrackingDetails] = useState<TaskTrackingDetails>(taskTrackingDetailsDefaultValues);
  const [currentTaskMeta, setCurrentTaskMeta] = useState<TaskMetaProps>(taskMetaPropsDefaultValues);
  const tasks = useSelector((state: RootState) => state.tasks.taskmeta);
  let debounceTimeOut = useRef(null);
  const dispatch = useDispatch();
  const [isTaskCompleted, setIsTaskCompleted] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [previousTaskID, setPreviousTaskID] = useState<string>('');
  const [previousParentTaskID, setParentPreviousTaskID] = useState<string>('');
  const [previousParentTaskDate, setPreviousParentTaskDate] = useState<string>('');
  useEffect(() => {
    const fetchTaskTrackingDetails = async () => {
      setLoading(true);
      date ??= new Date().toISOString();
      try {
        const response = await fetch(
          `/api/tasks?taskId=${taskId}&date=${date}`
        )
        const data = await response.json();
        const { 
          tracking_details,
          tracking_details: {
            task_not_found: taskNotFound = false,
            task_details: {
              task_id = ''
            } = {},
          } = {}
        } = data;
        
        const currentTaskMeta = tasks.find(task => task.id === task_id);
        setCurrentTaskMeta(currentTaskMeta);
        
        if (currentTaskMeta) {
          if (taskNotFound) {
            populateTaskTrackingDetails(tracking_details)
          } else {
            if (tracking_details.task_details.unit !== tracking_details.unit) {
              tracking_details.value = convertUnit(tracking_details.value, tracking_details.unit, tracking_details.task_details.unit);
              tracking_details.unit = tracking_details.task_details.unit;
            }
            if (tracking_details.value >= tracking_details.task_details.value) {
              setIsTaskCompleted(true);
            } else {
              setIsTaskCompleted(false);
            }
            setTaskTrackingDetails(tracking_details)
          }
        } else {
          console.error('Task not found in Redux store');
        }
      } catch (error) {
        console.error('Error fetching task tracking details:', error.message || 'Unknown error')
      } finally {
        setLoading(false);
      }
    }
    fetchTaskTrackingDetails()
  }, [taskId, date])

  const fetchTaskTrackingDetails = async () => {
    setLoading(true);
    date ??= new Date().toISOString();
    try {
      const response = await fetch(
        `/api/tasks?taskId=${taskId}&date=${date}`
      )
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error)
      }
      const { 
        tracking_details,
        tracking_details: {
          task_not_found: taskNotFound = false,
          task_details: {
            task_id = ''
          } = {},
        } = {}
      } = data;
        
      const currentTaskMeta = tasks.find(task => task.id === task_id);
      setCurrentTaskMeta(currentTaskMeta);

      if (currentTaskMeta) {
        if (tracking_details.task_details.unit !== tracking_details.unit) {
          tracking_details.value = convertUnit(tracking_details.value, tracking_details.unit, tracking_details.task_details.unit);
          tracking_details.unit = tracking_details.task_details.unit;
        }
        if (tracking_details.value >= tracking_details.task_details.value) {
          tracking_details.value = tracking_details.task_details.value;
          setIsTaskCompleted(true);
        } else {
          setIsTaskCompleted(false);
        }
        if (taskNotFound) {
          populateTaskTrackingDetails(tracking_details)
        } else {
          setTaskTrackingDetails(tracking_details)
        }
      } else {
        console.error('Task not found in Redux store');
      }
    } catch (error) {
      console.error('Error fetching task tracking details:', error.message || 'Unknown error')
    } finally {
      setLoading(false);
    }
  }

  const populateTaskTrackingDetails = (trackingDetails) => {
    const newTaskTrackingDetails = {
      ...taskTrackingDetailsDefaultValues,
      task_details: trackingDetails.task_details
    };
    setTaskTrackingDetails(newTaskTrackingDetails);
  };

  const testCreateTracking = async (value: number) => {    
    // Safety check
    if (!taskTrackingDetails.task_details || !taskTrackingDetails.task_details.unit) {
      console.error('taskTrackingDetails.task_details or unit is undefined:', {
        taskTrackingDetails,
        task_details: taskTrackingDetails.task_details,
        unit: taskTrackingDetails.task_details?.unit
      });
      return;
    }
    
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: taskId,
          date: date,
          value,
          unit: taskTrackingDetails.task_details.unit,
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }

    } catch (error) {
      console.error('Error creating tracking:', error.message || 'Unknown error');
    } finally {
      fetchTaskTrackingDetails();
    }
  };

  const testUpdateTracking = async (value: number) => {        
    if (!taskTrackingDetails.id) {
      console.error('No tracking ID available to update');
      return;
    }

    // Safety check
    if (!taskTrackingDetails.task_details || !taskTrackingDetails.task_details.unit) {
      console.error('taskTrackingDetails.task_details or unit is undefined:', {
        taskTrackingDetails,
        task_details: taskTrackingDetails.task_details,
        unit: taskTrackingDetails.task_details?.unit
      });
      return;
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: taskTrackingDetails.id,
          task_id: taskId,
          date: date,
          value,
          unit: taskTrackingDetails.task_details.unit,
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }

    } catch (error) {
      console.error('Error updating tracking:', error.message || 'Unknown error');
    }
  };

  const updateValue = (value: number, taskTrackingDetails) => {
    if (taskTrackingDetails.id) {
      testUpdateTracking(value);
    } else {
      testCreateTracking(value);
    }
  };

  const processUpdate = (value: number, taskTrackingDetails) => {
    if (value >= taskTrackingDetails.task_details.value) {
      value = taskTrackingDetails.task_details.value;
      setTaskTrackingDetails((prev) => ({
        ...prev,
        value: taskTrackingDetails.task_details.value
      }));
      setIsTaskCompleted(true);
    } else {
      setIsTaskCompleted(false);
    }
    if (debounceTimeOut.current 
      && (previousTaskID === taskTrackingDetails.id 
        || (taskTrackingDetails.task_details.id === previousParentTaskID 
          && taskTrackingDetails.date === previousParentTaskDate))) {
      clearTimeout(debounceTimeOut.current);
    }
    setPreviousTaskID(taskTrackingDetails.id);
    setParentPreviousTaskID(taskTrackingDetails.task_details.id);
    setPreviousParentTaskDate(taskTrackingDetails.date);
    debounceTimeOut.current = setTimeout(() => {
      updateValue(value, taskTrackingDetails);
    }, 3000);
    
  };

  const increaseTaskValue = async () => {
    let adddedValue = 0;
    const currentValue = Math.ceil(taskTrackingDetails.value);
    if (currentValue >= 5000) {
      adddedValue = currentValue + 500;
    } else if (currentValue >= 1000) {
      adddedValue = currentValue + 200;
    } else {
      adddedValue = currentValue + (Math.floor(currentValue / 100) + 1);
    }
    setTaskTrackingDetails((prev) => ({
      ...prev,
      value: adddedValue
    }));
    processUpdate(adddedValue, taskTrackingDetails);
  };
  const decreaseTaskValue = async () => {    
    let removedValue = 0;
    const currentValue = Math.floor(taskTrackingDetails.value);
    if (currentValue >= 5000) {
      removedValue = currentValue - 500;
    } else if (currentValue >= 1000) {
      removedValue = currentValue - 200;
    } else {
      removedValue = currentValue - (Math.floor(currentValue / 100) + 1);
    }
    setTaskTrackingDetails((prev) => ({
      ...prev,
      value: removedValue
    }));
    processUpdate(removedValue, taskTrackingDetails);
  };
  const removeSideBar = () => {
    dispatch(setCanShowSideBar(false));
    dispatch(setTaskTrackingId(''));
    dispatch(setSelectedDate(''));
    setTaskTrackingDetails(taskTrackingDetailsDefaultValues);
    setCurrentTaskMeta(taskMetaPropsDefaultValues);
  }
  return (
    <aside className="lg:w-80 overflow-hidden md:overflow-y-auto bg-white dark:bg-black md:border-l border-t px-5 pt-2 pb-5 md:fixed md:relative bottom-[64px] lg:bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto md:h-auto rounded-t-lg md:rounded-none flex flex-col md:flex w-full">
      {loading ? (
        <div className="flex justify-center items-center text-sm w-full">
          Fetching Details...
        </div>
        ) :
        <div className="flex flex-col flex-1 overflow-hidden md:overflow-visible space-y-4">
          <div className="flex" style={{alignSelf: 'end'}}>
            <button 
              className="text-gray-300 hover:text-gray-100 transition-colors" 
              onClick={removeSideBar}
              >
                x
            </button>
          </div>
          <div className="flex flex:row md:flex-col flex-1 justify-between">
            <div>
              <h2 className="text-sm font-semibold truncate md:truncate-none">Task - {currentTaskMeta.task}</h2>
              <div className="mt-1 md:mt-2">
                <small className="md:text-sm">
                  <span className="text-bold">
                    Started At:
                  </span>
                  <span className="ms-2">
                    {taskTrackingDetails.task_details?.created_at_formatted}
                  </span>
                </small>
                {taskTrackingDetails.date_fromatted && 
                  <div className="mt-1 md:mt-1">
                    <small>
                        <span className="text-bold">
                          Task Date:
                        </span>
                        <span className="ms-2">
                          {taskTrackingDetails.date_fromatted}
                        </span>
                      </small>
                  </div>
                }
                {taskTrackingDetails.updated_time && 
                  <div className="mt-1 md:mt-1">
                    <small>
                        <span className="text-bold">
                          Last Updated:
                        </span>
                        <span className="ms-2">
                          {taskTrackingDetails.updated_time}
                          </span>
                      </small>
                  </div>
                }
              </div>
              {currentTaskMeta.measurable && (
                <div className="flex mt-3 md:mt-5 flex-col flex-1 min-h-0">
                  <h3 className="text-sm font-semibold">
                    <span>
                      Goal:
                    </span>
                    <span className="ms-2">
                      {taskTrackingDetails.task_details.value}
                    </span>
                    <span className="ms-2">
                      {`${taskTrackingDetails.task_details.unit}`}
                    </span>
                  </h3>
                  <h3 className="text-sm font-semibold">
                    Acheived: 
                    <span className="ms-2">
                      {taskTrackingDetails.value}
                    </span>
                    <span className="ms-2">
                      {`${taskTrackingDetails.task_details.unit}`}
                    </span>
                  </h3>
                </div>
              )}
            </div>
            {currentTaskMeta.measurable && (
              <div className="flex items-center mt-3 md:mt-2 flex-1 justify-end md:justify-center">
                  {taskTrackingDetails.value !== 0 && 
                    <button
                      onClick={decreaseTaskValue}
                      className={`px-3 py-1 text-sm bg-red-500 text-white rounded-l-md hover:bg-red-600 transition-colors h-10`}
                    >
                      -
                    </button>
                  }
                  <span className={`px-5 py-1 bg-gray-200 text-gray-700 flex items-center h-10 ${!taskTrackingDetails.value ? 'rounded-l-md' : ''} ${isTaskCompleted ? 'rounded-r-md' : ''}`}>{taskTrackingDetails.value}</span>
                  {!isTaskCompleted && 
                    <button
                      onClick={increaseTaskValue}
                      className="px-3 py-1 text-sm bg-green-500 text-white rounded-r-md hover:bg-green-600 transition-colors h-10"
                    >
                      +
                    </button>
                  }
              </div>
            )}
          </div>
        </div>
      }
    </aside>
  )
}