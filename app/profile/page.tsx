'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from "next-themes";
import { useRouter } from 'next/navigation';
import { RootState } from '@/lib/store';
import { useSelector } from 'react-redux';

type Profile = {
  name: string;
  email: string;
  age: string;
  gender: string;
  theme: string;
  image: string;
  id?: string;
  user_id?: string;
};

export default function Profile() {
  const user = useSelector((state: RootState) => state.session.user);
  const { setTheme } = useTheme();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [signOutloading, setSignOutloading] = useState(false);

  const [profile, setProfile] = useState<Profile>({
    name: '',
    email: '',
    age: '',
    gender: '',
    theme: 'system',
    image: '',
    id: ''
  });
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const getProfile = async () => {    
    setLoading(true);
    try {
      const response = await fetch('/api/profile', { credentials: 'include' });
      const { data, error  } = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(error?.message || 'Failed to load profile');
      }
      setProfile(data);
      setTheme(data.theme);
    } catch (error) {
      console.error('Error fetching profile:', (error as any)?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setProfileSaving(true)
    if (!user) {
      console.error('Session error or user not found:', e);
      return;
    }
    const profileData = {
      user_id: user.id,
      name: profile.name,
      email: profile.email,
      age: profile.age,
      gender: profile.gender,
      theme: profile.theme,
      image: profile.image,
    };
  
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: profileData }),
      });
      const data = await response.json().catch((error) => console.error(error));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to save profile');
      }
      setProfileSaving(false);
    } catch (error) {
      console.error('Error saving profile:', (error as any)?.message || 'Unknown error');
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteLoading) return;
    const confirmed = window.confirm('This will permanently delete your account. This action cannot be undone.');
    if (!confirmed) return;

    setDeleteLoading(true);
    try {
      const response = await fetch('/api/account', {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to delete account');
      }
      router.push('/sign-in');
      router.refresh();
    } catch (error) {
      console.error('Error deleting account:', (error as any)?.message || 'Unknown error');
    } finally {
      setDeleteLoading(false);
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    getProfile();
  }, [user.id]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {    
    if (!profile.image || 
      profile.image === 'https://avatar.iran.liara.run/public/2' ||
      profile.image === 'https://avatar.iran.liara.run/public/56'
    ) {
      if (profile.gender === 'male') {
        setProfile(prev => ({
          ...prev,
          image: 'https://avatar.iran.liara.run/public/2'
        }));
      } else if (profile.gender === 'female') {
        setProfile(prev => ({
          ...prev,
          image: 'https://avatar.iran.liara.run/public/56'
        }));
      } else {
        setProfile(prev => ({ ...prev, image: '' }));
      }
    }
  }, [profile.gender]);

  const handleSignOut = async () => {
    setSignOutloading(true);
    try {
      const response = await fetch('/api/signout', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to sign out');
      }
      router.push('/sign-in');
      router.refresh();
    } finally {
      setSignOutloading(false);
    }
  };
  return (
    <div className="flex justify-center flex-col lg:w-1/2 flex-1 lg:flex-none bg-white dark:bg-gray-800 ">
      <form onSubmit={handleSubmit} className="flex flex-1 lg:rounded-lg shadow-lg p-8 w-full overflow-y-auto">
        <div className="flex flex-col flex-1 justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold mb-6 text-center dark:text-white flex-1">
                Profile Settings
              </h1>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  aria-label="Profile actions"
                  onClick={() => setMenuOpen(prev => !prev)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-10">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={signOutloading}
                      className="w-full text-left px-4 py-2 text-sm white-red-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {signOutloading ? 'Signing Out...' : 'Sign Out'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteLoading ? 'Deleting...' : 'Delete account'}
                    </button>
                    
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <img
                  src={profile.image}
                  alt={profile.name}
                  className="w-32 h-32 rounded-full object-cover"
                />
                <label 
                  htmlFor="image-upload" 
                  className="absolute bottom-0 right-0 p-1.5 bg-blue-500 hover:bg-blue-600 
                    text-white rounded-full cursor-pointer shadow-lg 
                    transition-colors"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <label 
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                Name
              </label>
              <input
                type="text"
                id="name"
                className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white"
                value={profile.name}
                onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
                />
            </div>

            <div className="space-y-2">
              <label 
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white"
                value={profile.email}
                onChange={e => setProfile(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Your email"
                />
            </div>

            <div className="space-y-2">
              <label 
                htmlFor="age"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                Age
              </label>
              <input
                type="number"
                id="age"
                className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white"
                value={profile.age}
                onChange={e => setProfile(prev => ({ ...prev, age: e.target.value }))}
                placeholder="Your age"
                />
            </div>

            <div className="space-y-2">
              <label 
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                Gender
              </label>
              <select
                id="gender"
                className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white"
                value={profile.gender}
                onChange={e => setProfile(prev => ({ ...prev, gender: e.target.value }))}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label 
                htmlFor="theme"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                Theme
              </label>
              <select
                id="theme"
                className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white"
                value={profile.theme}
                onChange={e => {
                  const value = e.target.value;
                  setProfile(prev => ({ ...prev, theme: value }));
                  setTheme(value);
                }}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
          <div className="pt-5">
            <button
              type="submit"
              className={`w-full bg-blue-500 text-white py-2 px-4 rounded-md transition-colors ${
                profileSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
              }`}
            >
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>

  );
}