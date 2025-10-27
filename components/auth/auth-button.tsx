'use client';

import { signOut } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useActionState } from 'react';
import { toast } from 'sonner';
import { useEffect } from 'react';

/**
 * Authentication button component for signing out.
 * Displays a button that triggers the sign out action.
 *
 * Features:
 * - One-click sign out
 * - Loading state during sign out
 * - Toast notification on error
 * - Automatic redirect to login after sign out
 *
 * @example
 * ```tsx
 * import { AuthButton } from '@/components/auth/auth-button';
 *
 * export function Header() {
 *   return (
 *     <nav>
 *       <AuthButton />
 *     </nav>
 *   );
 * }
 * ```
 */
export function AuthButton() {
  const [state, formAction, isPending] = useActionState(signOut, {
    success: false,
  });

  useEffect(() => {
    if (!state.success && state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={isPending}
        className="gap-2"
      >
        <LogOut className="h-4 w-4" />
        {isPending ? 'Signing out...' : 'Sign out'}
      </Button>
    </form>
  );
}
