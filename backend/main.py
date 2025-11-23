from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from groq import Groq
import os
import json
import time
from collections import defaultdict
from dotenv import load_dotenv
from prompt import SYSTEM_PROMPT

# Load environment variables
load_dotenv()

# Read API key (may be empty during local testing)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if GROQ_API_KEY:
    # Initialize Groq client only when API key is provided
    client = Groq(api_key=GROQ_API_KEY)
    MODEL = "llama-3.3-70b-versatile"
else:
    client = None
    MODEL = None

# Create FastAPI app
app = FastAPI()

# Enhanced rate limiting configuration
RATE_LIMIT_REQUESTS = 5  # Reduced to 5 requests per window
RATE_LIMIT_WINDOW = 60  # 60 seconds (1 minute)
DAILY_LIMIT_REQUESTS = 50  # Maximum 50 requests per day per IP
DAILY_LIMIT_WINDOW = 86400  # 24 hours in seconds

# Token management
MAX_TOKENS_PER_REQUEST = 300  # Reduced from 500 to conserve API usage
MAX_INPUT_LENGTH = 500  # Maximum characters in user input
TOTAL_DAILY_TOKENS = 50000  # Total tokens allowed per day across all users

# Rate limiting stores
rate_limit_store = defaultdict(list)  # Short-term rate limiting (per minute)
daily_limit_store = defaultdict(list)  # Daily rate limiting
daily_token_usage = {"tokens": 0, "reset_time": time.time() + DAILY_LIMIT_WINDOW}


def get_client_ip(request: Request) -> str:
    """Extract client IP from request, considering proxies."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    return request.client.host if request.client else "unknown"


def reset_daily_tokens_if_needed():
    """Reset daily token counter if 24 hours have passed."""
    current_time = time.time()
    if current_time >= daily_token_usage["reset_time"]:
        daily_token_usage["tokens"] = 0
        daily_token_usage["reset_time"] = current_time + DAILY_LIMIT_WINDOW


def check_daily_token_limit(requested_tokens: int) -> tuple[bool, int]:
    """
    Check if adding requested tokens would exceed daily limit.
    Returns (is_allowed, remaining_tokens).
    """
    reset_daily_tokens_if_needed()
    
    remaining = TOTAL_DAILY_TOKENS - daily_token_usage["tokens"]
    if requested_tokens > remaining:
        return False, remaining
    
    return True, remaining


def add_token_usage(tokens: int):
    """Add tokens to daily usage counter."""
    reset_daily_tokens_if_needed()
    daily_token_usage["tokens"] += tokens


def check_rate_limit(ip: str) -> tuple[bool, int, str]:
    """
    Check if IP has exceeded rate limit (both short-term and daily).
    Returns (is_allowed, remaining_requests, limit_type).
    """
    current_time = time.time()
    
    # Check daily limit
    daily_limit_store[ip] = [
        timestamp for timestamp in daily_limit_store[ip]
        if current_time - timestamp < DAILY_LIMIT_WINDOW
    ]
    
    daily_count = len(daily_limit_store[ip])
    if daily_count >= DAILY_LIMIT_REQUESTS:
        return False, 0, "daily"
    
    # Check short-term limit
    rate_limit_store[ip] = [
        timestamp for timestamp in rate_limit_store[ip]
        if current_time - timestamp < RATE_LIMIT_WINDOW
    ]
    
    request_count = len(rate_limit_store[ip])
    if request_count >= RATE_LIMIT_REQUESTS:
        return False, 0, "minute"
    
    # Add current request timestamp to both stores
    rate_limit_store[ip].append(current_time)
    daily_limit_store[ip].append(current_time)
    
    remaining = min(
        RATE_LIMIT_REQUESTS - request_count - 1,
        DAILY_LIMIT_REQUESTS - daily_count - 1
    )
    return True, remaining, "ok"


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Apply rate limiting to chat endpoint."""
    # Only apply rate limiting to the chat endpoint
    if request.url.path == "/api/chat":
        client_ip = get_client_ip(request)
        is_allowed, remaining, limit_type = check_rate_limit(client_ip)
        
        if not is_allowed:
            if limit_type == "daily":
                message = f"Daily limit exceeded. You can make {DAILY_LIMIT_REQUESTS} requests per day. Please try again tomorrow."
                retry_after = DAILY_LIMIT_WINDOW
            else:
                message = f"Too many requests. Please wait {RATE_LIMIT_WINDOW} seconds before trying again."
                retry_after = RATE_LIMIT_WINDOW
            
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "message": message,
                    "retry_after": retry_after,
                    "limit_type": limit_type
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(RATE_LIMIT_REQUESTS),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time() + retry_after))
                }
            )
        
        # Add rate limit headers to response
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT_REQUESTS)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-Daily-Limit"] = str(DAILY_LIMIT_REQUESTS)
        return response
    
    return await call_next(request)


# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",
        "http://localhost:5173",  # Local development
        "http://localhost:5174",  # Backup local port
        "https://portfolio-production-592c.up.railway.app",  # Your Railway URL
        "https://*.netlify.app"  # All Netlify preview URLs
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load portfolio data once at startup to provide context to the chat bot
try:
    with open("info.json", "r", encoding="utf-8") as f:
        PORTFOLIO = json.load(f)
except Exception as e:
    print(f"Warning: could not load info.json at startup: {e}")
    PORTFOLIO = {}


@app.get("/api/portfolio")
async def get_portfolio():
    """Return the portfolio information from info.json"""
    return PORTFOLIO


