'use client';

import { signIn, sendMagicLink } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useActionState } from 'react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

/**
 * Login form component with email/password and magic link options.
 * Provides form validation, loading states, and error handling.
 *
 * Features:
 * - Email/password authentication
 * - Magic link (passwordless) authentication
 * - Client-side validation
 * - Loading states during submission
 * - Toast notifications for errors
 * - Link to password reset
 *
 * @example
 * ```tsx
 * import { LoginForm } from '@/components/auth/login-form';
 *
 * export default function LoginPage() {
 *   return <LoginForm />;
 * }
 * ```
 */
export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, {
    success: false,
  });
  const [magicLinkState, magicLinkAction, isMagicLinkPending] = useActionState(
    sendMagicLink,
    { success: false }
  );
  const [showMagicLink, setShowMagicLink] = useState(false);

  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
    } else if (!state.success && state.error) {
      toast.error(state.error);
    }
  }, [state]);

  useEffect(() => {
    if (magicLinkState.success && magicLinkState.message) {
      toast.success(magicLinkState.message);
    } else if (!magicLinkState.success && magicLinkState.error) {
      toast.error(magicLinkState.error);
    }
  }, [magicLinkState]);

  return (
    <div className="space-y-4">
      {!showMagicLink ? (
        <>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                disabled={isPending}
              />
            </div>
            <div className="flex items-center justify-between">
              <Link
                href="/reset-password"
                className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setShowMagicLink(true)}
          >
            Magic Link
          </Button>
        </>
      ) : (
        <>
          <form action={magicLinkAction} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                disabled={isMagicLinkPending}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isMagicLinkPending}
            >
              {isMagicLinkPending ? 'Sending...' : 'Send magic link'}
            </Button>
          </form>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setShowMagicLink(false)}
          >
            Back to password login
          </Button>
        </>
      )}
    </div>
  );
}
