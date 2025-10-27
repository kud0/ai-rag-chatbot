'use client';

import { signUp } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActionState } from 'react';
import { toast } from 'sonner';
import { useEffect } from 'react';

/**
 * Signup form component for creating new user accounts.
 * Includes client-side validation and password confirmation.
 *
 * Features:
 * - Email/password registration
 * - Password confirmation validation
 * - Client-side validation
 * - Loading states during submission
 * - Toast notifications for success/errors
 * - Automatic redirect after successful signup
 *
 * @example
 * ```tsx
 * import { SignupForm } from '@/components/auth/signup-form';
 *
 * export default function SignupPage() {
 *   return <SignupForm />;
 * }
 * ```
 */
export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signUp, {
    success: false,
  });

  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
    } else if (!state.success && state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
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
          placeholder="Create a password (min. 8 characters)"
          required
          minLength={8}
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          required
          minLength={8}
          disabled={isPending}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
}
