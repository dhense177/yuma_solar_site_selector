# Solar Site Selector - Vercel + Supabase Template

A Next.js 14 template application configured for deployment on Vercel with Supabase database integration.

## Features

- ✅ Next.js 14 with App Router
- ✅ TypeScript configuration
- ✅ Supabase client and server-side utilities
- ✅ Authentication flow (login, signup, logout)
- ✅ Vercel deployment configuration
- ✅ Middleware for session management
- ✅ Example API routes
- ✅ Type-safe database queries
- ✅ Solar Site Selection UI with Chat Interface
- ✅ Interactive Map with Leaflet
- ✅ Tailwind CSS with shadcn/ui components
- ✅ Onboarding and feature modals

## Prerequisites

- Node.js 18+ installed
- A Supabase account ([sign up here](https://supabase.com))
- A Vercel account ([sign up here](https://vercel.com))

## Local Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Copy Public Assets

Copy the following assets from `/Users/davidhenslovitz/Projects/solar_deep_research/frontend/public/` to `/Users/davidhenslovitz/Projects/solar_site_selector/public/`:

- `yuma.png` - Logo image
- `solar_panel.png` - Solar panel icon
- `favicon.ico` - Favicon
- Any other assets you need

You can create the public directory and copy files:
```bash
mkdir -p public
cp /Users/davidhenslovitz/Projects/solar_deep_research/frontend/public/* public/
```

### 3. Set Up Supabase

1. Create a new project at [Supabase](https://app.supabase.com)
2. Go to **Settings** → **API** in your Supabase dashboard
3. Copy your project URL and anon/public key

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important:** Never commit `.env.local` to version control. It's already in `.gitignore`.

### 5. Configure Backend API URL

Set the backend API URL in your `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000  # or your backend URL
BACKEND_API_URL=http://localhost:8000  # for server-side API routes
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── auth/             # Authentication callbacks
│   ├── login/            # Login page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/           # React components
├── lib/
│   └── supabase/        # Supabase client utilities
│       ├── client.ts    # Client-side Supabase client
│       ├── server.ts    # Server-side Supabase client
│       └── middleware.ts # Middleware utilities
├── types/
│   └── supabase.ts      # TypeScript types for Supabase
├── middleware.ts        # Next.js middleware
├── vercel.json         # Vercel configuration
└── package.json
```

## Using Supabase

### Client-Side (Components)

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'

export default function MyComponent() {
  const supabase = createClient()
  
  // Use supabase client here
  const { data, error } = await supabase
    .from('your_table')
    .select('*')
}
```

### Server-Side (Server Components & API Routes)

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function MyPage() {
  const supabase = await createClient()
  
  // Use supabase client here
  const { data, error } = await supabase
    .from('your_table')
    .select('*')
}
```

### Generate TypeScript Types

To generate TypeScript types from your Supabase schema:

1. Install Supabase CLI: `npm install -g supabase`
2. Generate types: `supabase gen types typescript --project-id your-project-id > types/supabase.ts`

Or use the [Supabase TypeScript Generator](https://supabase.com/docs/guides/api/generating-types).

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub, GitLab, or Bitbucket
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click **Add New Project**
4. Import your repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click **Deploy**

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project directory
3. Follow the prompts
4. Add environment variables when prompted or via the dashboard

### Environment Variables on Vercel

Make sure to add your Supabase credentials in the Vercel project settings:

1. Go to your project on Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Authentication

The template includes a basic authentication flow:

- **Login Page**: `/login`
- **Sign Up**: Available on the login page
- **Auth Callback**: `/auth/callback` (handles OAuth redirects)
- **Protected Routes**: Modify `middleware.ts` to protect specific routes

### Customizing Authentication

To require authentication for all routes except login/auth, uncomment the protection logic in `lib/supabase/middleware.ts`.

## Database Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create your tables and schema
4. Update `types/supabase.ts` with your table types (or generate them automatically)

Example table:

```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

## API Routes

Example API route is available at `/api/example`. You can create more API routes in the `app/api/` directory.

## Troubleshooting

### "Invalid API key" error

- Verify your environment variables are set correctly
- Check that you're using the `anon` key (not the `service_role` key) for client-side operations

### Authentication not working

- Ensure your Supabase project has authentication enabled
- Check that the redirect URL in Supabase settings matches your Vercel deployment URL
- Verify environment variables are set in Vercel

### Build errors on Vercel

- Check that all environment variables are set in Vercel
- Ensure `package.json` has all required dependencies
- Review build logs in Vercel dashboard

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase + Next.js Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)

## License

MIT
