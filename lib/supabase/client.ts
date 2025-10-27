import { createBrowserClient as createClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Creates a Supabase client for use in Client Components.
 * This client uses browser storage for authentication and implements
 * a singleton pattern to avoid creating multiple instances.
 *
 * @returns SupabaseClient - A configured Supabase client instance for the browser
 *
 * @example
 * ```tsx
 * 'use client';
 * import { createBrowserClient } from '@/lib/supabase/client';
 * import { useEffect, useState } from 'react';
 *
 * export default function ClientComponent() {
 *   const [data, setData] = useState(null);
 *   const supabase = createBrowserClient();
 *
 *   useEffect(() => {
 *     const fetchData = async () => {
 *       const { data } = await supabase.from('posts').select();
 *       setData(data);
 *     };
 *     fetchData();
 *   }, [supabase]);
 *
 *   return <div>{JSON.stringify(data)}</div>;
 * }
 * ```
 */
export function createBrowserClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Type helper to get the Supabase client type for use in TypeScript
 */
export type SupabaseClient = ReturnType<typeof createBrowserClient>;
