# Copilot / AI Assistant Instructions for Adam's Portfolio

Overview:
- Frontend: React + Vite (Tailwind CSS). Entry is `frontend/src/main.jsx` and UI in `frontend/src/Portfolio.jsx`.
- Backend: FastAPI (`backend/main.py`) serving endpoints for portfolio data and chat function.
- LLM: Groq client (optionally wired by `GROQ_API_KEY`) + persona described in `backend/prompt.py`.

Key files to reference:
- `backend/main.py` — API and rate limits, token usage and CORS config.
- `backend/prompt.py` — SYSTEM_PROMPT controlling assistant persona & response constraints.
- `backend/info.json` — Portfolio data used as context by the assistant.
- `frontend/src/Portfolio.jsx` — React component making fetch calls to the backend: `/api/data`, `/api/chat/limits`, `POST /api/chat`.
- `frontend/.env` — Build-time Vite environment variables (e.g., `VITE_API_URL`).

Architecture & Data Flow:
- Frontend fetches `GET /api/data` to display portfolio and uses `POST /api/chat` for messages. Chat replies either come from demo responses (if `GROQ_API_KEY` absent) or from the Groq LLM client.
- `GET /api/chat/limits` reports the current rate limit usage for the client (minute and daily limits).
- The backend rate limiting (per IP) and daily token counters live in `main.py` and depend on the incoming request `X-Forwarded-For` header when behind proxies.

Important endpoints and payloads:
- GET /api/data -> returns `info.json` content.
- GET /api/chat/limits -> returns JSON with:
  - `minute_limit`, `minute_remaining`, `daily_limit`, `daily_remaining`, `max_tokens_per_request`, `max_input_length`, `global_tokens_remaining`.
- POST /api/chat (JSON) -> { message: string, max_tokens?: int }
  - Response: `{ response: string, tokens_used?: number, tokens_remaining?: number }` or `{ error: "Rate limit exceeded" }`.

Deployment & Environment:
- Backend: set `GROQ_API_KEY` environment variable (optional). Run with `uvicorn main:app --reload` locally.
- Frontend: `VITE_API_URL` must point to backend host (build-time). Use `import.meta.env.VITE_API_URL` (build-time) or `window.ENV.VITE_API_URL` (runtime override).
- Netlify/Vercel: set `VITE_API_URL` in Build & Deploy environment variables, or inject `window.ENV` to override at runtime.
- CORS: `backend/main.py` uses an explicit `allow_origins` list. Ensure your deployed frontend origin is added to that list (without trailing slash).

Common gotchas & debugging hints:
- If you see `Failed to fetch` or `ERR_BLOCKED_BY_CLIENT` in the deployed UI, check:
  - Is the frontend using `localhost` as API_URL? (Production builds should not use `http://localhost:8000`.)
  - Does the deployment include `VITE_API_URL` during build? If not, Vite will fallback to defaults used at bundle time.
  - CORS: confirm backend `allow_origins` contains the exact frontend origin (no trailing slash).
  - Ad-blockers or browser extensions can block fetches; test in incognito or disable blockers.
  - When behind proxies (Railway, Cloudflare), ensure `X-Forwarded-For` is passed so rate-limiting sees real client IPs.

Project-specific patterns & conventions:
- Runtime override: `main.jsx` exposes `import.meta.env.VITE_API_URL` into `window.ENV`, so a hosting environment can change the backend without rebuilding.
- Production fallback choice: `API_URL` prefers `window.ENV.VITE_API_URL` then `import.meta.env.VITE_API_URL` and finally `window.location.origin`.
- `prompt.py` strictly controls assistant responses. Avoid changing the assistant persona without examining this file.
- `info.json` is the single source of truth for the content that the LLM is allowed to use as context. Prefer editing this file for content updates rather than modifying LLM prompt for facts.
- Project query detection in `main.py`: the backend looks for keywords (e.g., "tell me about" + "project") to decide whether to return project-specific context.

Codebase maintenance tips:
- For frontend hot-reload dev: `cd frontend && npm install && npm run dev`.
- For backend local dev: `pip install -r requirements.txt && uvicorn main:app --reload`.
- To build the frontend for production: `cd frontend && npm install && npm run build`.
- Keep `frontend/.env` or pipeline environment variables synchronized.

When modifying or adding features:
- Prefer adding new portfolio content to `backend/info.json` and adjust parsing logic in `main.py` if needed.
- Update `backend/prompt.py` when intention is to fine-tune assistant behavior; but the content must remain factual and constrained.
- If exposing new API routes, add explicit CORS entries and update the frontend to use `VITE_API_URL`.

If uncertain:
- Inspect `frontend/dist` after `npm run build` to confirm the final bundle uses the correct API URL.
- Reproduce locally by running both frontend and backend, then run the same fetch calls to confirm responses.

---
Notes: Keep this file concise. If you want more detailed agent rules (AGENT.md), call it out separately and we'll expand guidelines (linting, test coverage, code style rules).
