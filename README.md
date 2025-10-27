# RAG Chatbot - AI-Powered Document Chat

A modern, production-ready chatbot application powered by Retrieval-Augmented Generation (RAG) technology. Upload your documents and chat with an AI that understands your content.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![React](https://img.shields.io/badge/React-19.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green)
![OpenAI](https://img.shields.io/badge/OpenAI-Latest-orange)

## Features

### Core Functionality
- **RAG-Powered Chat**: Intelligent conversations grounded in your document content
- **Document Upload**: Support for PDF, DOCX, and TXT files with automatic processing
- **Vector Search**: Efficient similarity search using OpenAI embeddings and Supabase pgvector
- **Session Management**: Organized chat history with persistent sessions
- **Real-time Streaming**: Streaming AI responses for better UX

### User Experience
- **Modern UI**: Clean, responsive interface built with Tailwind CSS and Shadcn UI
- **Dark Mode**: System-aware theme with manual toggle
- **Mobile Responsive**: Fully optimized for mobile devices
- **Loading States**: Skeleton loaders for smooth transitions
- **Error Handling**: Comprehensive error boundaries and user-friendly messages

### Admin Dashboard
- **Document Management**: Upload, view, and delete documents
- **Analytics**: Track usage, token consumption, and chat metrics
- **User Management**: View and manage user accounts
- **Settings**: Configure system parameters and API keys

### Security & Auth
- **Supabase Authentication**: Secure email/password authentication
- **Protected Routes**: Server-side authentication checks
- **Row-Level Security**: Database-level access control
- **Environment Variables**: Secure credential management

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19.2
- **Styling**: Tailwind CSS 4.0
- **Components**: Shadcn UI (Radix UI primitives)
- **Icons**: Lucide React
- **Theme**: next-themes

### Backend
- **Database**: Supabase (PostgreSQL + pgvector)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **AI/ML**: OpenAI GPT-4 + Embeddings
- **Vector Search**: Supabase pgvector extension

### Developer Tools
- **Language**: TypeScript
- **Linting**: ESLint
- **Package Manager**: npm
- **Deployment**: Vercel (recommended)

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- npm or yarn package manager
- Supabase account ([supabase.com](https://supabase.com))
- OpenAI API key ([platform.openai.com](https://platform.openai.com))

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-chabots-example
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Enable the pgvector extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Run the database schema from `docs/database-schema.sql`
4. Enable Row Level Security on all tables
5. Set up storage bucket for documents

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Optional: Custom Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Where to find these values:**
- **Supabase URL & Keys**: Project Settings > API in your Supabase dashboard
- **OpenAI API Key**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
ai-chabots-example/
├── app/                      # Next.js App Router
│   ├── (app)/               # Authenticated app routes
│   │   ├── chat/            # Chat interface
│   │   └── admin/           # Admin dashboard
│   ├── (auth)/              # Authentication routes
│   │   ├── login/
│   │   ├── signup/
│   │   └── reset-password/
│   ├── actions/             # Server actions
│   ├── api/                 # API routes
│   │   ├── chat/            # Chat endpoint
│   │   ├── documents/       # Document processing
│   │   └── search/          # Vector search
│   ├── error.tsx            # Global error boundary
│   ├── not-found.tsx        # 404 page
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/              # React components
│   ├── auth/                # Authentication components
│   ├── chat/                # Chat interface components
│   ├── layout/              # Layout components
│   └── ui/                  # Shadcn UI components
├── lib/                     # Utility libraries
│   ├── supabase/            # Supabase clients
│   ├── openai/              # OpenAI utilities
│   └── utils.ts             # Helper functions
├── public/                  # Static assets
├── docs/                    # Documentation
└── .env.local              # Environment variables (create this)
```

## Usage

### For End Users

1. **Sign Up**: Create an account at `/signup`
2. **Upload Documents**: Go to Admin > Documents and upload your files
3. **Start Chatting**: Navigate to Chat and ask questions about your documents
4. **Manage Sessions**: Create new chat sessions or continue previous ones

### For Administrators

1. **Access Admin Dashboard**: Navigate to `/admin`
2. **View Analytics**: Monitor usage and performance metrics
3. **Manage Documents**: Upload, organize, and delete documents
4. **Configure Settings**: Adjust system parameters

## Features in Detail

### Document Processing

The app supports multiple document formats:
- **PDF**: Extracted using pdf-parse
- **DOCX**: Converted using mammoth.js
- **TXT**: Direct text processing

Processing pipeline:
1. File upload to Supabase Storage
2. Text extraction
3. Chunking (500 tokens per chunk, 50 token overlap)
4. Embedding generation via OpenAI
5. Storage in Supabase pgvector

### RAG Implementation

The Retrieval-Augmented Generation flow:
1. User sends a query
2. Query is embedded using OpenAI
3. Vector similarity search finds relevant document chunks
4. Context is injected into GPT-4 prompt
5. AI generates response based on context
6. Response streams back to user

### Chat Interface

Features:
- Real-time message streaming
- Session management
- Source attribution
- Message history
- Mobile-responsive design

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

```bash
# Or use Vercel CLI
npm i -g vercel
vercel
```

### Environment Variables for Production

Ensure all environment variables are set in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL` (your production URL)

### Build for Production

```bash
npm run build
npm run start
```

## Performance Optimization

- **Streaming Responses**: Reduces perceived latency
- **Efficient Vector Search**: pgvector with HNSW indexing
- **Edge Runtime**: Fast API routes on Vercel Edge
- **Optimized Chunking**: Balanced context size for accuracy
- **Caching**: Supabase queries cached where appropriate

## Security Best Practices

- ✅ Row-Level Security enabled on all tables
- ✅ Server-side authentication checks
- ✅ API keys stored in environment variables
- ✅ Input validation and sanitization
- ✅ HTTPS enforced in production
- ✅ CORS configured properly
- ✅ Rate limiting (via Vercel/Supabase)

## Troubleshooting

### Common Issues

**Build errors:**
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

**Database connection issues:**
- Verify Supabase URL and keys
- Check if pgvector extension is enabled
- Ensure Row Level Security policies are correct

**OpenAI API errors:**
- Verify API key is valid
- Check account has available credits
- Ensure model access (GPT-4, text-embedding-ada-002)

**Upload failures:**
- Check Supabase storage bucket exists
- Verify storage policies allow uploads
- Ensure file size is within limits

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Adding New Features

1. Create feature branch
2. Implement changes
3. Test thoroughly
4. Update documentation
5. Submit pull request

## Screenshots

<!-- Add screenshots here after deployment -->
- Landing Page: `[Screenshot placeholder]`
- Chat Interface: `[Screenshot placeholder]`
- Admin Dashboard: `[Screenshot placeholder]`
- Document Upload: `[Screenshot placeholder]`

## Roadmap

Future enhancements:
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features
- [ ] Custom AI model fine-tuning
- [ ] Webhook integrations
- [ ] API access for developers
- [ ] Mobile app (React Native)

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

**Alex Sole Carretero**
- Portfolio: [Your Portfolio URL]
- LinkedIn: [Your LinkedIn]
- GitHub: [@yourusername](https://github.com/yourusername)

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend infrastructure
- [OpenAI](https://openai.com/) - AI models
- [Shadcn UI](https://ui.shadcn.com/) - UI components
- [Vercel](https://vercel.com/) - Deployment platform

## Support

For support:
- Open an issue on GitHub
- Contact: your.email@example.com

---

Built with ❤️ using Next.js, Supabase, and OpenAI
