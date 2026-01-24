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
import ChatbotPanel from '@/components/llmchatbot/ChatbotPanel';
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
  const [dynamicVh, setDynamicVh] = useState(0);
  const sideBarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let nonAllowedRoutesForSideBar = ['/profile'];
    let canAllowSideBar = !nonAllowedRoutesForSideBar.includes(pathname) && canShowSideBar;
    setIsSideBarOpen(canAllowSideBar);
  }, [canShowSideBar, pathname]);

  // Dynamic viewport height calculation for mobile browsers
  useEffect(() => {
    const setVhProperty = () => {
      const vh = window.innerHeight * 0.01;
      setDynamicVh(vh);
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1023); // md breakpoint
    };

    const measureSideBarHeight = () => {
      if (sideBarRef.current && isSideBarOpen) {
        // Use requestAnimationFrame to ensure measurement happens after render
        requestAnimationFrame(() => {
          if (sideBarRef.current) {
            const height = sideBarRef.current.offsetHeight + 20;
            setSideBarHeight(height);
          }
        });
      } else {
        setSideBarHeight(0);
      }
    };

    // Initial setup
    setVhProperty();
    checkMobile();
    measureSideBarHeight();

    // Event listeners
    window.addEventListener('resize', setVhProperty);
    window.addEventListener('orientationchange', setVhProperty);
    window.addEventListener('resize', checkMobile);
    window.addEventListener('resize', measureSideBarHeight);

    // Handle viewport changes on mobile (for Android URL bar hide/show)
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setVhProperty();
          ticking = false;
        });
        ticking = true;
      }
    };

    if (isMobile) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Use ResizeObserver to detect sidebar height changes
    let resizeObserver: ResizeObserver;
    if (sideBarRef.current) {
      resizeObserver = new ResizeObserver(measureSideBarHeight);
      resizeObserver.observe(sideBarRef.current);
    }

    return () => {
      window.removeEventListener('resize', setVhProperty);
      window.removeEventListener('orientationchange', setVhProperty);
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('resize', measureSideBarHeight);
      if (isMobile) {
        window.removeEventListener('scroll', handleScroll);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isSideBarOpen, isMobile]);

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

  // Calculate main content style based on sidebar state and safe areas
  const getMainContentStyle = () => {
    if (isMobile && isSideBarOpen && sideBarHeight > 0) {
      const safeAreaBottom = 'var(--safe-area-inset-bottom, 0px)';
      return {
        maxHeight: `calc(var(--vh, 1vh) * 100 - 64px - ${sideBarHeight}px - ${safeAreaBottom})`,
        minHeight: `calc(var(--vh, 1vh) * 100 - 64px - ${sideBarHeight}px - ${safeAreaBottom})`
      };
    }
    return {
      minHeight: isMobile ? 'calc(var(--vh, 1vh) * 100 - 64px)' : 'calc(100vh - 64px)'
    };
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
        <div className="flex flex-col lg:flex-row dvh-screen md:min-h-[calc(var(--vh,1vh)*100-64px)] pt-[64px] md:pb-0 md:pt-0 safe-area-left safe-area-right">
          <main
            className={`flex flex-1 justify-center overflow-y-auto bg-white dark:bg-black transition-all duration-300 ${
              isSideBarOpen && !isMobile ? 'lg:mr-80' : ''
            }`}
            style={getMainContentStyle()}
          >
            {children}
          </main>
          {isSideBarOpen && 
            <SideBar ref={sideBarRef} taskId={taskTrackingId} date={selectedDate}/>
          }
        </div>
        <ChatbotPanel />
      </div>
    </ThemeProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Habit Tracker" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <Provider store={store}>
          <SessionInitializer onReady={() => setReady(true)} />
          {!ready ? (
            <div className="h-screen flex justify-center items-center">
              Hang tight - getting things ready.
            </div>
          ) : (
            <AppContent>{children}</AppContent>
          )}
        </Provider>
      </body>
    </html>
  );
}
