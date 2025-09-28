'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { NavigationBar } from '@/components/navigation-bar';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
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
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);

  useEffect(() => {
    let nonAllowedRoutesForSideBar = ['/profile'];
    let canAllowSideBar = !nonAllowedRoutesForSideBar.includes(pathname) && canShowSideBar;
    setIsSideBarOpen(canAllowSideBar);
  }, [canShowSideBar, pathname]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex flex-col">
        {shouldShowNavbar && <NavigationBar />}
        <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] ">
          <main className="flex flex-1 justify-center overflow-y-auto bg-white dark:bg-black dark:bg-opacity-[0.7]">
            {children}
          </main>
          {isSideBarOpen && 
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
            <div className="h-screen flex justify-center items-center">
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
