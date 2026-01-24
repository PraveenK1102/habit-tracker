'use client';

import { useState } from 'react';
import { useSupabaseClient } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation'

export default function SignIn() {
  const supabase = useSupabaseClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch((error) => console.error(error));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to sign in');
      }
      router.push('/');
    } catch (err) {
      setError((err as Error)?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignIn} className="mx-auto p-6 w-full max-w-md md:max-w-lg lg:max-w-xl">
      <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="space-y-4">
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
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
        >
          Sign In
        </button>
        <p className="text-sm text-gray-500">
          <span className="mr-2">Don't have an account?</span>
          <Link href="/sign-up" className="text-blue-500">Create Account</Link>
        </p>
      </div>
    </form>
  );
}
