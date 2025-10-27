'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

/**
 * Validation schemas for auth forms
 */
const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const magicLinkSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * Type definitions for auth actions
 */
type ActionResult = {
  success: boolean;
  error?: string;
  message?: string;
};

/**
 * Signs in a user with email and password.
 *
 * @param prevState - Previous action state (for useActionState compatibility)
 * @param formData - Form data containing email and password
 * @returns Action result with success status and optional error message
 *
 * @example
 * ```tsx
 * <form action={signIn}>
 *   <input name="email" type="email" required />
 *   <input name="password" type="password" required />
 *   <button type="submit">Sign In</button>
 * </form>
 * ```
 */
export async function signIn(prevState: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  // Validate input
  const validation = signInSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0].message,
    };
  }

  const { email, password } = validation.data;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Get redirect URL from query params if present
    const redirectTo = formData.get('redirectTo') as string | null;
    redirect(redirectTo || '/chat');
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Signs up a new user with email and password.
 *
 * @param formData - Form data containing email, password, and confirmPassword
 * @returns Action result with success status and optional error message
 *
 * @example
 * ```tsx
 * <form action={signUp}>
 *   <input name="email" type="email" required />
 *   <input name="password" type="password" required />
 *   <input name="confirmPassword" type="password" required />
 *   <button type="submit">Sign Up</button>
 * </form>
 * ```
 */
export async function signUp(prevState: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  };

  // Validate input
  const validation = signUpSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0].message,
    };
  }

  const { email, password } = validation.data;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: 'Check your email to confirm your account!',
    };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Signs out the current user.
 *
 * @returns Action result with success status
 *
 * @example
 * ```tsx
 * <form action={signOut}>
 *   <button type="submit">Sign Out</button>
 * </form>
 * ```
 */
export async function signOut(): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    redirect('/login');
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Sends a magic link to the user's email for passwordless sign in.
 *
 * @param formData - Form data containing email
 * @returns Action result with success status and optional error message
 *
 * @example
 * ```tsx
 * <form action={sendMagicLink}>
 *   <input name="email" type="email" required />
 *   <button type="submit">Send Magic Link</button>
 * </form>
 * ```
 */
export async function sendMagicLink(prevState: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const rawData = {
    email: formData.get('email') as string,
  };

  // Validate input
  const validation = magicLinkSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0].message,
    };
  }

  const { email } = validation.data;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: 'Check your email for the magic link!',
    };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Sends a password reset email to the user.
 *
 * @param formData - Form data containing email
 * @returns Action result with success status and optional error message
 *
 * @example
 * ```tsx
 * <form action={resetPassword}>
 *   <input name="email" type="email" required />
 *   <button type="submit">Reset Password</button>
 * </form>
 * ```
 */
export async function resetPassword(prevState: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const rawData = {
    email: formData.get('email') as string,
  };

  // Validate input
  const validation = resetPasswordSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0].message,
    };
  }

  const { email } = validation.data;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: 'Check your email for the password reset link!',
    };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
