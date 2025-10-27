# Chat Interface Quick Start Guide

## 🚀 Getting Started

### 1. Verify Installation
All dependencies are already installed. Verify with:
```bash
npm list ai react-markdown remark-gfm react-syntax-highlighter
```

### 2. Environment Variables
Ensure your `.env.local` has:
```env
OPENAI_API_KEY=sk-your-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access Chat
Navigate to: `http://localhost:3000/chat`

## 📁 Created Files Summary

| File | Path | Purpose |
|------|------|---------|
| **API Route** | `/app/api/chat/route.ts` | Streaming endpoint with RAG |
| **Server Actions** | `/app/actions/chat.ts` | Session management |
| **Chat Page** | `/app/(app)/chat/page.tsx` | Main chat page |
| **Main Interface** | `/components/chat/chat-interface.tsx` | Orchestrator |
| **Message Bubble** | `/components/chat/message-bubble.tsx` | Individual messages |
| **Message List** | `/components/chat/message-list.tsx` | Message container |
| **Chat Input** | `/components/chat/chat-input.tsx` | Text input |
| **Source Citations** | `/components/chat/source-citations.tsx` | RAG sources |
| **Session Sidebar** | `/components/chat/session-sidebar.tsx` | Session list |
| **Typing Indicator** | `/components/chat/typing-indicator.tsx` | Loading animation |
| **Component Index** | `/components/chat/index.ts` | Exports |

## 🎯 Key Features

### Streaming
- Real-time token-by-token responses
- ChatGPT-like experience
- No page reloads

### RAG Integration
- Automatic context retrieval
- Source citations below responses
- Relevance scoring

### Session Management
- Create unlimited sessions
- Rename and delete
- Switch between conversations
- Auto-save all messages

### Markdown Support
- Code blocks with syntax highlighting
- Tables, lists, blockquotes
- Links (open in new tab)
- GitHub Flavored Markdown

### Mobile Responsive
- Collapsible sidebar
- Touch-friendly interface
- Responsive layouts

## 🧪 Testing

### Basic Flow
1. **Login** at `/login`
2. **Navigate** to `/chat`
3. **Create Session** - Click "New Chat"
4. **Send Message** - Type and press Enter
5. **View Response** - See streaming AI response
6. **Check Sources** - View RAG citations below response

### Advanced Tests
- Test markdown: Send code blocks, tables, lists
- Test keyboard: Use Enter to send, Shift+Enter for newline
- Test mobile: Resize browser, test sidebar toggle
- Test sessions: Create multiple, switch between them
- Test rename: Click edit icon, change title
- Test delete: Click trash icon, confirm deletion

## 🔧 Customization

### Change AI Model
Edit `/config/ai.ts`:
```typescript
export const GPT_MODEL = OpenAIModel.GPT_4O; // or GPT_4O_MINI
```

### Adjust RAG Settings
Edit `/config/ai.ts`:
```typescript
export const RAG_CONFIG = {
  topK: 5,                    // Number of chunks to retrieve
  similarityThreshold: 0.7,   // Minimum similarity score
  maxContextChunks: 3,        // Max chunks in prompt
  maxContextLength: 2000,     // Max total characters
};
```

### Customize Styling
Components use Tailwind CSS and shadcn/ui:
- Edit component files in `/components/chat/`
- Modify className props
- Update theme in `tailwind.config.ts`

### Add Features
1. **Message Editing**: Extend `MessageBubble` with edit mode
2. **Voice Input**: Add Web Speech API to `ChatInput`
3. **Export Chat**: Add download button in `SessionSidebar`
4. **Search**: Add search bar in `MessageList`

## 📊 Database Schema

### chat_sessions
```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### chat_messages
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  sources JSONB,
  token_count INTEGER,
  model TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🐛 Troubleshooting

### "Unauthorized" Error
- Ensure user is logged in at `/login`
- Check `.env.local` has correct Supabase keys
- Verify RLS policies allow user access

### Streaming Not Working
- Check `OPENAI_API_KEY` in `.env.local`
- Verify API route is accessible at `/api/chat`
- Check browser console for errors

### RAG Sources Not Showing
- Upload documents in admin panel
- Verify embeddings are generated
- Check `match_documents` function in Supabase

### Messages Not Persisting
- Check Supabase database connection
- Verify `chat_sessions` and `chat_messages` tables exist
- Check console for database errors

### Styling Issues
- Run `npm install` to ensure all dependencies
- Check Tailwind CSS is configured
- Verify shadcn/ui components are installed

## 📚 API Reference

### POST /api/chat
Send a message and receive streaming response.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "sessionId": "uuid",
  "userId": "uuid",
  "includeRag": true
}
```

**Response:**
```
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
X-Sources: [{"documentId":"...","documentTitle":"...","similarity":0.85}]

[Streaming response text...]
```

### Server Actions

**createSession(title?: string)**
```typescript
const { session, error } = await createSession("My Chat");
```

**getSessions()**
```typescript
const { sessions, error } = await getSessions();
```

**getSessionMessages(sessionId: string)**
```typescript
const { messages, error } = await getSessionMessages(sessionId);
```

**deleteSession(sessionId: string)**
```typescript
const { success, error } = await deleteSession(sessionId);
```

**updateSessionTitle(sessionId: string, title: string)**
```typescript
const { success, error } = await updateSessionTitle(sessionId, "New Title");
```

## 🎨 Component Props

### ChatInterface
```typescript
interface ChatInterfaceProps {
  initialSessions: ChatSession[];
  userId: string;
  className?: string;
}
```

### ChatInput
```typescript
interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}
```

### MessageList
```typescript
interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  className?: string;
}
```

### SourceCitations
```typescript
interface SourceCitationsProps {
  sources: SourceReference[];
  className?: string;
}
```

## 🚦 Next Steps

1. **Upload Documents**: Add documents in admin panel for RAG
2. **Test Chat**: Send messages and verify streaming works
3. **Customize UI**: Adjust styling to match your brand
4. **Add Features**: Implement message editing, voice input, etc.
5. **Deploy**: Deploy to Vercel or your preferred host

## 📖 Additional Resources

- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [React Markdown Docs](https://github.com/remarkjs/react-markdown)
- [Shadcn/ui Docs](https://ui.shadcn.com)

## 💡 Tips

1. **Session Titles**: Auto-generate from first message for better UX
2. **Token Tracking**: Store token counts for usage analytics
3. **Rate Limiting**: Implement per-user rate limits
4. **Caching**: Cache RAG results for common queries
5. **Analytics**: Track message counts, response times, user engagement

## ✅ Checklist

- [x] Dependencies installed
- [x] API route created
- [x] Server actions implemented
- [x] Components built
- [x] Chat page created
- [x] Database schema ready
- [ ] Test streaming responses
- [ ] Upload test documents
- [ ] Verify RAG integration
- [ ] Test on mobile
- [ ] Deploy to production

---

**Status**: ✅ Implementation Complete

All files created successfully. The chat interface is ready to use!
