import Link from 'next/link';
import { ArrowRight, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FeaturesGrid } from '@/components/home/features-grid';

/**
 * Home page component - Landing page for the application.
 * Displays hero section with features and CTA buttons.
 *
 * Features:
 * - Responsive hero section
 * - Feature highlights grid
 * - Authentication-aware CTAs
 * - Auto-redirect for authenticated users
 * - SEO-optimized content
 *
 * @example
 * ```tsx
 * // This is the default export for app/page.tsx
 * // Accessible at the root URL "/"
 * ```
 */
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect authenticated users to chat
  if (user) {
    redirect('/chat');
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6" />
            <span className="font-bold text-xl">AI Chatbots</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 inline-flex items-center rounded-full border px-4 py-2 text-sm">
              <Sparkles className="mr-2 h-4 w-4" />
              Powered by Advanced AI
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
              Intelligent AI Chatbots for
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {' '}
                Every Need
              </span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              Build and deploy powerful AI chatbots with advanced natural language processing.
              Create intelligent conversations that understand context and deliver exceptional user experiences.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container px-4 py-16 md:py-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to build amazing chatbots
              </h2>
              <p className="text-lg text-muted-foreground">
                Powerful features to create, deploy, and manage intelligent AI conversations
              </p>
            </div>
            <FeaturesGrid />
          </div>
        </section>

        {/* CTA Section */}
        <section className="container px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl rounded-2xl bg-primary/5 p-8 text-center md:p-12">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              Ready to get started?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join thousands of developers building intelligent chatbots with our platform.
            </p>
            <Link href="/signup">
              <Button size="lg">
                Create Your First Chatbot
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} AI Chatbots. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
