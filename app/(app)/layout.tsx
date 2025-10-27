import { Navbar } from '@/components/layout/navbar';

/**
 * App layout component for authenticated routes.
 * Wraps all app pages with the main navigation bar.
 *
 * Features:
 * - Client-side user authentication
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
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
