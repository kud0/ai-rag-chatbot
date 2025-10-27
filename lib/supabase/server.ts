import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * Creates a Supabase client for use in Server Components and Server Actions.
 * This client handles cookie-based authentication for server-side rendering.
 *
 * @returns Promise<SupabaseClient> - A configured Supabase client instance
 *
 * @example
 * ```tsx
 * // In a Server Component
 * import { createClient } from '@/lib/supabase/server';
 *
 * export default async function Page() {
 *   const supabase = await createClient();
 *   const { data } = await supabase.from('posts').select();
 *   return <div>{JSON.stringify(data)}</div>;
 * }
 * ```
 *
 * @example
 * ```ts
 * // In a Server Action
 * 'use server';
 * import { createClient } from '@/lib/supabase/server';
 *
 * export async function createPost(formData: FormData) {
 *   const supabase = await createClient();
 *   const { data, error } = await supabase.from('posts').insert({...});
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase admin client with service role access.
 * Use with caution - this bypasses Row Level Security (RLS).
 * Only use for admin operations that require elevated privileges.
 *
 * @returns Promise<SupabaseClient> - A Supabase client with service role access
 *
 * @example
 * ```ts
 * import { createAdminClient } from '@/lib/supabase/server';
 *
 * export async function deleteUserAdmin(userId: string) {
 *   const supabase = await createAdminClient();
 *   await supabase.auth.admin.deleteUser(userId);
 * }
 * ```
 */
export async function createAdminClient() {
  const cookieStore = await cookies();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Ignore errors in Server Components
          }
        },
      },
    }
  );
}
