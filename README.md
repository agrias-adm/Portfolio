

# Adam El Amrani – Interactive Portfolio

Welcome to my portfolio! 🚀  
This site showcases my projects, skills, and professional experience, with a unique interactive LLM-powered chat that answers questions about me or my work. Click on any project, skill, or experience item to ask the assistant for more details in real time.

---

## 🌟 Features

- **Project Showcase:** Browse my AI-focused projects with interactive click-to-ask support.  
- **LLM Chat Assistant:** Ask about my skills, experience, or projects; powered by Groq + LLaMA 3.3 70B.  
- **Dark-Themed Responsive UI:** Mobile-first design with animations, particle effects, and polished visual cues.  
- **Quick Access:** Suggested questions in chat, smooth loading UI, PDF download links for reports/experience.  
- **Social Links:** GitHub, LinkedIn, and email for easy contact.  
- **Markdown Rendering:** Clean formatting for assistant replies including code blocks and lists.  

---

## 🧑‍💻 LLM Chat Interface

- **Integration:** Frontend sends messages to `POST /api/chat`.  
- **Backend:** FastAPI server uses Groq client when `GROQ_API_KEY` is set; otherwise returns demo responses.  
- **Custom Behavior:** Assistant answers only about me (Adam El Amrani), projects, skills, or experience, staying factual and concise.  
- **Context-Aware:** Clicking a project/experience sends contextual prompts to the chat for accurate replies.  

---

## 🧱 Tech Stack

### Frontend
- React (functional components), ReactDOM  
- Vite (dev/build tool)  
- Tailwind CSS  
- lucide-react for icons  
- react-markdown + remark-gfm for rendering assistant replies  

### Backend
- FastAPI (main.py)  
- Groq client integration for LLM  
- python-dotenv, OpenAI, LangChain, uvicorn, gunicorn  
- Demo responses provided if API key missing  

### LLM / Model
- Groq + LLaMA 3.3 70B  
- SYSTEM_PROMPT in `prompt.py` defines persona, background, and strict response rules  

---

## 🎯 Purpose

This portfolio is designed for:  
- Recruiters & hiring managers – quickly understand my skills, projects, and experience.  
- Potential collaborators or internship/project mentors – explore my capabilities interactively.  
- General visitors – demo modern AI/LLM integration in a portfolio setting.  

**Goal:** Visitors should see what I build, interact with the assistant for accurate info, and leave with a clear impression of my skills.  

---

## ⚙️ Setup & Local Development

### Prerequisites
- Node.js & npm (frontend)  
- Python 3.10+ (backend)  
- `GROQ_API_KEY` (optional, for live LLM responses)  

### Frontend
```bash
npm install
npm run dev
```

### Backend

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

> With `GROQ_API_KEY` set in `.env`, the chat uses LLaMA 3.3 70B. Without it, the app shows demo responses.

---

## 🏗️ Project Structure

```
/frontend       # React + Vite app
/backend        # FastAPI server
/info.json      # Portfolio context for assistant
/prompt.py      # SYSTEM_PROMPT & rules for chat
```

---

## 📬 Contact

* GitHub: [AdamElAmrani](https://github.com/AdamElAmrani)
* LinkedIn: [Adam El Amrani](https://www.linkedin.com/in/adam-el-amrani/)
* Email: [adam.elamrani@example.com](mailto:adam.elamrani@example.com)

---

## ⚡ Future Enhancements

* Dedicated contact form (POST to backend)
* Explicit dark/light theme toggle
* Offline caching / PWA support
* Continuous deployment with Vercel, Netlify, or Render

---

Made with ❤️ using React, Tailwind, FastAPI, and LLM magic!

