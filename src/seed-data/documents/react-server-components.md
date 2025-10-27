# React Server Components: A Comprehensive Guide

## What Are React Server Components?

React Server Components (RSC) are a new paradigm in React that allows components to render on the server, separate from the client-side JavaScript bundle. They represent a fundamental shift in how we think about rendering React applications, enabling better performance, smaller bundle sizes, and improved data fetching patterns.

## Key Concepts

### Server vs. Client Components

**Server Components** (default in Next.js 13+ App Router):
- Render on the server
- Never re-render
- Can directly access backend resources
- Don't add to the client bundle
- Cannot use hooks or browser APIs
- Cannot have interactivity

**Client Components** (marked with `'use client'`):
- Render on both server and client
- Can use hooks and state
- Can handle interactivity
- Included in the client bundle
- Can import Server Components as children

## Benefits of Server Components

### 1. Reduced Bundle Size

Server Components don't ship JavaScript to the client:

```typescript
// This entire component and its dependencies stay on the server
import { db } from '@/lib/database'
import { Markdown } from 'markdown-library' // Won't increase bundle size!

export default async function BlogPost({ id }: { id: string }) {
  const post = await db.posts.findUnique({ where: { id } })

  return (
    <article>
      <h1>{post.title}</h1>
      <Markdown>{post.content}</Markdown>
    </article>
  )
}
```

### 2. Direct Backend Access

Server Components can directly access databases, APIs, and files:

```typescript
import { readFile } from 'fs/promises'
import { db } from '@/lib/prisma'

export default async function Dashboard() {
  // Direct database access
  const users = await db.user.findMany()

  // File system access
  const config = await readFile('./config.json', 'utf-8')

  return (
    <div>
      <h1>Dashboard</h1>
      <UserList users={users} />
    </div>
  )
}
```

### 3. Automatic Code Splitting

Each Server Component is automatically code-split:

```typescript
// Only loaded when this route is accessed
import HeavyComponent from '@/components/HeavyComponent'

export default async function Page() {
  return <HeavyComponent />
}
```

### 4. Improved Performance

- No hydration cost for Server Components
- Faster initial page load
- Reduced JavaScript execution on client
- Better Core Web Vitals scores

## When to Use Each Type

### Use Server Components For:

- Data fetching
- Accessing backend resources
- Keeping sensitive information secure (API keys, tokens)
- Large dependencies that don't need client-side
- Static content rendering

### Use Client Components For:

- Interactivity (onClick, onChange, etc.)
- State management (useState, useReducer)
- Effects (useEffect)
- Browser-only APIs (localStorage, etc.)
- Custom hooks
- Event listeners

## Patterns and Examples

### Pattern 1: Server Component with Client Component Children

```typescript
// app/page.tsx (Server Component)
import ClientButton from '@/components/ClientButton'

export default async function Page() {
  const data = await fetchData()

  return (
    <div>
      <h1>Server Rendered</h1>
      <ClientButton onClick={handleClick} />
    </div>
  )
}
```

```typescript
// components/ClientButton.tsx (Client Component)
'use client'

export default function ClientButton({
  onClick
}: {
  onClick: () => void
}) {
  return <button onClick={onClick}>Click me</button>
}
```

### Pattern 2: Passing Server Components as Props

```typescript
// Server Component
export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const data = await fetchData()

  return (
    <ClientLayout data={data}>
      {children}
    </ClientLayout>
  )
}
```

```typescript
// Client Component
'use client'

export default function ClientLayout({
  children,
  data,
}: {
  children: React.ReactNode
  data: Data
}) {
  const [state, setState] = useState(data)

  return <div>{children}</div>
}
```

### Pattern 3: Streaming with Suspense

```typescript
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <h1>My Page</h1>
      <Suspense fallback={<Skeleton />}>
        <SlowComponent />
      </Suspense>
    </div>
  )
}

async function SlowComponent() {
  const data = await slowFetch()
  return <div>{data}</div>
}
```

### Pattern 4: Parallel Data Fetching

```typescript
async function getData1() { /* ... */ }
async function getData2() { /* ... */ }

export default async function Page() {
  // Fetch in parallel
  const [data1, data2] = await Promise.all([
    getData1(),
    getData2(),
  ])

  return (
    <div>
      <Component1 data={data1} />
      <Component2 data={data2} />
    </div>
  )
}
```

## Data Fetching Strategies

### 1. Static Data (Build Time)

```typescript
// Cached by default
export default async function Page() {
  const data = await fetch('https://api.example.com/data')
    .then(res => res.json())

  return <div>{data}</div>
}
```

### 2. Dynamic Data (Request Time)

```typescript
// Opt out of caching
export default async function Page() {
  const data = await fetch('https://api.example.com/data', {
    cache: 'no-store'
  }).then(res => res.json())

  return <div>{data}</div>
}
```

### 3. Revalidated Data (ISR)

```typescript
// Revalidate every 60 seconds
export default async function Page() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 60 }
  }).then(res => res.json())

  return <div>{data}</div>
}
```

## Common Patterns and Anti-Patterns

### ✅ Good: Compose Server and Client Components

```typescript
// Server Component
export default async function Page() {
  const data = await getData()

  return (
    <div>
      <ServerSection data={data} />
      <ClientInteractive />
    </div>
  )
}
```

### ❌ Bad: Importing Server Components into Client Components

```typescript
'use client'

// This won't work!
import ServerComponent from './ServerComponent'

export default function ClientComponent() {
  return <ServerComponent />
}
```

### ✅ Good: Pass Server Components as Props

```typescript
'use client'

export default function ClientComponent({
  children,
}: {
  children: React.ReactNode
}) {
  return <div>{children}</div>
}

// Usage in Server Component
<ClientComponent>
  <ServerComponent />
</ClientComponent>
```

### ❌ Bad: Using Hooks in Server Components

```typescript
// Server Component - this won't work!
export default async function Page() {
  const [state, setState] = useState(0) // Error!

  return <div>{state}</div>
}
```

## Serialization Rules

Data passed from Server to Client Components must be serializable:

### ✅ Serializable:
- Strings, numbers, booleans
- Arrays and objects
- Dates (converted to strings)
- Plain objects

### ❌ Not Serializable:
- Functions
- Classes
- Symbols
- WeakMaps/WeakSets

```typescript
// Server Component
export default async function Page() {
  const data = {
    name: 'John',
    age: 30,
    onClick: () => {} // Error! Can't pass functions
  }

  return <ClientComponent data={data} />
}
```

## Best Practices

1. **Keep Server Components as Default**: Only add `'use client'` when needed
2. **Move Client Components Down**: Keep interactivity at the leaf nodes
3. **Fetch Where You Need**: Colocate data fetching with components
4. **Use Suspense for Streaming**: Show loading states progressively
5. **Leverage Parallel Fetching**: Fetch multiple resources simultaneously
6. **Minimize Client Bundle**: Keep heavy dependencies in Server Components
7. **Secure Sensitive Data**: Never expose secrets to Client Components

## Performance Tips

1. **Streaming**: Use Suspense boundaries to stream content progressively
2. **Partial Prerendering**: Combine static and dynamic content
3. **Caching**: Use appropriate cache strategies for different data types
4. **Code Splitting**: Server Components automatically split code
5. **Tree Shaking**: Dead code elimination works better with Server Components

## Conclusion

React Server Components represent a paradigm shift in building React applications. By rendering on the server by default and selectively adding client-side interactivity only where needed, we can build faster, more efficient applications with better user experiences. The key is understanding when to use each type of component and how to compose them effectively.
