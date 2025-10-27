'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { MobileNav } from '@/components/layout/mobile-nav';
import { UserAvatar } from '@/components/auth/user-avatar';
import { createBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const routes = [
  {
    href: '/chat',
    label: 'Chat',
  },
  {
    href: '/admin',
    label: 'Admin',
  },
];

/**
 * Main navigation bar component.
 * Displays app logo, navigation links, theme toggle, and user avatar.
 *
 * Features:
 * - Responsive design with mobile navigation
 * - Active link highlighting
 * - Theme toggle button
 * - User avatar with dropdown menu
 * - Sticky positioning
 * - Client-side user authentication
 *
 * @example
 * ```tsx
 * import { Navbar } from '@/components/layout/navbar';
 *
 * export function AppLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <div>
 *       <Navbar />
 *       {children}
 *     </div>
 *   );
 * }
 * ```
 */
export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();

    // Fetch initial user
    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <MessageSquare className="h-6 w-6" />
            <span className="font-bold text-xl">AI Chatbots</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {routes.map((route) => {
              const isActive = pathname.startsWith(route.href);
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary relative',
                    isActive
                      ? 'text-foreground after:absolute after:bottom-[-1rem] after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  {route.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!isLoading && (
            <>
              {user ? (
                <UserAvatar user={user} />
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Sign In
                </Link>
              )}
            </>
          )}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
