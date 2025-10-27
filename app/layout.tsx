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
  title: {
    default: "RAG Chatbot - AI-Powered Document Chat",
    template: "%s | RAG Chatbot"
  },
  description: "Intelligent chatbot powered by Retrieval-Augmented Generation (RAG) technology. Upload documents and chat with AI to get instant answers from your content.",
  keywords: ["AI", "chatbot", "RAG", "document chat", "NLP", "artificial intelligence", "OpenAI", "vector search"],
  authors: [{ name: "Alex Sole Carretero" }],
  creator: "Alex Sole Carretero",
  publisher: "Alex Sole Carretero",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://your-domain.com",
    title: "RAG Chatbot - AI-Powered Document Chat",
    description: "Intelligent chatbot powered by Retrieval-Augmented Generation (RAG) technology.",
    siteName: "RAG Chatbot",
  },
  twitter: {
    card: "summary_large_image",
    title: "RAG Chatbot - AI-Powered Document Chat",
    description: "Intelligent chatbot powered by Retrieval-Augmented Generation (RAG) technology.",
    creator: "@yourusername",
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
