'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link';
import { sendConfirmationEmail } from '@/lib/email/sendConfirmationEmail';
import { useSupabaseClient } from '@/lib/supabaseClient';

export default function SignUp() {
  const emptySignUpResponse: { type: 'success' | 'error'; message: string } = { type: 'success', message: '' };
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [singUpResponse, setSingUpResponse] = useState<{ type: 'success' | 'error'; message: string }>(emptySignUpResponse);
  const supabase = useSupabaseClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const result = await response.json();
      if (!result.ok) {
        setSingUpResponse({ type: 'error', message: result.error || 'Unexpected error' });
        return;
      }
      const data = result.data;
      const actionLink = data?.action_link;
      let emailSent = false;
      if (actionLink) {
        emailSent = await sendConfirmationEmail({ to: email, confirmationLink: actionLink });
        if (!emailSent) {
          setSingUpResponse({ type: 'error', message: 'Failed to send confirmation email, Please resend the confirmation email from login page.' });
          return;
        }
      }
      setSingUpResponse({ type: 'success', message: 'Confirmation email sent. Check your inbox and follow the link to confirm your account.' });
      setTimeout(() => {
        router.replace('/sign-in');
      }, 1000);
    } catch (error: any) {
      setSingUpResponse({ type: 'error', message: error?.message || 'Unexpected error' });
    } finally {
      setLoading(false);
    }
  };  

  const handleGoogleSignUp = async () => {
    setSingUpResponse(emptySignUpResponse);
    const redirectTo = `${window.location.origin}/auth/oauth?next=/`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (oauthError) {
      setSingUpResponse({ type: 'error', message: oauthError.message || 'Unable to start Google sign-up' });
    }
  };
  return (
    <form onSubmit={handleSignup} className="mx-auto p-6 w-full max-w-md md:max-w-lg lg:max-w-xl">
      <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>
      {singUpResponse.type === 'error' && <p className="text-red-500 mb-4">{singUpResponse.message}</p>}
      {singUpResponse.type === 'success' && <p className="text-green-500 mb-4">{singUpResponse.message}</p>}
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleGoogleSignUp}
          className="w-full border border-gray-300 bg-white text-gray-900 py-2 rounded-md hover:bg-gray-50 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
        >
          Continue with Google
        </button>
        <div className="text-center text-xs text-gray-400">or sign up with email</div>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded-md"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded-md"
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded-md"
              />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-2 flex items-center text-gray-500"
              >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-60"
        >
          {loading ? 'Creating...' : 'Create Account'}
        </button>
        <p className="text-sm text-gray-500">
          <span className="mr-2">Already have an account?</span>
          <Link href="/sign-in" className="text-blue-500">Sign In</Link>
        </p>
      </div>
    </form>
  )
}
