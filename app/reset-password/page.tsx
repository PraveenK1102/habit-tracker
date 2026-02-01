'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabaseClient } from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      const hash = window.location.hash?.startsWith('#') ? window.location.hash.slice(1) : '';
      const params = new URLSearchParams(hash);
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      if (error) {
        const message = errorDescription
          ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
          : 'Reset link is invalid or has expired.';
        setStatus({ type: 'error', message });
        setReady(true);
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
          setStatus({ type: 'error', message: setError.message || 'Unable to initialize reset.' });
        }
      } else {
        setStatus({ type: 'error', message: 'Missing reset token. Please request a new link.' });
      }

      setReady(true);
    };

    initSession();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (password.length < 8) {
      setStatus({ type: 'error', message: 'Password must be at least 8 characters.' });
      return;
    }
    if (password !== confirm) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        throw new Error(error.message || 'Unable to reset password.');
      }
      setStatus({ type: 'success', message: 'Password updated. Redirecting to sign in…' });
      setTimeout(() => router.replace('/sign-in'), 1500);
    } catch (err) {
      setStatus({ type: 'error', message: (err as Error)?.message || 'Unexpected error' });
    } finally {
      setSaving(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-sm text-gray-600">Preparing password reset…</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto p-6 w-full max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Set a new password</h1>

      {status && (
        <p className={status.type === 'error' ? 'text-red-500 mb-4' : 'text-green-600 mb-4'}>
          {status.message}
        </p>
      )}

      <div className="space-y-4">
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded-md"
          required
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full p-2 border rounded-md"
          required
        />

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Update password'}
        </button>

        <p className="text-sm text-gray-500">
          <Link href="/sign-in" className="text-blue-500">
            Back to sign in
          </Link>
        </p>
      </div>
    </form>
  );
}
