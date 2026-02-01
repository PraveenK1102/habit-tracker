'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { sendConfirmationEmail } from '@/lib/email/sendConfirmationEmail';
import { useSupabaseClient } from '@/lib/supabaseClient';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';
  const supabase = useSupabaseClient();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResendStatus(null);
    setLoading(true);

    try {
      const response = await fetch('/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to sign in');
      }
      router.replace(next);
    } catch (err) {
      setError((err as Error)?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setResendStatus(null);
    if (!email) {
      setResendStatus({ type: 'error', message: 'Enter your email to resend the confirmation.' });
      return;
    }
    if (resendCooldown > 0) {
      setResendStatus({ type: 'error', message: `Please wait ${resendCooldown}s before trying again.` });
      return;
    }
    setResendLoading(true);
    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        if (response.status === 429 || data?.code === 'RATE_LIMITED') {
          setResendCooldown(60);
          setResendStatus({ type: 'error', message: 'Please wait 60s before requesting another email.' });
          return;
        }
        throw new Error(data?.error || 'Failed to resend confirmation email');
      }
      const actionLink = data?.data?.action_link;
      if (actionLink) {
        // const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
        // const templateId = process.env.EMAILJS_TEMPLATE_ID;
        // const publicKey = process.env.EMAILJS_PUBLIC_KEY;
        // if (!serviceId || !templateId || !publicKey) {
        //   throw new Error('EmailJS client is not configured. Set NEXT_PUBLIC_EMAILJS_* env vars.');
        // }
        // const emailPayload = {
        //   service_id: serviceId,
        //   template_id: templateId,
        //   user_id: publicKey,
        //   template_params: {
        //     to_email: email,
        //     confirmation_link: actionLink,
        //     app_name: data?.data?.app_name || 'Habit Tracer',
        //     support_email: data?.data?.support_email || '',
        //   },
        // };
        // const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(emailPayload),
        // });
        // if (!emailResponse.ok) {
        //   const text = await emailResponse.text().catch(() => '');
        //   throw new Error(text || 'EmailJS error');
        // }
        await sendConfirmationEmail({ to: email, confirmationLink: actionLink });
      }
      setResendCooldown(60);
      setResendStatus({ type: 'success', message: 'Confirmation email sent. Check your inbox.' });
    } catch (err) {
      setResendStatus({ type: 'error', message: (err as Error)?.message || 'Unexpected error' });
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const redirectTo = `${window.location.origin}/auth/oauth?next=${encodeURIComponent(next)}`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (oauthError) {
      setError(oauthError.message || 'Unable to start Google sign-in');
    }
  };

  return (
    <form onSubmit={handleSignIn} className="mx-auto p-6 w-full max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {resendStatus && (
        <p className={resendStatus.type === 'error' ? 'text-red-500 mb-4' : 'text-green-600 mb-4'}>
          {resendStatus.message}
        </p>
      )}

      <div className="space-y-4">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full border border-gray-300 bg-white text-gray-900 py-2 rounded-md hover:bg-gray-50 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
        >
          Continue with Google
        </button>
        <div className="text-center text-xs dark:text-white text-gray-400">or sign in with email</div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded-md"
          required
        />

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-2 flex items-center text-gray-500"
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>

        <div className="flex justify-between">
          <Link href="/reset-request" className="text-sm text-blue-500 hover:underline">
            Forgot password?
          </Link>
          <button
            type="button"
            onClick={handleResendConfirmation}
            disabled={resendLoading || resendCooldown > 0}
            className="text-sm text-blue-500 hover:underline disabled:opacity-50"
          >
            {resendLoading
              ? 'Sending confirmation…'
              : resendCooldown > 0
                ? `Resend available in ${resendCooldown}s`
                : 'Resend confirmation email.'}
          </button>
        </div>

        <p className="text-sm text-gray-500">
          <span className="mr-2">Don't have an account?</span>
          <Link href="/sign-up" className="text-blue-500">
            Create Account
          </Link>
        </p>
      </div>
    </form>
  );
}
