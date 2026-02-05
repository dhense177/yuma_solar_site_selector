# Quick Start Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from: Supabase Dashboard → Settings → API

## 3. Run Locally

```bash
npm run dev
```

Visit: http://localhost:3000

## 4. Deploy to Vercel

### Via CLI:
```bash
npm i -g vercel
vercel
```

### Via Dashboard:
1. Push to GitHub
2. Import project on Vercel
3. Add environment variables in Vercel settings
4. Deploy!

## Common Tasks

### Query Database (Server Component)
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data } = await supabase.from('table').select('*')
```

### Query Database (Client Component)
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data } = await supabase.from('table').select('*')
```

### Get Current User
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### Sign Out
```typescript
const supabase = createClient()
await supabase.auth.signOut()
```
