# ⚡ SkillSync AI
### AI-Powered Skill Assessment & Personalised Learning Plan Agent

> A resume tells you what someone *claims* to know — not how well they actually know it.  
> SkillSync AI conversationally assesses real proficiency, identifies gaps, and generates a personalised learning roadmap.

---

## 🎯 What It Does

1. **Paste a Job Description** → AI extracts 4–6 critical required skills
2. **Upload your Resume** → AI understands your background
3. **Conversational Assessment** → 3 adaptive, scenario-based questions per skill (no MCQs)
4. **Gap Analysis** → Compared claimed vs. assessed proficiency
5. **Personalised Learning Plan** → Curated resources + realistic time estimates for every gap

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS (custom design system) |
| Backend | Python FastAPI |
| AI/LLM | Google Gemini 1.5 Flash |
| Resume Parsing | PyMuPDF + pdfplumber |

---

## 🚀 Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- A **Google Gemini API key** (free at [aistudio.google.com](https://aistudio.google.com))

### 1. Clone & Setup Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 2. Run Backend

```bash
# Inside backend/ with venv active
uvicorn main:app --reload --port 8000
```

API will be live at `http://localhost:8000`  
Docs at `http://localhost:8000/docs`

### 3. Setup & Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will be live at `http://localhost:5173`

---

## 📁 Project Structure

```
Catalyst/
├── backend/
│   ├── main.py         # FastAPI app (upload, start, chat, report endpoints)
│   ├── agent.py        # Gemini AI agent (skill extraction, Q&A, evaluation)
│   ├── parser.py       # PDF/text resume parser
│   ├── session.py      # In-memory session management
│   ├── schemas.py      # Pydantic request/response models
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    └── src/
        ├── pages/
        │   ├── Landing.jsx     # Upload interface
        │   ├── Assessment.jsx  # Conversational chat assessment
        │   └── Results.jsx     # Skill radar + learning plan dashboard
        ├── components/
        │   └── Navbar.jsx
        └── api/
            └── client.js       # Axios API client
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload JD text + resume file, create session |
| `POST` | `/api/start` | Extract skills, return first question |
| `POST` | `/api/chat` | Send answer, receive feedback + next question |
| `GET`  | `/api/report/{session_id}` | Get full gap analysis + learning plan |

---

## 🎨 Design

- **Palette**: Electric cyan `#00E5FF` + Deep violet `#7B2FBE` on near-black `#080B14`
- **Typography**: Space Grotesk (UI) + JetBrains Mono (terminal/code)
- **No gradients** — crisp geometric AI aesthetic

---

## 📝 Environment Variables

```env
GEMINI_API_KEY=your_key_here
```

---

Built with ❤️ for a hackathon.
