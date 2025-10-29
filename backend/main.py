from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from groq import Groq
import os
import json
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

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to ["http://localhost:5173"] for security
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


@app.post("/api/chat")
async def chat(request: Request):
    """Handle chat messages from the React frontend."""
    data = await request.json()
    user_message = data.get("message", "")

    if not user_message.strip():
        return {"response": "Please enter a message."}

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

        system_message = SYSTEM_PROMPT
        if context_text:
            system_message = SYSTEM_PROMPT + "\n\nContext from portfolio:\n" + context_text

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
            max_tokens=1024,
            temperature=0.5
        )

        bot_reply = response.choices[0].message.content.strip()
        return {"response": bot_reply}

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


