'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Home, PlusCircle, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NavigationBar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/add-task', icon: PlusCircle, label: 'Add Task' },
    { 
      href: '/messages', 
      icon: MessageCircle, 
      label: 'Messages',
      notification: true 
    },
    { href: '/profile', icon: User, label: 'Profile' },
  ];
  
  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block border-b sticky top-0 bg-white dark:bg-black dark:bg-opacity-[0.7] z-10 h-[64px] w-full">
        <div className="px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary touch-manipulation',
                    (pathname === item.href || (pathname.includes(item.href) && item.href !== '/'))
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  <div className="relative">
                    <item.icon className="h-5 w-5" />
                    {item.notification && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </div>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black dark:bg-opacity-[0.7] border-t z-50 safe-area-pb h-[64px]">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center space-y-1 p-2 text-xs font-medium transition-colors touch-manipulation min-w-0 flex-1',
                (pathname === item.href || (pathname.includes(item.href) && item.href !== '/'))
                  ? 'text-blue-500'
                  : 'text-gray-500 dark:text-gray-400'
              )}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.notification && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </div>
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}