@app.get("/api/chat/limits")
async def get_chat_limits(request: Request):
    """Return current rate limit status for the client."""
    client_ip = get_client_ip(request)
    current_time = time.time()
    
    # Calculate remaining requests
    minute_requests = [
        ts for ts in rate_limit_store.get(client_ip, [])
        if current_time - ts < RATE_LIMIT_WINDOW
    ]
    daily_requests = [
        ts for ts in daily_limit_store.get(client_ip, [])
        if current_time - ts < DAILY_LIMIT_WINDOW
    ]
    
    reset_daily_tokens_if_needed()
    
    return {
        "minute_limit": RATE_LIMIT_REQUESTS,
        "minute_remaining": max(0, RATE_LIMIT_REQUESTS - len(minute_requests)),
        "daily_limit": DAILY_LIMIT_REQUESTS,
        "daily_remaining": max(0, DAILY_LIMIT_REQUESTS - len(daily_requests)),
        "max_tokens_per_request": MAX_TOKENS_PER_REQUEST,
        "max_input_length": MAX_INPUT_LENGTH,
        "global_tokens_remaining": max(0, TOTAL_DAILY_TOKENS - daily_token_usage["tokens"])
    }


@app.post("/api/chat")
async def chat(request: Request):
    """Handle chat messages from the React frontend."""
    data = await request.json()
    user_message = data.get("message", "")
    requested_tokens = data.get("max_tokens", MAX_TOKENS_PER_REQUEST)

    if not user_message.strip():
        return {"response": "Please enter a message."}

    # Validate input length
    if len(user_message) > MAX_INPUT_LENGTH:
        return {
            "response": f"Your message is too long ({len(user_message)} characters). Please keep it under {MAX_INPUT_LENGTH} characters."
        }

    # Enforce per-request token limit
    if requested_tokens > MAX_TOKENS_PER_REQUEST:
        requested_tokens = MAX_TOKENS_PER_REQUEST

    # Check global daily token limit
    tokens_allowed, tokens_remaining = check_daily_token_limit(requested_tokens)
    if not tokens_allowed:
        return {
            "response": f"Daily token limit reached. The chatbot has used its daily allocation. Please try again tomorrow. (Remaining: {tokens_remaining} tokens)"
        }

    try:
        # Check if this is a project query
        project_query = user_message.lower().startswith("tell me about") and "project" in user_message.lower()
        
        # Build context based on query type
        context_text = ""
        if PORTFOLIO:
            if project_query:
                # For project queries, only include the specific project's full details
                project_name = user_message.lower().split("project:")[-1].strip() if "project:" in user_message.lower() else user_message.lower().split("about")[-1].strip()
                projects = PORTFOLIO.get("projects", [])
                matching_project = None
                for project in projects:
                    if project.get("name", "").lower() in project_name:
                        matching_project = project
                        break
                
                if matching_project:
                    context_text = "Project Details:\n"
                    context_text += f"Name: {matching_project.get('name')}\n"
                    context_text += f"Description: {matching_project.get('description')}\n"
                    if matching_project.get("details"):
                        context_text += "Features:\n- " + "\n- ".join(matching_project.get("details")) + "\n"
                    if matching_project.get("technologies"):
                        context_text += f"Technologies: {', '.join(matching_project.get('technologies'))}"
            else:
                # For general queries, include brief portfolio overview
                portfolio_summary = []
                education = PORTFOLIO.get("education", {}).get("program") or PORTFOLIO.get("education", {}).get("institution")
                if education:
                    portfolio_summary.append(f"Education: {education}")
                
                skills = PORTFOLIO.get("skills", {})
                if skills:
                    for category, skill_list in skills.items():
                        if skill_list:
                            portfolio_summary.append(f"{category.replace('_', ' ').title()}: {', '.join(skill_list)}")
                
                context_text = "\n".join(portfolio_summary)

        system_message = SYSTEM_PROMPT + "\n\nIMPORTANT: Keep your response concise and under 250 words."
        if context_text:
            system_message = SYSTEM_PROMPT + "\n\nContext from portfolio:\n" + context_text + "\n\nIMPORTANT: Keep your response concise and under 250 words."

        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message},
        ]

        if client is None:
            # Fallback canned response for local testing when no API key is configured
            demo_reply = (
                "Hi — this is a demo response because the GROQ_API_KEY is not configured. "
                "Ask me about Adam's skills, projects, or experience and I'll answer."
            )
            return {"response": demo_reply}

        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            stream=False,
            max_tokens=requested_tokens,
            temperature=0.5
        )

        bot_reply = response.choices[0].message.content.strip()
        
        # Track actual token usage
        tokens_used = response.usage.total_tokens if hasattr(response, 'usage') else requested_tokens
        add_token_usage(tokens_used)
        
        return {
            "response": bot_reply,
            "tokens_used": tokens_used,
            "tokens_remaining": max(0, TOTAL_DAILY_TOKENS - daily_token_usage["tokens"])
        }

    except Exception as e:
        print(f"Error: {e}")
        return {"response": "Sorry, something went wrong while generating the response."}


@app.get("/api/reports/{filename}")
async def get_report(filename: str):
    """Serve PDF report files."""
    try:
        # Define allowed directories for reports
        allowed_dirs = {
            "internship": "documents/internship",
            "latex": "documents/latex"
        }
        
        # Check which directory contains the requested file
        file_path = None
        for dir_path in allowed_dirs.values():
            potential_path = os.path.join(os.path.dirname(__file__), "..", dir_path, filename)
            if os.path.isfile(potential_path):
                file_path = potential_path
                break
        
        if not file_path:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Verify file is a PDF
        if not filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        return FileResponse(
            file_path,
            media_type="application/pdf",
            filename=filename
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error serving report: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")