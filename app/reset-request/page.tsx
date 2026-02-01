'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ResetRequestPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to request password reset');
      }

      const actionLink = data?.data?.action_link;
      if (actionLink) {
        const serviceId = process.env.EMAILJS_SERVICE_ID;
        const templateId = process.env.EMAILJS_SERVICE_ID;
        const publicKey = process.env.EMAILJS_PUBLIC_KEY;
        if (!serviceId || !templateId || !publicKey) {
          throw new Error('EmailJS client is not configured. Set NEXT_PUBLIC_EMAILJS_* env vars.');
        }
        const emailPayload = {
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            to_email: email,
            reset_link: actionLink,
            app_name: data?.data?.app_name || 'Habit Tracer',
            support_email: data?.data?.support_email || '',
          },
        };
        const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload),
        });
        if (!emailResponse.ok) {
          const text = await emailResponse.text().catch(() => '');
          throw new Error(text || 'EmailJS error');
        }
      }

      setStatus({ type: 'success', message: 'Check your inbox for the reset link.' });
    } catch (err) {
      setStatus({ type: 'error', message: (err as Error)?.message || 'Unexpected error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto p-6 w-full max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Reset Password</h1>

      {status && (
        <p className={status.type === 'error' ? 'text-red-500 mb-4' : 'text-green-600 mb-4'}>
          {status.message}
        </p>
      )}

      <div className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded-md"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Send reset link'}
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
