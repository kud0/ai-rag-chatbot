'use client';

import { signOut } from '@/app/actions/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

interface UserAvatarProps {
  user: {
    email?: string;
    user_metadata?: {
      avatar_url?: string;
      full_name?: string;
    };
  };
}

/**
 * Gets the user's initials from their email or name.
 *
 * @param email - User's email address
 * @param name - User's full name (optional)
 * @returns Two-letter initials string
 */
function getUserInitials(email: string, name?: string): string {
  if (name) {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

/**
 * User avatar component with dropdown menu.
 * Displays user avatar with a dropdown menu containing profile actions.
 *
 * Features:
 * - User avatar with fallback to initials
 * - Dropdown menu with navigation links
 * - Sign out action
 * - Loading states
 * - Toast notifications
 *
 * @param props - Component props
 * @param props.user - User object from Supabase auth
 *
 * @example
 * ```tsx
 * import { UserAvatar } from '@/components/auth/user-avatar';
 * import { createClient } from '@/lib/supabase/server';
 *
 * export async function Header() {
 *   const supabase = await createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *
 *   if (!user) return null;
 *
 *   return (
 *     <nav>
 *       <UserAvatar user={user} />
 *     </nav>
 *   );
 * }
 * ```
 */
export function UserAvatar({ user }: UserAvatarProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const result = await signOut();
      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
      }
      // If successful, Supabase redirect happens automatically
    } catch (error) {
      toast.error('Failed to sign out');
      setIsLoading(false);
    }
  };

  const initials = getUserInitials(
    user.email || '',
    user.user_metadata?.full_name
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={user.user_metadata?.avatar_url}
              alt={user.email || 'User avatar'}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.user_metadata?.full_name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={isLoading}>
          <LogOut className="mr-2 h-4 w-4" />
          {isLoading ? 'Signing out...' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
