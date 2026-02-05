import { NextRequest, NextResponse } from 'next/server'

// This is a proxy route to your backend API
// Update the backend URL to point to your actual backend service
const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log the backend URL for debugging
    console.log(`[API Route] Proxying request to backend: ${BACKEND_URL}/api/search`)
    
    // Forward the request to your backend API
    const response = await fetch(`${BACKEND_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      // Add timeout and better error handling
      signal: AbortSignal.timeout(300000), // 5 minute timeout
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: errorText || 'Backend API error' },
        { status: response.status }
      )
    }

    // For streaming responses (Server-Sent Events)
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader()
          const decoder = new TextDecoder()

          if (!reader) {
            controller.close()
            return
          }

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value, { stream: true })
              controller.enqueue(new TextEncoder().encode(chunk))
            }
          } catch (error) {
            console.error('Stream error:', error)
          } finally {
            controller.close()
          }
        },
      })

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // For regular JSON responses
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('API route error:', error)
    
    // Provide more helpful error messages
    let errorMessage = 'Internal server error'
    let statusCode = 500
    
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      errorMessage = 'Request timeout - the backend server may be slow or unresponsive'
      statusCode = 504
    } else if (error.message?.includes('fetch failed') || error.code === 'ECONNREFUSED') {
      errorMessage = `Cannot connect to backend server at ${BACKEND_URL}. Make sure the backend is running on port 8000.`
      statusCode = 503
    } else if (error.message) {
      errorMessage = error.message
    }
    
    console.error(`[API Route] Error details:`, {
      message: errorMessage,
      backendUrl: BACKEND_URL,
      errorType: error.name,
      errorCode: error.code
    })
    
    // Provide helpful details for production
    let details: string | undefined = undefined;
    if (process.env.NODE_ENV === 'development') {
      details = `Backend URL: ${BACKEND_URL}. Check that the backend server is running.`;
    } else if (statusCode === 503) {
      // In production, provide deployment guidance
      details = `The backend API is not available. Make sure:\n1. The backend is deployed separately (Railway, Render, etc.)\n2. BACKEND_API_URL is set correctly in Vercel environment variables\n3. The backend URL is: ${BACKEND_URL}`;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: details
      },
      { status: statusCode }
    )
  }
}
