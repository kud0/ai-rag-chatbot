# Supabase Authentication: Complete Guide

## Introduction to Supabase Auth

Supabase Authentication provides a complete user management system with email/password, OAuth providers, magic links, and phone authentication. It's built on top of PostgreSQL with Row Level Security (RLS) for fine-grained access control. This guide covers everything you need to implement authentication in your applications.

## Why Supabase Auth?

### Benefits

- **Built-in User Management**: Complete user lifecycle management
- **Multiple Auth Methods**: Email, OAuth, magic links, phone
- **Row Level Security**: Database-level access control
- **JWT Tokens**: Secure, stateless authentication
- **Session Management**: Automatic token refresh
- **Email Templates**: Customizable email notifications
- **Multi-factor Authentication**: Additional security layer
- **Open Source**: Full control and transparency

## Getting Started

### Installation

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### Client Setup

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Next.js App Router Setup

For Next.js 13+ with Server Components:

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

## Email/Password Authentication

### Sign Up

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    emailRedirectTo: 'https://example.com/auth/callback',
    data: {
      first_name: 'John',
      last_name: 'Doe',
      age: 30
    }
  }
})

if (error) {
  console.error('Error signing up:', error.message)
} else {
  console.log('User created:', data.user)
  // User will receive confirmation email
}
```

### Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password',
})

if (error) {
  console.error('Error signing in:', error.message)
} else {
  console.log('User signed in:', data.user)
  console.log('Session:', data.session)
}
```

### Sign Out

```typescript
const { error } = await supabase.auth.signOut()

if (error) {
  console.error('Error signing out:', error.message)
}
```

## Magic Link Authentication

Send a passwordless magic link via email:

```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: 'https://example.com/auth/callback',
  }
})

if (error) {
  console.error('Error sending magic link:', error.message)
} else {
  console.log('Magic link sent to:', data)
  // User clicks link in email to sign in
}
```

## OAuth Authentication

### Available Providers

Supabase supports 20+ OAuth providers:
- Google
- GitHub
- Apple
- Facebook
- Twitter
- LinkedIn
- Discord
- And many more...

### OAuth Sign In

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://example.com/auth/callback',
    scopes: 'email profile',
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  }
})

if (error) {
  console.error('Error with OAuth:', error.message)
}
// User is redirected to provider for authentication
```

### OAuth Configuration

Enable OAuth providers in Supabase Dashboard:
1. Go to Authentication > Providers
2. Enable desired provider
3. Add Client ID and Client Secret
4. Add redirect URL to provider's settings

## Phone Authentication

```typescript
// Send OTP via SMS
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+1234567890',
})

if (error) {
  console.error('Error sending OTP:', error.message)
} else {
  // User receives SMS with OTP code
}

// Verify OTP
const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
  phone: '+1234567890',
  token: '123456', // User-provided OTP
  type: 'sms'
})
```

## Session Management

### Get Current User

```typescript
// Client-side
const { data: { user } } = await supabase.auth.getUser()

if (user) {
  console.log('Logged in as:', user.email)
} else {
  console.log('Not logged in')
}
```

### Get Session

```typescript
const { data: { session } } = await supabase.auth.getSession()

if (session) {
  console.log('Access token:', session.access_token)
  console.log('Refresh token:', session.refresh_token)
  console.log('Expires at:', session.expires_at)
}
```

### Auth State Changes

Listen for authentication events:

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    console.log('Auth event:', event)

    switch (event) {
      case 'SIGNED_IN':
        console.log('User signed in:', session?.user)
        break
      case 'SIGNED_OUT':
        console.log('User signed out')
        break
      case 'TOKEN_REFRESHED':
        console.log('Token refreshed')
        break
      case 'USER_UPDATED':
        console.log('User updated:', session?.user)
        break
    }
  }
)

// Cleanup
subscription.unsubscribe()
```

## User Management

### Update User

```typescript
const { data, error } = await supabase.auth.updateUser({
  email: 'newemail@example.com',
  password: 'new-secure-password',
  data: {
    first_name: 'Jane',
    avatar_url: 'https://example.com/avatar.jpg'
  }
})
```

### Password Recovery

