/* eslint-disable react/no-unescaped-entities */
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabaseClient } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Confirming your email...');

  useEffect(() => {
    const completeSignIn = async () => {
      const nextUrl = searchParams.get('next') || '/';
      const code = searchParams.get('code');
      if (code) {
        setStatus('Completing sign-in...');
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus(error.message || 'Unable to complete sign-in.');
          return;
        }
        setStatus('Signed in. Redirecting...');
        setTimeout(() => {
          router.replace(nextUrl);
        }, 600);
        return;
      }
      const hash = window.location.hash?.startsWith('#') ? window.location.hash.slice(1) : '';
      const params = new URLSearchParams(hash);
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      if (error) {
        const message = errorDescription
          ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
          : 'Email link is invalid or has expired.';
        setStatus(message);
        return;
      }

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { error: setError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (setError) {
          setStatus(setError.message || 'Unable to complete sign-in.');
          return;
        }
        try {
          await fetch('/api/auth/confirm-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken }),
          });
        } catch {
          // Non-blocking: confirmation can be retried via resend.
        }
      }

      setStatus('Email confirmed. Redirecting to sign in...');
      setTimeout(() => {
        router.replace('/sign-in');
      }, 1500);
    };

    completeSignIn();
  }, [router, searchParams, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center text-sm text-gray-600">
        <div className="text-base font-semibold text-gray-900 mb-2">Email confirmation</div>
        <div>{status}</div>
      </div>
    </div>
  );
}
