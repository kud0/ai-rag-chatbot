'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, ArrowRight } from 'lucide-react';

/**
 * Settings Redirect Page
 * Redirects users to the admin settings page
 */
export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to admin settings after a brief moment
    const timer = setTimeout(() => {
      router.push('/admin/settings');
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-primary/10 p-6">
            <Settings className="h-16 w-16 text-primary animate-spin" />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold">Redirecting to Settings</h1>

        <p className="mb-8 text-muted-foreground">
          Taking you to the admin settings page...
        </p>

        <button
          onClick={() => router.push('/admin/settings')}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Go Now
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
