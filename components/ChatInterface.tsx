"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Send, Loader2, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  sql_explanation?: string;
}

interface Parcel {
  address: string;
  county: string;
  acreage: number;
  municipality: string;
  owner_name: string;
  total_value: number;
  capacity: number;
  explanation: string;
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

interface ChatInterfaceProps {
  onParcelsFound: (parcels: Parcel[]) => void;
}

const SUGGESTED_PROMPTS = [
  "Find parcels with at least 50 MW of ground-mount capacity in Worcester county",
  "Find me 20+ acre sites within industrial zones in Franklin County",
  "Search for 25+ acre parcels within 1 km of a substation in Pittsfield, MA",
  "Find parcels over 30 acres in Franklin county that are at least 2km from any wetlands or flood zones"
];

// Use relative path for same-origin (Vercel) or environment variable for different origin
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

const ChatInterface = ({ onParcelsFound }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const handleSubmit = async (queryText?: string) => {
    const query = queryText || input;
    if (!query.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: query };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      console.log(`Sending request to ${API_BASE_URL}/api/search`);
      console.log('Query:', query);
      
      const response = await fetch(`${API_BASE_URL}/api/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query,
          session_id: sessionId || undefined
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorDetails: any = null;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.error || errorMessage;
          errorDetails = errorData.details || errorData;
          console.error('API error response:', errorData);
        } catch (e) {
          // Response is not JSON, try to get text
          try {
            const errorText = await response.text();
            console.error('API error (non-JSON):', errorText);
            errorMessage = errorText || errorMessage;
          } catch (e2) {
            console.error('Failed to parse error response:', e2);
            errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
          }
        }
        
        // Check for specific error codes
        if (response.status === 503 || response.status === 502) {
          errorMessage = `Backend server is not available (${response.status}). Make sure the backend is running on port 8000.`;
        }
        
        console.error('API error:', errorMessage);
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).details = errorDetails;
        throw error;
      }

      // Handle streaming response (Server-Sent Events)
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let data: any = null;
      const HEARTBEAT_TIMEOUT = 90000; // 90 seconds without data = timeout
      let lastDataTime = Date.now();
      let streamTimeoutId: NodeJS.Timeout | null = null;
      let streamTimedOut = false;

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      // Helper to reset timeout
      const resetTimeout = () => {
        if (streamTimeoutId) {
          clearTimeout(streamTimeoutId);
        }
        lastDataTime = Date.now();
        streamTimeoutId = setTimeout(() => {
          streamTimedOut = true;
          reader.cancel();
          console.error('Stream timeout - no data received for 90 seconds');
        }, HEARTBEAT_TIMEOUT);
      };

      // Start initial timeout
      resetTimeout();

      try {
        while (true) {
          if (streamTimedOut) {
            throw new Error('Stream timeout - no data received for 90 seconds. Possible causes:\n1. Render free tier spin-down (first request after inactivity takes ~30 seconds)\n2. Backend processing taking too long\n3. Database query timeout\n4. LLM API timeout\n\nCheck Render logs for backend errors.');
          }

          const { done, value } = await reader.read();
          
          if (done) {
            clearTimeout(streamTimeoutId!);
            break;
          }
          
          // Reset timeout on data received
          resetTimeout();

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6);
                const event = JSON.parse(jsonStr);
                
                if (event.type === 'status') {
                  // Update current step
                  setCurrentStep(event.step);
                  console.log('Status update:', event.step);
                } else if (event.type === 'result') {
                  // Final result received
                  data = event;
                  clearTimeout(streamTimeoutId!);
                  break; // Exit loop when result received
                } else if (event.type === 'error') {
                  clearTimeout(streamTimeoutId!);
                  throw new Error(event.error);
                }
              } catch (e) {
                console.error('Error parsing SSE event:', e);
              }
            }
          }
          
          // If we got the result, break out of the while loop
          if (data) break;
        }
        
        // Clear timeout when done
        if (streamTimeoutId) {
          clearTimeout(streamTimeoutId);
        }
      } catch (streamError) {
        if (streamTimeoutId) {
          clearTimeout(streamTimeoutId);
        }
        // Re-throw the error
        throw streamError;
      }

      // Process remaining buffer
      if (buffer.startsWith('data: ')) {
        try {
          const jsonStr = buffer.slice(6);
          const event = JSON.parse(jsonStr);
          if (event.type === 'result') {
            data = event;
          }
        } catch (e) {
          console.error('Error parsing final SSE event:', e);
        }
      }

      if (!data) {
        // Check if we got any status updates
        if (currentStep) {
          throw new Error(`Query started but did not complete. Last status: "${currentStep}". This may indicate:\n1. Render free tier spin-down (first request after inactivity takes ~30 seconds)\n2. Backend timeout or error\n3. Database query taking too long\n\nCheck Render logs for more details.`);
        }
        throw new Error('No data received from server. The backend may not be responding. Check if Render service is running.');
      }

      console.log('Response from API:', data);

      // Store session ID for conversation continuity
      if (data.session_id) {
        setSessionId(data.session_id);
        console.log('Stored session_id:', data.session_id);
      }

      // Indicate if this was a refinement
      const refinementNote = data.is_refinement ? "\n\n(Refining previous search...)" : "";

      // Check if there's an error (topic filter failure or other error)
      if (data.summary && data.summary.startsWith("Error: ")) {
        const errorMessage = data.summary.replace("Error: ", "");
        const assistantMessage: Message = {
          role: "assistant",
          content: errorMessage
        };
        setMessages(prev => [...prev, assistantMessage]);
        onParcelsFound([]); // Clear parcels on error
        return;
      }

      if (data.parcels && data.parcels.length > 0) {
        console.log('ChatInterface: Received parcels from API:', {
          count: data.parcels.length,
          firstParcel: data.parcels[0] ? {
            address: data.parcels[0].address,
            hasGeometry: !!data.parcels[0].geometry,
            geometryType: data.parcels[0].geometry?.type,
            hasCoordinates: !!data.parcels[0].geometry?.coordinates
          } : null
        });
        onParcelsFound(data.parcels);
        const assistantMessage: Message = {
          role: "assistant",
          content: (data.summary || `Found ${data.parcels.length} parcels matching your criteria.`) + refinementNote,
          sql_explanation: data.sql_explanation || undefined
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const assistantMessage: Message = {
          role: "assistant",
          content: (data.summary || "No parcels found matching your criteria. Try adjusting your search parameters.") + refinementNote,
          sql_explanation: data.sql_explanation || undefined
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error searching parcels:', error);
      
      let errorMessage = "Failed to search for parcels. Please try again.";
      let helpfulMessage = "";
      
      // Check for specific error types
      if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
        errorMessage = "Cannot connect to the backend server.";
        // Check if we're in production (Vercel) or development
        const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
        if (isProduction) {
          helpfulMessage = `The backend API is not available. This is a production deployment issue:\n\n1. The backend must be deployed separately (Railway, Render, Fly.io, etc.)\n2. BACKEND_API_URL must be set in Vercel environment variables\n3. Check VERCEL_DEPLOYMENT.md for deployment instructions`;
        } else {
          helpfulMessage = `The backend API at ${API_BASE_URL || 'http://localhost:8000'} is not reachable. Please make sure:\n\n1. The backend server is running (check terminal where you started it)\n2. The backend is running on port 8000\n3. Your .env.local has BACKEND_API_URL set correctly\n\nTo start the backend, run: cd backend && python api_server.py`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
        // Check if it's a connection error from the API route
        if (error.message.includes('Cannot connect to backend') || 
            error.message.includes('503') || 
            error.message.includes('502') ||
            (error as any).status === 503 ||
            (error as any).status === 502) {
          const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
          if (isProduction) {
            helpfulMessage = "The backend API is not available. Make sure the backend is deployed separately and BACKEND_API_URL is set in Vercel. See VERCEL_DEPLOYMENT.md for details.";
          } else {
            helpfulMessage = "The backend server is not running. Start it with: cd backend && python api_server.py";
          }
        }
        // Include details if available
        if ((error as any).details) {
          const details = typeof (error as any).details === 'string' 
            ? (error as any).details 
            : JSON.stringify((error as any).details);
          helpfulMessage = (helpfulMessage ? helpfulMessage + '\n\n' : '') + details;
        }
      }
      
      toast({
        title: "Connection Error",
        description: errorMessage + (helpfulMessage ? `\n\n${helpfulMessage}` : ''),
        variant: "destructive",
        duration: 10000, // Show longer for connection errors
      });
      
      const assistantErrorMessage: Message = {
        role: "assistant",
        content: `I encountered an error: ${errorMessage}${helpfulMessage ? `\n\n${helpfulMessage}` : ''}`
      };
      setMessages(prev => [...prev, assistantErrorMessage]);
    } finally {
      setIsLoading(false);
      setCurrentStep(null);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    // Clear session for new searches from suggested prompts
    setSessionId(null);
    setInput(prompt);
    handleSubmit(prompt);
  };

  const handleNewSearch = () => {
    // Clear session and messages to start fresh
    setSessionId(null);
    setMessages([]);
    setInput("");
    // Clear parcels on the map
    onParcelsFound([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Redo Search button */}
      {messages.length > 0 && (
        <div className="p-3 border-b bg-background/50">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewSearch}
            className="w-full gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Redo Search
          </Button>
        </div>
      )}
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center pt-4 pb-4">
              <img 
                src="/solar_panel.png" 
                alt="Solar Panel" 
                className="w-24 h-24 mx-auto mb-4 object-contain"
              />
              <h3 className="text-lg font-semibold mb-1">Find Parcels For Your Solar Project</h3>
              <p className="text-sm text-muted-foreground mb-0 text-left">
                Use suggested prompts below or ask your own question. Specify filters using precise language (i.e. &quot;20+ acres&quot; instead of &quot;large parcels&quot;).
              </p>
            </div>
            <div className="grid gap-2 -mt-2">
              {SUGGESTED_PROMPTS.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="text-left h-auto py-3 px-4 whitespace-normal justify-start hover:bg-accent"
                  onClick={() => handleSuggestedPrompt(prompt)}
                >
                  <span className="text-sm">{prompt}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <Card
              key={index}
              className={`p-4 ${
                message.role === "user"
                  ? "bg-primary/10 ml-8"
                  : "bg-muted/50 mr-8"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.role === "assistant" && message.sql_explanation && (
                <Collapsible 
                  open={expandedMessages.has(index)}
                  onOpenChange={(open) => {
                    const newExpanded = new Set(expandedMessages);
                    if (open) {
                      newExpanded.add(index);
                    } else {
                      newExpanded.delete(index);
                    }
                    setExpandedMessages(newExpanded);
                  }}
                >
                  <CollapsibleTrigger className="flex items-center gap-2 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    {expandedMessages.has(index) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    <span>Show explanation</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="text-xs text-muted-foreground bg-background/50 rounded-md p-3 border border-border">
                      <p className="whitespace-pre-wrap">{message.sql_explanation}</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </Card>
          ))
        )}
        {isLoading && (
          <Card className="p-4 bg-muted/50 mr-8">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <p className="text-sm text-muted-foreground">
                {currentStep || "Processing your query..."}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask about parcels (e.g., 'Find 20+ acre parcels in Franklin county...')"
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSubmit()}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="h-[60px] w-[60px] hover:opacity-90"
            style={{ backgroundColor: '#258222' }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
