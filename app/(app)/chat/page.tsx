/**
 * Chat Page
 * Protected chat interface with session management
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessions } from '@/app/actions/chat';
import { ChatInterface } from '@/components/chat/chat-interface';

export const metadata = {
  title: 'Chat - RAG Chatbot',
  description: 'Chat with AI powered by your documents',
};

export default async function ChatPage() {
  // Get Supabase client
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Load user's chat sessions
  const { sessions, error } = await getSessions();

  if (error) {
    console.error('Error loading sessions:', error);
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Page header */}
      <header className="hidden border-b bg-background lg:block">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">AI Chat</h1>
          <p className="text-sm text-muted-foreground">
            Ask questions about your documents
          </p>
        </div>
      </header>

      {/* Chat interface */}
      <main className="flex-1 overflow-hidden">
        <ChatInterface initialSessions={sessions} userId={user.id} />
      </main>
    </div>
  );
}
