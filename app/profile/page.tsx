'use client';

import { useState,  useEffect } from 'react';
import { useTheme } from "next-themes";
import { useSupabaseClient } from '@/lib/supabaseClient'
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
};

export default function Profile() {
  const session = useSelector((state: RootState) => state.session.session);
  const user = useSelector((state: RootState) => state.session.user);
  const supabase = useSupabaseClient();
  const router = useRouter();
  const { setTheme } = useTheme();

  const [profile, setProfile] = useState<Profile>({
    name: '',
    email: '',
    age: '',
    gender: '',
    theme: 'system',
    image: ''
  });
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [signOutloading, setSignOutloading] = useState(false);

  const getProfile = async () => {    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error.message);
    } else if (data) {
      setTheme(data.theme);
      setProfile(data);
    } else {
      console.warn('No profile data found for this user.');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setProfileSaving(true)
    if (!user) {
      console.error('Session error or user not found:', e);
      return;
    }
    const updates = {
      user_id: user.id,
      name: profile.name,
      email: profile.email,
      age: profile.age,
      gender: profile.gender,
      theme: profile.theme,
      image: profile.image,
    };
  
    const { error } = await supabase
      .from('profiles')
      .upsert(updates, { onConflict: 'user_id' });

    setProfileSaving(false)
    
    if (error) {
      console.error('Error saving profile:', error.message);
    } else {
      console.log('Profile saved successfully');
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

  useEffect(() => {
    getProfile();
  }, [user.id]);

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

  return (
    <div className="flex w-full flex-col mx-auto">
      <div className="p-8">
        <form onSubmit={handleSubmit} className="w-1/2 mx-auto mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold mb-6 text-center dark:text-white">
              Profile Settings
            </h1>

            <div className="space-y-6">
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
        <div className="w-full flex justify-end">
          <button
            type="button"
            onClick={async () => {
              setSignOutloading(true);
              try {             
                const { error } = await supabase.auth.signOut();
                if (error) {
                  console.error('Error signing out:', error);
                } else {
                  router.push('/sign-in');
                  router.refresh();
                }
              } finally {
                setTimeout(() => {
                  setSignOutloading(false);
                }, 2000);      
              }
            }}
            className={`bg-red-500 text-white py-2 px-4 rounded-md transition-colors ${
              signOutloading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'
            }`}
          >
            {signOutloading ? 'Signing Out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>

  );
}