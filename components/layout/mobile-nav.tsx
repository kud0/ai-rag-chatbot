'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

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
 * Mobile navigation component with hamburger menu.
 * Displays a sheet sidebar with navigation links for mobile devices.
 *
 * Features:
 * - Responsive hamburger menu
 * - Slide-out navigation drawer
 * - Active link highlighting
 * - Auto-close on navigation
 *
 * @example
 * ```tsx
 * import { MobileNav } from '@/components/layout/mobile-nav';
 *
 * export function Navbar() {
 *   return (
 *     <nav>
 *       <div className="md:hidden">
 *         <MobileNav />
 *       </div>
 *     </nav>
 *   );
 * }
 * ```
 */
export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px] sm:w-[280px]">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4 mt-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => setOpen(false)}
              className={cn(
                'text-lg font-medium transition-colors hover:text-primary',
                pathname === route.href
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {route.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
