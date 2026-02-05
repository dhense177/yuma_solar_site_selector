# Deploying Backend to Render

Render is an excellent choice for deploying your Python FastAPI backend. It's easy to set up and works well with your current setup.

## Why Render?

- ✅ **No timeout limits** (unlike Vercel serverless)
- ✅ **Free tier available** (with limitations)
- ✅ **Easy GitHub integration**
- ✅ **Automatic deployments**
- ✅ **Supports long-running processes**
- ✅ **Good for streaming responses**

## Step-by-Step Deployment

### Step 1: Prepare Your Backend

Your backend is already set up! The files you need are:
- `backend/api_server.py` - Your FastAPI application
- `backend/requirements.txt` or `pyproject.toml` - Dependencies
- `backend/Procfile` - Already created for you

### Step 2: Create requirements.txt (if needed)

If you're using `pyproject.toml`, Render can use it, but you can also create a `requirements.txt` in the `backend/` directory:

```bash
cd backend
pip freeze > requirements.txt
```

Or create it manually with your dependencies:

```txt
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
pydantic>=2.0.0
python-dotenv>=1.0.0
langchain>=0.3.0
langchain-community>=0.3.26
langchain-core>=0.3.67
langchain-openai>=0.3.27
langgraph>=0.5.0
psycopg2-binary>=2.9.11
geoalchemy2>=0.18.0
sqlalchemy>=2.0.0
shapely>=2.0.0
python-multipart>=0.0.6
```

### Step 3: Sign Up for Render

1. Go to [render.com](https://render.com)
2. Sign up (you can use GitHub to sign in)
3. Verify your email

### Step 4: Create a New Web Service

1. **Click "New +"** → **"Web Service"**
2. **Connect your GitHub repository:**
   - If not connected, click "Configure account" and authorize Render
   - Select your repository: `yuma_solar_site_selector`
3. **Configure the service:**

   **Basic Settings:**
   - **Name**: `solar-backend` (or any name you prefer)
   - **Region**: Choose closest to your users (e.g., `Oregon (US West)`)
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend` ⚠️ **Important!**
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -e .` or `pip install -r requirements.txt`
   - **Start Command**: `python api_server.py` or `uvicorn api_server:api_app --host 0.0.0.0 --port $PORT`

   **Advanced Settings (optional):**
   - **Auto-Deploy**: `Yes` (deploys on every push to main)
   - **Health Check Path**: `/api/health`

### Step 5: Add Environment Variables

In the Render dashboard, go to your service → **Environment** tab, and add:

**Required:**
```
SUPABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
# OR use individual variables:
DB_HOST=your-db-host
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=postgres
DB_PORT=5432

OPENAI_API_KEY=your-openai-api-key
```

**Optional:**
```
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
```

**Important Notes:**
- Render automatically sets `PORT` environment variable - your code already handles this!
- Never commit secrets to your repository
- Use Render's environment variables for all sensitive data

### Step 6: Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Install dependencies
   - Start your application
3. Wait for deployment to complete (usually 2-5 minutes)
4. You'll get a URL like: `https://solar-backend.onrender.com`

### Step 7: Update Vercel Configuration

Once your backend is deployed:

1. **Get your Render URL**: `https://your-service-name.onrender.com`
2. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
3. **Add/Update:**
   ```
   BACKEND_API_URL=https://your-service-name.onrender.com
   ```
4. **Redeploy Vercel** to pick up the new environment variable

### Step 8: Test Your Deployment

1. **Test backend health:**
   ```bash
   curl https://your-service-name.onrender.com/api/health
   ```

2. **Test from your Vercel frontend:**
   - Visit your Vercel deployment
   - Try a search query
   - Check browser console for errors

## Render Free Tier Limitations

The free tier has some limitations:
- ⚠️ **Spins down after 15 minutes of inactivity** - first request after spin-down takes ~30 seconds
- ⚠️ **Limited resources** - may be slower than paid plans
- ⚠️ **No custom domains** on free tier

**Solutions:**
- Use a **paid plan** ($7/month) for always-on service
- Or use a **cron job** to ping your service every 10 minutes to keep it warm
- Or accept the cold start delay (users will wait ~30 seconds on first request)

## Keeping Free Tier Warm (Optional)

If you're on the free tier, you can use a service like [cron-job.org](https://cron-job.org) to ping your backend every 10 minutes:

1. Create a cron job
2. Set URL: `https://your-service-name.onrender.com/api/health`
3. Set frequency: Every 10 minutes

## Troubleshooting

### Build Fails

**Error: "Module not found"**
- Make sure `Root Directory` is set to `backend`
- Check that `requirements.txt` or `pyproject.toml` is in the `backend/` directory
- Verify all dependencies are listed

**Error: "Command not found: python"**
- Try `python3` instead of `python` in Start Command
- Or use: `python3 api_server.py`

### Service Won't Start

**Check logs:**
- Go to Render Dashboard → Your Service → Logs
- Look for error messages

**Common issues:**
- Missing environment variables
- Database connection issues
- Port binding errors (should use `$PORT`)

### Database Connection Issues

**If using Supabase:**
- Make sure `SUPABASE_URL` is set correctly
- Check that your Supabase project allows connections from Render's IPs
- Verify the connection string format: `postgresql://postgres:password@host:5432/postgres`

### Timeout Errors

**If requests timeout:**
- Check Render logs for slow queries
- Consider upgrading to a paid plan for better performance
- Optimize your database queries

## Upgrading to Paid Plan

For production, consider the **Starter plan ($7/month)**:
- ✅ Always-on (no spin-down)
- ✅ Better performance
- ✅ Custom domains
- ✅ More resources

## Render vs Railway

Both are great options:

**Render:**
- ✅ Free tier available
- ✅ Easy setup
- ⚠️ Spins down on free tier

**Railway:**
- ✅ Pay-as-you-go pricing
- ✅ No spin-down
- ⚠️ Slightly more complex setup

**Recommendation:** Start with Render free tier, upgrade to paid if you need always-on service.

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Get your Render URL
3. ✅ Set `BACKEND_API_URL` in Vercel
4. ✅ Test your application
5. ✅ Consider upgrading to paid plan for production

## Quick Reference

**Render Service URL Format:**
```
https://your-service-name.onrender.com
```

**Health Check:**
```
https://your-service-name.onrender.com/api/health
```

**API Endpoint:**
```
https://your-service-name.onrender.com/api/search
```

**Vercel Environment Variable:**
```
BACKEND_API_URL=https://your-service-name.onrender.com
```
