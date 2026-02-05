# Quick Start - Local Development

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Python 3.10+ installed
- [ ] PostgreSQL or Supabase account
- [ ] OpenAI API key

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
# Frontend
npm install

# Backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -e .
```

### 2. Create `.env.local`

```bash
# Copy this template and fill in your values
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
BACKEND_API_URL=http://localhost:8000
SUPABASE_URL=postgresql://postgres:password@host:5432/postgres
OPENAI_API_KEY=your-openai-api-key
EOF
```

### 3. Start Both Servers

**Option A: Use the start script (easiest)**
```bash
./start-dev.sh
```

**Option B: Manual start (two terminals)**

Terminal 1 (Backend):
```bash
source venv/bin/activate
cd backend
python api_server.py
```

Terminal 2 (Frontend):
```bash
npm run dev
```

### 4. Open in Browser

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/health
- API Docs: http://localhost:8000/docs

## Common Commands

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
pip install -e .

# Run frontend only
npm run dev

# Run backend only
cd backend && python api_server.py

# Run both (using script)
./start-dev.sh

# Check backend health
curl http://localhost:8000/api/health
```

## Troubleshooting

**Backend won't start?**
- Check Python version: `python --version`
- Activate virtual environment: `source venv/bin/activate`
- Check environment variables in `.env.local`

**Frontend can't connect?**
- Make sure backend is running on port 8000
- Check `BACKEND_API_URL` in `.env.local`

**Import errors?**
- Make sure you're in the `backend` directory when running `python api_server.py`
- Or run from root: `python -m backend.api_server`

## Next Steps

1. Set up your database schema (see `LOCAL_DEPLOYMENT.md`)
2. Populate database with data
3. Test the API endpoints
4. Start developing!

For detailed instructions, see `LOCAL_DEPLOYMENT.md`.
