# Local Deployment Guide

This guide will help you set up and run the Solar Site Selector application locally.

## Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **Python 3.10+** - [Download](https://www.python.org/downloads/)
3. **PostgreSQL** (or Supabase account) - For the database
4. **OpenAI API Key** - For the LLM functionality

## Architecture Overview

- **Frontend**: Next.js 14 (runs on port 3000)
- **Backend**: FastAPI (runs on port 8000)
- **Database**: PostgreSQL (via Supabase or local PostgreSQL)

## Step 1: Install Frontend Dependencies

```bash
npm install
```

## Step 2: Install Backend Dependencies

```bash
# Create a virtual environment (recommended)
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install Python dependencies
pip install -e .
```

## Step 3: Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration (for authentication)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
BACKEND_API_URL=http://localhost:8000

# Database Configuration (choose one option below)

# Option 1: Supabase (recommended for development)
SUPABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
# OR use individual variables:
# DB_HOST=your-supabase-host
# DB_USER=postgres
# DB_PASSWORD=your-password
# DB_NAME=postgres
# DB_PORT=5432

# Option 2: Local PostgreSQL
DB_HOST=local
DB_USER=your-postgres-user
DB_PASSWORD=your-postgres-password
DB_NAME=your-database-name

# OpenAI API Key (required for SQL generation)
OPENAI_API_KEY=your-openai-api-key

# Optional: CORS origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project or select an existing one
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Go to **Settings** → **Database**
6. Copy the connection string → `SUPABASE_URL`

## Step 4: Set Up the Database

### Option A: Using Supabase (Easiest)

1. Your Supabase project already has PostgreSQL set up
2. Run the SQL scripts to create tables:
   - Go to Supabase Dashboard → **SQL Editor**
   - Run the SQL files from `backend/sql/`:
     - `parcels.sql`
     - `geographic_features.sql`
     - `infrastructure_features.sql`

### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database:
   ```bash
   createdb your-database-name
   ```
3. Run the database setup scripts:
   ```bash
   cd backend
   python db_actions/create_db.py
   python db_actions/populate_tables.py
   ```

## Step 5: Run the Backend Server

In a terminal, activate your virtual environment and run:

```bash
# Make sure you're in the project root
cd backend

# Run the FastAPI server
python api_server.py
```

Or using uvicorn directly:

```bash
uvicorn backend.api_server:api_app --reload --host 0.0.0.0 --port 8000
```

The backend should now be running at `http://localhost:8000`

### Verify Backend is Running

Test the health endpoint:
```bash
curl http://localhost:8000/api/health
```

## Step 6: Run the Frontend Server

In a **new terminal** (keep the backend running), run:

```bash
npm run dev
```

The frontend should now be running at `http://localhost:3000`

## Step 7: Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/health

## Troubleshooting

### Backend won't start

1. **Check Python version**: `python --version` (should be 3.10+)
2. **Check dependencies**: `pip list` to verify all packages are installed
3. **Check environment variables**: Make sure all required variables are set
4. **Check database connection**: Verify your database credentials are correct
5. **Check port 8000**: Make sure nothing else is using port 8000
   ```bash
   lsof -i :8000  # macOS/Linux
   netstat -ano | findstr :8000  # Windows
   ```

### Frontend can't connect to backend

1. **Check backend is running**: Visit `http://localhost:8000/api/health`
2. **Check environment variables**: Verify `BACKEND_API_URL` is set correctly
3. **Check CORS**: The backend should allow `http://localhost:3000`
4. **Check browser console**: Look for CORS or network errors

### Database connection errors

1. **Verify credentials**: Double-check your database connection string
2. **Check PostgreSQL is running**: 
   ```bash
   # macOS
   brew services list
   # Linux
   sudo systemctl status postgresql
   ```
3. **Test connection**: Try connecting with `psql` or a database client

### Import errors in Python

If you get import errors like `ModuleNotFoundError`, make sure:
1. You're in the correct directory
2. Your virtual environment is activated
3. Dependencies are installed: `pip install -e .`
4. Python path includes the project root

## Running Both Services with a Script

You can create a script to run both services simultaneously:

### macOS/Linux: `start-dev.sh`

```bash
#!/bin/bash

# Start backend in background
cd backend
python api_server.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
cd ..
npm run dev &
FRONTEND_PID=$!

# Wait for user interrupt
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop both services"

# Trap Ctrl+C and kill both processes
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

wait
```

Make it executable:
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### Windows: `start-dev.bat`

```batch
@echo off
start "Backend" cmd /k "cd backend && python api_server.py"
timeout /t 3 /nobreak >nul
start "Frontend" cmd /k "npm run dev"
echo Both services are running. Close the windows to stop them.
```

## Development Tips

1. **Backend auto-reload**: The backend uses `uvicorn --reload` for auto-reloading on code changes
2. **Frontend hot-reload**: Next.js has built-in hot module replacement
3. **Database migrations**: Use the scripts in `backend/db_actions/` to manage your database
4. **Environment variables**: Use `.env.local` for local development (already in `.gitignore`)

## Next Steps

- Set up your database schema using the SQL files in `backend/sql/`
- Populate your database with data using `backend/db_actions/populate_tables.py`
- Customize the prompts in `backend/prompts/text_to_sql_prompts.py`
- Test the API endpoints using the test scripts in `backend/tests/`

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [LangChain Documentation](https://python.langchain.com/)
