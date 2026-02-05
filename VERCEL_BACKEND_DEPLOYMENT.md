# Deploying Backend on Vercel (Serverless Functions)

## ⚠️ Important Limitations

**Vercel Serverless Functions have strict timeout limits:**
- **Hobby Plan**: 10 seconds maximum
- **Pro Plan**: 60 seconds maximum  
- **Enterprise**: Can be extended (contact Vercel)

**Your current backend:**
- Uses streaming responses (Server-Sent Events)
- Can take 30-60+ seconds for complex queries (multiple LLM calls, database queries)
- Has a 5-minute timeout configured in the frontend

**This means:**
- ❌ **Hobby plan won't work** - queries will timeout
- ⚠️ **Pro plan is risky** - complex queries may timeout
- ✅ **Enterprise plan** might work with extended timeouts

## Recommendation

**For production, deploy the backend separately** (Railway, Render, Fly.io) as described in `VERCEL_DEPLOYMENT.md`. This gives you:
- No timeout limits
- Better performance
- More reliable streaming
- Lower costs for long-running operations

## If You Still Want to Try Vercel Serverless

Here's how to convert your FastAPI backend to Vercel serverless functions:

### Step 1: Create Vercel Serverless Function

Create `api/search.py` in your project root:

```python
from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from api_server import api_app
from fastapi import Request
from fastapi.responses import StreamingResponse
import asyncio

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            # Create FastAPI request object
            # Note: This is a simplified version - full implementation is more complex
            from fastapi import Request as FastAPIRequest
            from starlette.requests import Request as StarletteRequest
            
            # Convert to async handler
            async def handle_request():
                request = FastAPIRequest(
                    scope={
                        'type': 'http',
                        'method': 'POST',
                        'path': '/api/search',
                        'headers': [(k.encode(), v.encode()) for k, v in self.headers.items()],
                    }
                )
                request._body = body
                
                # Call FastAPI app
                response = await api_app(request)
                
                # Stream response
                self.send_response(200)
                self.send_header('Content-Type', 'text/event-stream')
                self.send_header('Cache-Control', 'no-cache')
                self.send_header('Connection', 'keep-alive')
                self.end_headers()
                
                async for chunk in response.body_iterator:
                    self.wfile.write(chunk)
                    self.wfile.flush()
            
            # Run async handler
            asyncio.run(handle_request())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    def log_message(self, format, *args):
        # Suppress default logging
        pass
```

### Step 2: Update vercel.json

```json
{
  "functions": {
    "api/search.py": {
      "maxDuration": 60
    }
  },
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### Step 3: Install Python Runtime

Vercel will automatically detect Python files, but you may need a `requirements.txt` in the root:

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

### Step 4: Challenges You'll Face

1. **Streaming is complex** - Vercel serverless functions don't easily support Server-Sent Events
2. **Cold starts** - First request after inactivity can be slow (5-10 seconds)
3. **Timeout limits** - Even with Pro plan, 60 seconds may not be enough
4. **Memory limits** - Large dependencies (LangChain, etc.) may hit memory limits
5. **Database connections** - Connection pooling is harder in serverless

## Better Alternative: Hybrid Approach

Instead of converting everything, consider:

1. **Keep frontend on Vercel** (Next.js)
2. **Deploy backend to Railway/Render** (FastAPI)
3. **Use Vercel API routes as proxy** (current setup)

This gives you:
- ✅ Best of both worlds
- ✅ No timeout issues
- ✅ Better performance
- ✅ Easier to maintain

## Cost Comparison

**Vercel Pro Plan:**
- $20/month
- 60-second timeout limit
- May not work for your use case

**Railway:**
- Pay-as-you-go (~$5-20/month for moderate usage)
- No timeout limits
- Better suited for your backend

**Recommendation:** Use Railway for backend, Vercel for frontend.

## Conclusion

While technically possible, deploying your FastAPI backend to Vercel serverless functions is **not recommended** due to:
- Timeout limitations
- Streaming complexity
- Cold start issues
- Better alternatives available

**Stick with the separate backend deployment** as outlined in `VERCEL_DEPLOYMENT.md`.
