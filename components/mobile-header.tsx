'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Bell, Plus, Home, MessageCircle, User, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/add-task', icon: Plus, label: 'Add New Habit' },
    { href: '/messages', icon: MessageCircle, label: 'Chat', notification: true },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-black border-b z-50 h-[64px]">
        <div className="flex items-center justify-between h-full px-4">
          {/* Left: Hamburger Menu */}
          <button
            onClick={toggleMenu}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            )}
          </button>

          {/* Center: App Title */}
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Habit Tracker
            </h1>
          </div>

          {/* Right: Action Icons */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative">
              <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                3
              </span>
            </button>

            {/* Add Task */}
            <Link
              href="/add-task"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5 text-blue-500" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hamburger Menu Overlay */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMenu}
        />
      )}

      {/* Hamburger Menu Sidebar */}
      <div
        className={cn(
          "md:hidden fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-black border-r z-50 transform transition-transform duration-300 ease-in-out",
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">HT</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Menu</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Navigate your habits</p>
            </div>
          </div>
          <button
            onClick={closeMenu}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800',
                  (pathname === item.href || (pathname.includes(item.href) && item.href !== '/'))
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500'
                    : 'text-gray-700 dark:text-gray-300'
                )}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.notification && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </div>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Menu Footer */}
        <div className="border-t p-4">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Version 1.0.0
          </div>
        </div>
      </div>
    </>
  );
}
