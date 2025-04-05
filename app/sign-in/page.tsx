'use client';

import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@/lib/supabaseClient';

export default function SignIn() {
  const supabase = useSupabaseClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('Sign-in data:', data);
    if (error) {
      setError(error.message);
    } else {
      window.location.href = '/'; // Redirect to profile after sign-in
    }
  };

  return (
    <form onSubmit={handleSignIn} className="mx-auto p-6">
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
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded-md"
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
        >
          Sign In
        </button>
      </div>
    </form>
  );
}
