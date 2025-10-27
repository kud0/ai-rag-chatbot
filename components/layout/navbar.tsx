'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { MobileNav } from '@/components/layout/mobile-nav';
import { UserAvatar } from '@/components/auth/user-avatar';

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

interface NavbarProps {
  user?: {
    email?: string;
    user_metadata?: {
      avatar_url?: string;
      full_name?: string;
    };
  };
}

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
 *
 * @param props - Component props
 * @param props.user - User object from Supabase auth (optional)
 *
 * @example
 * ```tsx
 * import { Navbar } from '@/components/layout/navbar';
 * import { createClient } from '@/lib/supabase/server';
 *
 * export async function AppLayout({ children }: { children: React.ReactNode }) {
 *   const supabase = await createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *
 *   return (
 *     <div>
 *       <Navbar user={user} />
 *       {children}
 *     </div>
 *   );
 * }
 * ```
 */
export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

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
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