```typescript
// Send password reset email
const { data, error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  {
    redirectTo: 'https://example.com/auth/reset-password',
  }
)

// After user clicks link, update password
const { data: updateData, error: updateError } = await supabase.auth.updateUser({
  password: 'new-secure-password'
})
```

### Resend Verification Email

```typescript
const { data, error } = await supabase.auth.resend({
  type: 'signup',
  email: 'user@example.com',
  options: {
    emailRedirectTo: 'https://example.com/auth/callback'
  }
})
```

## Server-Side Authentication

### Middleware (Next.js)

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*']
}
```

### API Route Protection

```typescript
// app/api/protected/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ user })
}
```

## Row Level Security (RLS)

### Enable RLS

```sql
-- Enable RLS on table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own posts
CREATE POLICY "Users can read own posts"
  ON posts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own posts
CREATE POLICY "Users can create posts"
  ON posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own posts
CREATE POLICY "Users can update own posts"
  ON posts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own posts
CREATE POLICY "Users can delete own posts"
  ON posts
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Public Read, Authenticated Write

```sql
-- Anyone can read
CREATE POLICY "Public posts are readable"
  ON posts
  FOR SELECT
  USING (true);

-- Only authenticated users can create
CREATE POLICY "Authenticated users can create"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

## Multi-Factor Authentication (MFA)

### Enroll MFA

```typescript
// Enroll TOTP (Authenticator app)
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp'
})

if (data) {
  console.log('QR Code:', data.totp.qr_code)
  console.log('Secret:', data.totp.secret)
  // Display QR code for user to scan
}

// Verify enrollment
const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
  factorId: data.id,
  code: '123456', // User-provided code from authenticator app
})
```

### Challenge MFA

```typescript
// Sign in triggers MFA challenge
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

if (data.session === null && data.user) {
  // MFA required
  const factors = await supabase.auth.mfa.listFactors()

  // Challenge a factor
  const { data: challengeData } = await supabase.auth.mfa.challenge({
    factorId: factors.data[0].id
  })

  // Verify challenge
  const { data: verifyData } = await supabase.auth.mfa.verify({
    factorId: factors.data[0].id,
    challengeId: challengeData.id,
    code: '123456'
  })
}
```

## Custom Claims and Metadata

### User Metadata

```typescript
// Set metadata during signup
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      first_name: 'John',
      last_name: 'Doe',
      avatar_url: 'https://example.com/avatar.jpg',
      age: 30
    }
  }
})

// Update metadata
const { data: updateData } = await supabase.auth.updateUser({
  data: {
    preferences: { theme: 'dark', language: 'en' }
  }
})

// Access metadata
const { data: { user } } = await supabase.auth.getUser()
console.log(user.user_metadata)
```

### App Metadata (Admin Only)

Set via Database or Admin API (not client-side):

```sql
UPDATE auth.users
SET raw_app_meta_data = '{"role": "admin", "permissions": ["read", "write"]}'
WHERE id = 'user-id';
```

## Best Practices

1. **Enable Email Confirmation**: Verify email addresses
2. **Use RLS**: Always enable Row Level Security
3. **Secure Passwords**: Enforce strong password policies
4. **Refresh Tokens**: Implement automatic token refresh
5. **Error Handling**: Provide clear error messages
6. **Rate Limiting**: Implement rate limiting on auth endpoints
7. **MFA**: Offer multi-factor authentication
8. **Audit Logs**: Track authentication events
9. **Session Management**: Clear sessions on sign out
10. **Environment Variables**: Never expose secrets

## Common Patterns

### Protected Page Component

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ProtectedPage() {
  const [user, setUser] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
      }
    }

    checkUser()
  }, [router, supabase])

  if (!user) {
    return <div>Loading...</div>
  }

  return <div>Welcome, {user.email}!</div>
}
```

### Auth Context Provider

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const AuthContext = createContext<{
  user: User | null
  signOut: () => Promise<void>
}>({
  user: null,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

## Conclusion

Supabase Authentication provides a complete, production-ready authentication system with minimal setup. It handles the complexity of user management, session handling, and security while giving you full control through Row Level Security and custom policies. Combined with Supabase's real-time database and storage, you can build secure, scalable applications quickly.
