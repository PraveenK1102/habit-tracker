import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@/lib/supabaseClient';
import { useDispatch } from 'react-redux';
import { setSession, setUser } from '@/lib/features/sessionSlice';
import { useRouter } from 'next/navigation';
import { setTaskMeta } from '@/lib/features/tasksSlice';

export default function SessionInitializer({ onReady }: { onReady: () => void }) {
  const dispatch = useDispatch();
  const supabase = useSupabaseClient();
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      dispatch(setSession(data.session));
      dispatch(setUser(data.session?.user));
      if (!data.session?.user) {
        router.push('/sign-in');
      }
      await loadTaskMetaData();
      onReady(); // Tell parent we're ready
    };
    const loadTaskMetaData = async () => {
      const { data: tasks, error } = await supabase.from('taskmeta').select('*');          
      if (error) {
        console.error('Error fetching tasks:', error.message);
      } else {
        if (tasks) {
          dispatch(setTaskMeta(tasks));
        }
      }
    };
    fetchSession();
  }, [dispatch, supabase]);

  return null;
}
