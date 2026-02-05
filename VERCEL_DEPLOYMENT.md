# Vercel Deployment Guide

## Overview

Vercel is a serverless platform that runs Next.js applications. However, **your Python FastAPI backend cannot run on Vercel** - it needs to be deployed separately to a platform that supports long-running Python processes.

## Architecture

- **Frontend**: Deployed on Vercel (Next.js)
- **Backend**: Deployed separately (Railway, Render, Fly.io, etc.)
- **Database**: Supabase (already configured)

## Step 1: Deploy Backend Separately

You have several options for deploying the Python backend:

### Option A: Railway (Recommended - Easiest)

1. **Sign up**: [railway.app](https://railway.app)
2. **Create new project** → "Deploy from GitHub repo"
3. **Select your repository**
4. **Configure:**
   - Root Directory: `backend`
   - Build Command: `pip install -e .`
   - Start Command: `python api_server.py` or `uvicorn api_server:api_app --host 0.0.0.0 --port $PORT`
5. **Add environment variables** in Railway dashboard:
   - `SUPABASE_URL` or database connection variables
   - `OPENAI_API_KEY`
   - `ALLOWED_ORIGINS` (optional)
6. **Deploy** - Railway will give you a URL like `https://your-app.railway.app`

### Option B: Render

1. **Sign up**: [render.com](https://render.com)
2. **Create new Web Service**
3. **Connect your GitHub repository**
4. **Configure:**
   - Environment: Python 3
   - Build Command: `pip install -e .`
   - Start Command: `cd backend && python api_server.py`
5. **Add environment variables**
6. **Deploy** - Render will give you a URL

### Option C: Fly.io

1. **Install Fly CLI**: `curl -L https://fly.io/install.sh | sh`
2. **Create `fly.toml`** in the backend directory
3. **Deploy**: `fly deploy`
4. See [Fly.io Python docs](https://fly.io/docs/languages-and-frameworks/python/)

### Option D: Google Cloud Run / AWS Lambda / Azure Functions

These require more setup but are also viable options.

## Step 2: Configure Vercel Environment Variables

Once your backend is deployed, you need to configure Vercel:

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Add these variables:**

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   BACKEND_API_URL=https://your-backend-url.railway.app  # Your deployed backend URL
   NEXT_PUBLIC_API_URL=  # Leave empty for same-origin requests
   ```

   **Important Notes:**
   - `BACKEND_API_URL` should be your deployed backend URL (from Railway/Render/etc.)
   - `NEXT_PUBLIC_API_URL` should be **empty** or not set - this allows the frontend to use relative URLs
   - The Next.js API route (`/app/api/search/route.ts`) will proxy to `BACKEND_API_URL`

3. **Redeploy** your Vercel project after adding environment variables

## Step 3: Update CORS in Backend

Make sure your backend allows requests from your Vercel domain:

In `backend/api_server.py`, the CORS is already configured to allow all origins:
```python
api_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # This should work, but you can restrict to your Vercel domain
    ...
)
```

For production, you might want to restrict it:
```python
allowed_origins = [
    "https://your-app.vercel.app",
    "https://your-custom-domain.com"
]
api_app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    ...
)
```

## Step 4: Deploy Frontend to Vercel

1. **Push your code to GitHub** (if not already)

2. **Import project in Vercel:**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository

3. **Configure build settings:**
   - Framework Preset: Next.js
   - Root Directory: `.` (project root)
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Add environment variables** (as described in Step 2)

5. **Deploy**

## Step 5: Verify Deployment

1. **Test backend health:**
   ```bash
   curl https://your-backend-url.railway.app/api/health
   ```

2. **Test frontend:**
   - Visit your Vercel deployment URL
   - Try a search query
   - Check browser console for errors

3. **Check Vercel logs:**
   - Go to Vercel Dashboard → Your Project → Logs
   - Look for any errors in the API route

## Troubleshooting

### Backend returns 503

- Check that backend is deployed and running
- Verify `BACKEND_API_URL` is set correctly in Vercel
- Test backend directly: `curl https://your-backend-url/api/health`

### CORS errors

- Check backend CORS configuration
- Verify `ALLOWED_ORIGINS` includes your Vercel domain
- Check browser console for specific CORS error messages

### Environment variables not working

- Make sure variables are set in Vercel (not just `.env.local`)
- Redeploy after adding environment variables
- Check variable names match exactly (case-sensitive)

### Timeout errors

- Backend might be slow to respond
- Check backend logs for errors
- Consider increasing timeout in `app/api/search/route.ts`

## Quick Checklist

- [ ] Backend deployed to Railway/Render/etc.
- [ ] Backend URL obtained and working
- [ ] `BACKEND_API_URL` set in Vercel environment variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in Vercel
- [ ] CORS configured in backend to allow Vercel domain
- [ ] Frontend deployed to Vercel
- [ ] Tested search functionality

## Example Environment Variables for Vercel

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
BACKEND_API_URL=https://solar-backend-production.railway.app
```

**Note:** Do NOT set `NEXT_PUBLIC_API_URL` - leave it unset so the frontend uses relative URLs.
