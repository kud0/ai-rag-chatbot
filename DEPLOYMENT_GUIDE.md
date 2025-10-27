# 🚀 Deployment Guide - AI RAG Chatbot

## 📋 Pre-Deployment Checklist

### 1. Database Setup (Supabase)

**Run Database Migrations:**

You have 3 SQL migration files that need to be executed in your Supabase database:

```bash
# Option 1: Using Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: iyrnokfrwmxuxplcnkmj
3. Go to SQL Editor
4. Run each migration file in order:
   - src/supabase/migrations/001_initial_schema.sql
   - src/supabase/migrations/002_rls_policies.sql
   - src/supabase/migrations/003_vector_functions.sql
```

**Enable pgvector Extension:**

```sql
-- Run this in Supabase SQL Editor first:
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Build Issues to Fix

**AI SDK v5 Compatibility:**

The AI SDK was updated to v5, which has breaking changes. You need to update two files:

**File 1: `/app/api/chat/route.ts`**

Replace the imports at the top:
```typescript
// OLD (v4):
import { OpenAIStream, StreamingTextResponse } from 'ai';

// NEW (v5):
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
```

Update the response logic (around line 60-80):
```typescript
// OLD:
const stream = OpenAIStream(response);
return new StreamingTextResponse(stream);

// NEW:
const result = streamText({
  model: openai('gpt-4o-mini'),
  messages: prompt,
  temperature: CHAT_CONFIG.temperature,
  maxTokens: CHAT_CONFIG.maxTokens,
});

return result.toTextStreamResponse();
```

**File 2: `/components/chat/chat-interface.tsx`**

Add 'use client' directive at the top:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useChat } from 'ai/react';
// ... rest of imports
```

**Install missing AI SDK provider:**
```bash
npm install @ai-sdk/openai
```

### 3. Seed Demo Data

```bash
# Generate demo documentation for testing
npm run seed
```

This will:
- Create 7 demo documents (Next.js, React, TypeScript, RAG, etc.)
- Generate ~70 embeddings
- Take ~30-60 seconds
- Cost ~$0.01 in OpenAI API calls

### 4. Test Locally

```bash
# Start development server
npm run dev

# Visit http://localhost:3000
```

**Test Flow:**
1. Sign up at `/signup`
2. Upload documents in `/admin/documents`
3. Test chat at `/chat`
4. Ask questions about your uploaded documents

---

## 🌐 Deploying to Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: AI RAG Chatbot"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `next build`
   - **Output Directory**: `.next`

### Step 3: Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://iyrnokfrwmxuxplcnkmj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5cm5va2Zyd214dXhwbGNua21qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjA2OTEsImV4cCI6MjA3NzEzNjY5MX0.IVsiFeqjitLGmqz6Cvbzx24bRm0CCKzOfpqmgNpRk8E
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5cm5va2Zyd214dXhwbGNua21qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU2MDY5MSwiZXhwIjoyMDc3MTM2NjkxfQ.0a19v0JN92IutPlqvKUq24uliMImEtp5hi1W6lIbNzo

# OpenAI
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**⚠️ IMPORTANT:** Never commit API keys to Git. The `.env.local` file is already in `.gitignore`.

### Step 4: Deploy

Click "Deploy" and wait for build to complete (~2-3 minutes).

### Step 5: Configure Supabase URL

After deployment, update `NEXT_PUBLIC_APP_URL` in Vercel with your actual deployment URL.

Also, add the Vercel URL to Supabase:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to "Site URL"
3. Add `https://your-app.vercel.app/auth/callback` to "Redirect URLs"

---

## 📊 What You've Built

### Features

✅ **AI-Powered RAG Chatbot**
- GPT-4o-mini for intelligent responses
- Real-time streaming (ChatGPT-like UX)
- Vector search with pgvector
- Source citations from documents

✅ **Authentication System**
- Email/password login
- Magic link authentication
- Protected routes
- User sessions

✅ **Document Management**
- Upload PDF, DOCX, TXT, MD files
- Automatic text chunking
- OpenAI embeddings generation
- Vector storage in Supabase

