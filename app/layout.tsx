'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { NavigationBar } from '@/components/navigation-bar';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useSupabaseClient } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { Provider, useSelector } from 'react-redux';
import SessionInitializer from '@/components/SessionInitializer';
import SideBar from '@/components/sideBar';
import { RootState } from '@/lib/store';

const inter = Inter({ subsets: ['latin'] });

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNavbarRoutes = ['/sign-in', '/sign-up'];
  const shouldShowNavbar = !hideNavbarRoutes.includes(pathname);

  const { taskTrackingId, canShowSideBar, selectedDate } = useSelector((state: RootState) => ({
    taskTrackingId: state.tasks.taskTrackingId,
    canShowSideBar: state.tasks.canShowSideBar,
    selectedDate: state.tasks.selectedDate
  }));
  
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex flex-col h-screen">
        {shouldShowNavbar && <NavigationBar />}
        <div className="flex flex-row flex-1 h-[calc(100vh-60px)]">
          <main className="flex pb-8 flex-1 overflow-y-auto bg-white dark:bg-black">
            {children}
          </main>
          {canShowSideBar && 
            <SideBar taskId={taskTrackingId} date={selectedDate}/>
          }
        </div>
      </div>
    </ThemeProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Provider store={store}>
          <SessionInitializer onReady={() => setReady(true)} />
          {!ready ? (
            <div className="min-h-screen flex justify-center items-center text-lg">
              Loading...
            </div>
          ) : (
            <AppContent>{children}</AppContent>
          )}
        </Provider>
      </body>
    </html>
  );
}
