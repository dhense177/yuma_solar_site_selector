# Fixing "Network is unreachable" Error with Supabase

## The Problem

You're getting this error:
```
connection to server at "db.xxxxx.supabase.co" (2600:1f18:...), port 5432 failed: Network is unreachable
```

This happens because:
- Render is trying to connect via IPv6
- Supabase's direct connection (port 5432) may not be accessible via IPv6 from Render
- Network routing issues between Render and Supabase

## Solution: Use Connection Pooling

**Supabase Connection Pooler** (port 6543) is designed for serverless/cloud environments and has better network compatibility.

### Step 1: Get Connection Pooler URL

1. Go to **Supabase Dashboard** → Your Project
2. Go to **Settings** → **Database**
3. Scroll to **Connection pooling** section
4. Find **Connection string** → **URI** format
5. Copy the connection string - it should look like:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
   
   **Key differences:**
   - Host: `aws-0-us-east-1.pooler.supabase.com` (not `db.xxxxx.supabase.co`)
   - Port: `6543` (not `5432`)
   - User: `postgres.xxxxx` (includes project reference)

### Step 2: Update Render Environment Variable

1. Go to **Render Dashboard** → Your Service → **Environment**
2. Update `SUPABASE_URL` with the **connection pooler** URL:
   ```
   SUPABASE_URL=postgresql://postgres.xxxxx:your-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
3. **Save** - Render will automatically redeploy

### Step 3: Verify Connection

After redeploy, check Render logs. You should see:
```
Creating database engine (host: aws-0-us-east-1.pooler.supabase.com, port: 6543, database: postgres)
```

## Why Connection Pooling Works Better

- ✅ **Better network compatibility** - Works with IPv4/IPv6
- ✅ **Designed for serverless** - Handles connection lifecycle better
- ✅ **More reliable** - Better routing and failover
- ✅ **Recommended by Supabase** for cloud deployments

## Alternative: Direct Connection with IPv4

If you must use direct connection (port 5432), you can try:

1. **Check Supabase Network Settings:**
   - Go to Supabase Dashboard → Settings → Database
   - Check if there are IP restrictions
   - Make sure Render's IPs are allowed (or allow all)

2. **Use IPv4 explicitly:**
   - The code will try to connect, but if IPv6 is the issue, connection pooling is the better solution

## Quick Checklist

- [ ] Get connection pooler URL from Supabase (port 6543)
- [ ] Update `SUPABASE_URL` in Render with pooler URL
- [ ] Verify URL includes port `:6543`
- [ ] Save and wait for redeploy
- [ ] Check Render logs for successful connection

## Connection String Formats

**Direct Connection (port 5432) - May have IPv6 issues:**
```
postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

**Connection Pooler (port 6543) - Recommended:**
```
postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Use the connection pooler URL for Render!**
