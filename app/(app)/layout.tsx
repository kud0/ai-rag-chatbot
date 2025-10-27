import { Navbar } from '@/components/layout/navbar';
import { createClient } from '@/lib/supabase/server';

/**
 * App layout component for authenticated routes.
 * Wraps all app pages with the main navigation bar.
 *
 * Features:
 * - Server-side user authentication
 * - Consistent navigation across app pages
 * - Automatic user avatar display
 *
 * Routes using this layout:
 * - /chat - Chat interface
 * - /admin - Admin dashboard
 * - /profile - User profile
 * - /settings - User settings
 *
 * @example
 * ```tsx
 * // app/(app)/chat/page.tsx
 * export default function ChatPage() {
 *   return <div>Chat content</div>;
 * }
 * ```
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user || undefined} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
