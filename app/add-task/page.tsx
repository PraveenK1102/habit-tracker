'use client';

import { useState, useEffect, useDeferredValue, useMemo, useRef } from 'react';
import { useSupabaseClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation';
import taskData from '@/lib/data/health_tasks';
import { useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import { useSelector } from 'react-redux';
import Tag from '@/components/Tag';

interface TaskMeta {
  id: string;
  task: string;
  units: string[];
  default_target: Record<string, any>;
  type: string;
  color: string;
  icon: string;
}

export default function TaskList() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [searchTask, setSearchTask] = useState('');
  const tasksMeta = useSelector((state: RootState) => state.tasks.taskmeta);
  const [filteredTasks, setFilteredTasks] = useState<TaskMeta[]>([]);
  const deferredSearchTask = useDeferredValue(searchTask);

  const updatedFilteredTasks = useMemo(() => {
    if (deferredSearchTask) {
      return tasksMeta.filter((task) => {
        return task.task.toLowerCase().includes(deferredSearchTask.toLowerCase());
      });
    } else {
      return tasksMeta;
    }
  }, [deferredSearchTask, tasksMeta]);

  useEffect(() => {
    setFilteredTasks(updatedFilteredTasks);
  }, [updatedFilteredTasks]);


  return (
    <div className="w-full mx-auto">
      <div className="p-6">
        <div className="flex justify-between item-center z-10 py-4 sticky top-0 bg-white dark:bg-black pr-4">
          <h1 className="text-2xl font-bold mb-6 bg-white dark:bg-black">
            Task List
          </h1>
          <div className="flex">
            <input
              type="text"
              id="value"
              value={searchTask}
              onChange={(e) => setSearchTask(e.target.value)}
              placeholder="Search task..."
              className="w-full input bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-whilte dark:text-white"
            />
          </div>
        </div>
        <div className="flex flex-row w-100 flex-wrap gap-8 justify-center">
          {filteredTasks.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl cursor-pointer w-80 h-24 flex items-center overflow-scroll" 
              style={{ backgroundColor: `${item.color}0`, boxShadow: `1px 1px 4px 1px ${item.color}90` }} // 80 is ~0.5 opacity in hex
              onClick={() => router.push(`/add-task/${item.id}`)}
            >
              <p className=" w-full flex justify-between items-center">
                <span className="text-md font-mono overflow-scroll">
                  {item.task}
                </span>
                <Tag 
                  tag={item.type}
                  color={item.color}
                />
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}