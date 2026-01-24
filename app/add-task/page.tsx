'use client';

import { useState, useEffect, useDeferredValue, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
    <div className="flex flex-col flex-1 space-y-5 bg-white dark:bg-black">
      <div className="overflow-y-auto">
        <div className="z-40 sticky top-0 bg-white dark:bg-black dark:bg-opacity-[0.8] px-5">
          <div className="flex justify-between text-sm bg-white dark:bg-black dark:bg-opacity-[0.9] pt-4">
            <h1 className="align-self-center font-bold self-center">
              Task List
            </h1>
            <div>
              <input
                type="text"
                id="value"
                value={searchTask}
                onChange={(e) => setSearchTask(e.target.value)}
                placeholder="Search task..."
                className="search-input bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-whilte dark:text-white text-xs"
              />
            </div>
          </div>
          <div className="h-8 dark:bg-black dark:bg-opacity-[0.3]"></div>
        </div>
        <div className="flex flex-row w-100 flex-wrap gap-8 justify-center my-4">
          {filteredTasks.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl cursor-pointer w-80 md:w-96 lg:h-24 flex items-center overflow-scroll" 
              style={{ backgroundColor: `${item.color}0`, boxShadow: `1px 1px 4px 1px ${item.color}90` }} // 80 is ~0.5 opacity in hex
              onClick={() => router.push(`/add-task/${item.id}`)}
            >
              <p className=" w-full flex justify-between items-center">
                <span className="font-mono overflow-scroll">
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