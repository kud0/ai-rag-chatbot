# Next.js App Router: Complete Guide

## Introduction to App Router

The Next.js App Router is a new paradigm introduced in Next.js 13+ that leverages React Server Components to provide a more powerful and flexible routing system. Unlike the traditional Pages Router, the App Router uses a file-system based router built on top of Server Components, supporting shared layouts, nested routing, loading states, error handling, and more.

## File System Routing

### Basic Structure

The App Router uses the `app` directory instead of the `pages` directory. Each folder represents a route segment that maps to a URL segment:

```
app/
├── page.tsx          # /
├── about/
│   └── page.tsx      # /about
├── blog/
│   ├── page.tsx      # /blog
│   └── [slug]/
│       └── page.tsx  # /blog/:slug
```

### Special Files

The App Router introduces several special files:

- **page.tsx**: Makes a route publicly accessible and defines the UI
- **layout.tsx**: Shared UI that wraps multiple pages
- **loading.tsx**: Loading UI using React Suspense
- **error.tsx**: Error handling UI
- **not-found.tsx**: 404 UI
- **route.ts**: API endpoints (replaces API routes)

## Dynamic Routes

### Single Dynamic Segment

Create dynamic routes using square brackets:

```typescript
// app/blog/[slug]/page.tsx
export default function BlogPost({
  params
}: {
  params: { slug: string }
}) {
  return <h1>Blog Post: {params.slug}</h1>
}
```

### Catch-All Segments

Use `[...slug]` for catch-all routes:

```typescript
// app/docs/[...slug]/page.tsx
export default function Docs({
  params
}: {
  params: { slug: string[] }
}) {
  return <div>Docs: {params.slug.join('/')}</div>
}
```

### Optional Catch-All

Use `[[...slug]]` for optional catch-all routes that also match the parent route.

## Layouts and Templates

### Root Layout

Every app must have a root layout in `app/layout.tsx`:

```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### Nested Layouts

Layouts can be nested for shared UI across route segments:

```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <nav>Dashboard Navigation</nav>
      {children}
    </div>
  )
}
```

Layouts preserve state, remain interactive, and don't re-render on navigation.

## Loading States

Create instant loading states using `loading.tsx`:

```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return <div>Loading dashboard...</div>
}
```

This automatically wraps the page in a React Suspense boundary.

## Error Handling

Handle errors gracefully with `error.tsx`:

```typescript
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

## Route Handlers

Create API endpoints using `route.ts`:

```typescript
// app/api/posts/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const posts = await fetchPosts()
  return NextResponse.json(posts)
}

export async function POST(request: Request) {
  const body = await request.json()
  const post = await createPost(body)
  return NextResponse.json(post, { status: 201 })
}
```

## Parallel Routes

Use parallel routes to render multiple pages in the same layout:

```
app/
├── @analytics/
│   └── page.tsx
├── @team/
│   └── page.tsx
└── layout.tsx
```

```typescript
export default function Layout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode
  analytics: React.ReactNode
  team: React.ReactNode
}) {
  return (
    <>
      {children}
      {analytics}
      {team}
    </>
  )
}
```

## Intercepting Routes

Intercept routes to show a route in a different context, useful for modals:

```
app/
├── feed/
│   └── page.tsx
├── photo/
│   └── [id]/
│       └── page.tsx
└── @modal/
    └── (..)photo/
        └── [id]/
            └── page.tsx
```

## Route Groups

Organize routes without affecting URL structure using parentheses:

```
app/
├── (marketing)/
│   ├── about/
│   └── blog/
└── (shop)/
    ├── products/
    └── cart/
```

This allows different layouts for different sections without changing URLs.

## Metadata and SEO

Define metadata for each page:

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Page',
  description: 'Page description',
}

export default function Page() {
  return <div>Content</div>
}
```

## Navigation

Use the `Link` component for client-side navigation:

```typescript
import Link from 'next/link'

export default function Nav() {
  return (
    <nav>
      <Link href="/about">About</Link>
      <Link href="/blog">Blog</Link>
    </nav>
  )
}
```

Or use the `useRouter` hook programmatically:

```typescript
'use client'
import { useRouter } from 'next/navigation'

export default function Button() {
  const router = useRouter()

  return (
    <button onClick={() => router.push('/dashboard')}>
      Dashboard
    </button>
  )
}
```

## Best Practices

1. **Server Components by Default**: Keep components as Server Components unless you need client-side interactivity
2. **Colocate Data Fetching**: Fetch data in the component that needs it
3. **Use Loading States**: Provide feedback during navigation and data fetching
4. **Handle Errors Gracefully**: Use error boundaries to prevent entire app crashes
5. **Optimize Metadata**: Use generateMetadata for dynamic SEO
6. **Leverage Route Groups**: Organize code without affecting URLs
7. **Use Parallel Routes**: Load multiple sections simultaneously

## Migration from Pages Router

Key differences when migrating:

- Move from `pages/` to `app/`
- Replace `getServerSideProps` with Server Components
- Replace `getStaticProps` with fetch in Server Components
- Update `_app.tsx` to `layout.tsx`
- Update API routes to route handlers
- Use `'use client'` directive for client components

The App Router represents a significant evolution in Next.js, providing better performance, more flexible routing, and improved developer experience.
