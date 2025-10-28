import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "AI Chatbots - Document Q&A with RAG",
    template: "%s | AI Chatbots"
  },
  description: "Upload your documents (PDF, DOCX, TXT) and chat with an AI assistant powered by OpenAI GPT-4 and vector search. Get instant, accurate answers from your own content using Retrieval-Augmented Generation (RAG).",
  keywords: ["AI chatbot", "RAG", "document Q&A", "vector search", "OpenAI GPT-4", "PDF chat", "document analysis", "Next.js", "Supabase", "pgvector"],
  authors: [{ name: "Alex Sole Carretero" }],
  creator: "Alex Sole Carretero",
  publisher: "Alex Sole Carretero",
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://chatbot.aistudios.pro",
    title: "AI Chatbots - Smart Document Q&A",
    description: "Upload documents and get instant answers from AI. Built with OpenAI GPT-4, Next.js 16, Supabase, and pgvector for powerful document search.",
    siteName: "AI Chatbots",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "AI Chatbots - Smart Document Q&A",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Chatbots - Smart Document Q&A",
    description: "Upload documents and chat with AI. Powered by OpenAI GPT-4 and vector search.",
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
