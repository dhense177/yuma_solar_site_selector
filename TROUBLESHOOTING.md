# Troubleshooting Guide

## "fetch failed" or "Cannot connect to backend" Error

This error occurs when the frontend cannot reach the backend API server.

### Quick Diagnosis

1. **Check if backend is running:**
   ```bash
   curl http://localhost:8000/api/health
   ```
   
   If this fails, the backend is not running.

2. **Check backend logs:**
   Look at the terminal where you started the backend for any error messages.

3. **Check environment variables:**
   Make sure `.env.local` has:
   ```bash
   BACKEND_API_URL=http://localhost:8000
   ```

### Common Causes and Solutions

#### 1. Backend Server Not Running

**Symptom:** "fetch failed" or "Cannot connect to backend server"

**Solution:**
```bash
# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Start the backend
cd backend
python api_server.py
```

You should see output like:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### 2. Backend Running on Wrong Port

**Symptom:** Backend starts but frontend still can't connect

**Check:**
- Backend should be on port 8000
- Check the terminal output when starting backend
- Verify `BACKEND_API_URL` in `.env.local` matches the port

**Solution:**
- Make sure backend is running on port 8000
- Or update `.env.local` to match the actual port

#### 3. Environment Variables Not Loaded

**Symptom:** Frontend connects but gets wrong backend URL

**Solution:**
1. Make sure `.env.local` exists in the project root
2. Restart the Next.js dev server after changing `.env.local`:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

#### 4. Port Already in Use

**Symptom:** Backend fails to start with "Address already in use"

**Solution:**
```bash
# Find what's using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process or use a different port
```

#### 5. Python Dependencies Not Installed

**Symptom:** Backend fails to start with import errors

**Solution:**
```bash
source venv/bin/activate
pip install -e .
```

#### 6. Database Connection Issues

**Symptom:** Backend starts but API calls fail with database errors

**Solution:**
- Check database credentials in `.env.local`
- Verify database is accessible
- Test connection:
  ```bash
  # For Supabase
  psql "your-connection-string"
  
  # For local PostgreSQL
  psql -h localhost -U your-user -d your-database
  ```

### Step-by-Step Debugging

1. **Verify Backend is Running:**
   ```bash
   curl http://localhost:8000/api/health
   ```
   Should return JSON with status information.

2. **Check Frontend Console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for error messages
   - Check Network tab to see the failed request

3. **Check Backend Logs:**
   - Look at the terminal where backend is running
   - Check for error messages or stack traces

4. **Test API Route Directly:**
   ```bash
   curl -X POST http://localhost:8000/api/search \
     -H "Content-Type: application/json" \
     -d '{"query": "test query"}'
   ```

5. **Check Environment Variables:**
   ```bash
   # In backend terminal
   python -c "import os; from dotenv import load_dotenv; load_dotenv('.env.local'); print('BACKEND_API_URL:', os.getenv('BACKEND_API_URL'))"
   ```

### Expected Behavior

**When everything is working:**

1. Backend terminal shows:
   ```
   INFO:     Uvicorn running on http://0.0.0.0:8000
   Request: POST /api/search
   ```

2. Frontend console shows:
   ```
   Sending request to /api/search
   Response status: 200
   ```

3. Browser shows search results in the chat interface

### Still Having Issues?

1. **Check all logs:**
   - Backend terminal output
   - Frontend browser console
   - Network tab in DevTools

2. **Verify setup:**
   - All dependencies installed
   - Environment variables set correctly
   - Both servers running

3. **Try the start script:**
   ```bash
   ./start-dev.sh
   ```
   This will start both servers and show any errors.

4. **Check the LOCAL_DEPLOYMENT.md guide** for complete setup instructions.
