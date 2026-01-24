import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@/lib/supabaseClient';
import { useDispatch } from 'react-redux';
import { setSession, setUser } from '@/lib/features/sessionSlice';
import { useRouter, usePathname } from 'next/navigation';
import { setTaskMeta } from '@/lib/features/tasksSlice';

export default function SessionInitializer({ onReady }: { onReady: () => void }) {
  const dispatch = useDispatch();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        dispatch(setSession(data.session));
        dispatch(setUser(data.session?.user));

        const authRoutes = ['/sign-in', '/sign-up'];
        if (!data.session?.user && !authRoutes.includes(pathname)) {
          router.push('/sign-in');
        }

        await loadTaskMetaData();
        onReady(); // Tell parent we're ready
      } catch (error) {
        console.error('Error fetching session:', (error as any)?.message || 'Unknown error');
      }
    };
    const loadTaskMetaData = async () => {
      try {
        const response = await fetch('/api/taskmeta', { credentials: 'include' });
        const { data } = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load task metadata');
        }
        if (Array.isArray(data)) {
          dispatch(setTaskMeta(data));
        } else {
          dispatch(setTaskMeta([]));
        }
      } catch (error) {
        console.error('Error fetching tasks:', (error as any)?.message || 'Unknown error');
      }
    };
    fetchSession();
  }, [dispatch, supabase, router, pathname]);

  return null;
}
