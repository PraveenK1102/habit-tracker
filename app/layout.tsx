'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { NavigationBar } from '@/components/navigation-bar';
import { MobileHeader } from '@/components/mobile-header';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
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
  const [sideBarHeight, setSideBarHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const sideBarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let nonAllowedRoutesForSideBar = ['/profile'];
    let canAllowSideBar = !nonAllowedRoutesForSideBar.includes(pathname) && canShowSideBar;
    setIsSideBarOpen(canAllowSideBar);
  }, [canShowSideBar, pathname]);

  // Check if we're on mobile and measure sidebar height
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    const measureSideBarHeight = () => {
      if (sideBarRef.current && isSideBarOpen) {
        // Use requestAnimationFrame to ensure measurement happens after render
        requestAnimationFrame(() => {
          if (sideBarRef.current) {
            const height = sideBarRef.current.offsetHeight;
            setSideBarHeight(height);
          }
        });
      } else {
        setSideBarHeight(0);
      }
    };

    checkMobile();
    measureSideBarHeight();

    window.addEventListener('resize', checkMobile);
    window.addEventListener('resize', measureSideBarHeight);

    // Use ResizeObserver to detect sidebar height changes
    let resizeObserver: ResizeObserver;
    if (sideBarRef.current) {
      resizeObserver = new ResizeObserver(measureSideBarHeight);
      resizeObserver.observe(sideBarRef.current);
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('resize', measureSideBarHeight);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isSideBarOpen]);

  // Measure sidebar height when it opens/closes
  useEffect(() => {
    if (sideBarRef.current && isSideBarOpen) {
      // Small delay to ensure the sidebar is fully rendered
      const timer = setTimeout(() => {
        if (sideBarRef.current) {
          const height = sideBarRef.current.offsetHeight;
          setSideBarHeight(height);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setSideBarHeight(0);
    }
  }, [isSideBarOpen]);

  // Calculate main content style based on sidebar state
  const getMainContentStyle = () => {
    if (isMobile && isSideBarOpen && sideBarHeight > 0) {
      return {
        maxHeight: `calc(100vh - 64px - ${sideBarHeight}px)` // 64px for mobile header
      };
    }
    return {};
  };

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex flex-col">
        {shouldShowNavbar && (
          <>
            <NavigationBar />
            <MobileHeader />
          </>
        )}
        <div className="flex flex-col lg:flex-row min-h-screen md:min-h-[calc(100vh-64px)] pt-[64px] md:pb-0 md:pt-0">
          <main 
            className="flex flex-1 justify-center overflow-y-auto bg-white dark:bg-black transition-all duration-300"
            style={getMainContentStyle()}
          >
            {children}
          </main>
          {isSideBarOpen && 
            <SideBar ref={sideBarRef} taskId={taskTrackingId} date={selectedDate}/>
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
