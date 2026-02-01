'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';

export default function RejectInvitePage() {
  const params = useSearchParams();
  const inviteId = params.get('inviteId');
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState('Checking authentication…');

  useEffect(() => {
    if (!inviteId) {
      setStatus('Invalid invite');
      return;
    }

    async function run() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        const next = `/invites/reject?inviteId=${inviteId}`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      setStatus('Rejecting invite…');

      try {
        const res = await fetch('/api/invites/reject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invite_id: inviteId }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed');
        }

        setStatus('Invite rejected');
      } catch (err: any) {
        setStatus(err.message);
      }
    }

    run();
  }, [inviteId, router, supabase]);

  return <p>{status}</p>;
}
