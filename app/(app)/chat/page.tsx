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
    <ChatInterface initialSessions={sessions} userId={user.id} className="h-full" />
  );
}