✅ **Admin Dashboard**
- Document library
- Analytics and metrics
- Vector search testing
- User management

✅ **Modern UI/UX**
- Dark/light mode
- Responsive design
- Loading states
- Error handling
- Markdown rendering with code highlighting

### Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase (PostgreSQL + pgvector)
- **Auth**: Supabase Auth
- **AI**: OpenAI GPT-4o-mini + text-embedding-3-small
- **Deployment**: Vercel

### File Structure

```
/app
  /(auth)          # Authentication pages
  /(app)           # Protected app routes
    /chat          # Chat interface
    /admin         # Admin dashboard
  /api             # API routes
  /actions         # Server actions

/components
  /auth            # Auth components
  /chat            # Chat UI components
  /admin           # Admin components
  /layout          # Navigation, theme

/lib
  /supabase        # Supabase clients
  /documents       # Document processing
  /rag             # RAG implementation
  /utils           # Utilities

/src/supabase
  /migrations      # Database migrations
```

---

## 🎥 Creating Your Upwork Portfolio

### Screenshots to Capture

1. **Landing Page** - Professional hero section
2. **Chat Interface** - Show streaming responses with sources
3. **Admin Dashboard** - Document management
4. **Analytics** - Show metrics and stats
5. **Mobile View** - Responsive design
6. **Dark Mode** - Theme switching

### Demo Video Script

1. **Intro (15s)**: "AI-powered documentation assistant with RAG"
2. **Auth (10s)**: Show login/signup
3. **Upload Docs (20s)**: Upload a document, show processing
4. **Chat Demo (30s)**: Ask questions, show streaming, highlight sources
5. **Admin (15s)**: Show dashboard, analytics
6. **Features (10s)**: Dark mode, mobile, search testing
7. **Outro (10s)**: Tech stack summary

### Portfolio Description

```markdown
# AI-Powered RAG Documentation Chatbot

Full-stack Next.js 16 application featuring:
- Retrieval Augmented Generation (RAG) with OpenAI
- Vector search using Supabase pgvector
- Real-time streaming chat interface
- Document management system
- Multi-user authentication
- Modern responsive UI with dark mode

**Tech**: Next.js 16, TypeScript, React 19, Supabase, OpenAI, Tailwind CSS, Shadcn/ui

**Features**: Real-time chat, vector embeddings, semantic search, admin dashboard, analytics
```

---

## 🐛 Troubleshooting

### Build Fails

**Issue**: AI SDK v5 compatibility
**Fix**: Follow "Build Issues to Fix" section above

### Database Errors

**Issue**: Tables don't exist
**Fix**: Run all 3 migration files in Supabase SQL Editor

### Auth Not Working

**Issue**: Redirect errors
**Fix**: Add your domain to Supabase URL Configuration

### Upload Fails

**Issue**: File too large
**Fix**: Max file size is 5MB (configurable in `/config/ai.ts`)

### No Search Results

**Issue**: No embeddings generated
**Fix**: Run `npm run seed` to generate demo data

---

## 💰 Estimated Costs

**OpenAI API:**
- Embeddings: $0.00002 per 1K tokens (~$0.01 for 10 documents)
- Chat: $0.15/$0.60 per 1M tokens (GPT-4o-mini)
- Typical usage: $5-10/month for demo

**Supabase:**
- Free tier: 500MB database, 2GB file storage
- Pro tier: $25/month (recommended for production)

**Vercel:**
- Hobby tier: Free (perfect for portfolio)
- Pro tier: $20/month (if you need more)

---

## 📞 Support

For issues or questions:
1. Check the README.md
2. Review documentation in `/docs/`
3. Check Supabase logs
4. Check Vercel deployment logs

---

## 🎯 Next Steps

1. ✅ Fix AI SDK compatibility issues
2. ✅ Run database migrations
3. ✅ Seed demo data
4. ✅ Test locally
5. ✅ Deploy to Vercel
6. ✅ Take screenshots
7. ✅ Record demo video
8. ✅ Update Upwork profile

**Good luck with your Upwork applications! 🚀**
