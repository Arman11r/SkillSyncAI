import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from schemas import StartRequest, ChatRequest
from session import create_session, get_session, update_session
from parser import parse_pdf, clean_text
from agent import (
    extract_skills,
    generate_question,
    evaluate_skill,
    generate_feedback,
    generate_learning_plan,
)

app = FastAPI(title="AI Skill Assessment Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "AI Skill Assessment Agent API", "status": "running"}


# ── Upload ────────────────────────────────────────────────────────────────────

@app.post("/api/upload")
async def upload_files(
    jd_text: str = Form(...),
    resume: UploadFile = File(...),
):
    """Create session and store JD text + parsed resume."""
    session_id = create_session()

    resume_bytes = await resume.read()
    content_type = resume.content_type or ""

    if "pdf" in content_type:
        resume_text = parse_pdf(resume_bytes)
    else:
        resume_text = clean_text(resume_bytes.decode("utf-8", errors="ignore"))

    update_session(session_id, {
        "jd_text": clean_text(jd_text),
        "resume_text": resume_text,
    })

    return {"session_id": session_id, "message": "Files uploaded successfully"}


# ── Start Assessment ──────────────────────────────────────────────────────────

@app.post("/api/start")
async def start_assessment(request: StartRequest):
    """Extract skills from JD and return first assessment question."""
    session = get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session["jd_text"] or not session["resume_text"]:
        raise HTTPException(status_code=400, detail="Files not uploaded yet")

    skills, required_levels = extract_skills(session["jd_text"])
    first_question = generate_question(skills[0], 0, [], session["resume_text"])

    skill_conversations = {skill: [] for skill in skills}
    skill_conversations[skills[0]].append({"question": first_question})

    update_session(request.session_id, {
        "skills": skills,
        "required_levels": required_levels,
        "current_skill_idx": 0,
        "current_question_num": 0,
        "skill_conversations": skill_conversations,
    })

    return {
        "session_id": request.session_id,
        "skills": skills,
        "first_question": first_question,
        "current_skill": skills[0],
        "total_skills": len(skills),
        "skill_index": 0,
    }


# ── Chat ──────────────────────────────────────────────────────────────────────

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Process candidate answer, return feedback + next question or completion."""
    session = get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session["complete"]:
        return {
            "session_id": request.session_id,
            "message": "Assessment already complete. View your results!",
            "next_question": None,
            "current_skill": None,
            "skill_index": len(session["skills"]),
            "total_skills": len(session["skills"]),
            "is_complete": True,
        }

    skills = session["skills"]
    current_idx = session["current_skill_idx"]
    current_skill = skills[current_idx]
    q_num = session["current_question_num"]
    skill_conv = session["skill_conversations"][current_skill]

    # Attach answer to the last pending question
    if skill_conv and "answer" not in skill_conv[-1]:
        skill_conv[-1]["answer"] = request.answer
    else:
        skill_conv.append({"question": "Follow-up", "answer": request.answer})

    # Brief natural feedback
    current_question = skill_conv[-1].get("question", "")
    feedback = generate_feedback(current_skill, request.answer, current_question)

    q_num += 1

    if q_num < session["questions_per_skill"]:
        # Ask next question for the same skill
        next_q = generate_question(current_skill, q_num, skill_conv, session["resume_text"])
        skill_conv.append({"question": next_q})

        update_session(request.session_id, {
            "current_question_num": q_num,
            "skill_conversations": session["skill_conversations"],
        })

        return {
            "session_id": request.session_id,
            "message": feedback,
            "next_question": next_q,
            "current_skill": current_skill,
            "skill_index": current_idx,
            "total_skills": len(skills),
            "is_complete": False,
        }

    else:
        # All questions answered for this skill — evaluate
        answered_pairs = [qa for qa in skill_conv if "answer" in qa]
        score, notes = evaluate_skill(current_skill, answered_pairs, session["resume_text"])
        session["scores"][current_skill] = score
        session["skill_conversations"][current_skill] = skill_conv

        next_idx = current_idx + 1

        if next_idx >= len(skills):
            # Assessment complete
            update_session(request.session_id, {
                "current_skill_idx": next_idx,
                "complete": True,
                "scores": session["scores"],
                "skill_conversations": session["skill_conversations"],
            })
            return {
                "session_id": request.session_id,
                "message": feedback + " That wraps up the assessment — great work!",
                "next_question": None,
                "current_skill": None,
                "skill_index": next_idx,
                "total_skills": len(skills),
                "is_complete": True,
            }

        else:
            # Move to next skill
            next_skill = skills[next_idx]
            next_q = generate_question(next_skill, 0, [], session["resume_text"])
            session["skill_conversations"][next_skill].append({"question": next_q})

            update_session(request.session_id, {
                "current_skill_idx": next_idx,
                "current_question_num": 0,
                "scores": session["scores"],
                "skill_conversations": session["skill_conversations"],
            })

            return {
                "session_id": request.session_id,
                "message": f"{feedback} Now let's move on to **{next_skill}**.",
                "next_question": next_q,
                "current_skill": next_skill,
                "skill_index": next_idx,
                "total_skills": len(skills),
                "is_complete": False,
            }


# ── Report ────────────────────────────────────────────────────────────────────

@app.get("/api/report/{session_id}")
async def get_report(session_id: str):
    """Generate and return the full skill gap + learning plan report."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session["complete"]:
        raise HTTPException(status_code=400, detail="Assessment not yet complete")

    report = generate_learning_plan(
        session["skills"],
        session["scores"],
        session["required_levels"],
        session["resume_text"],
        session["jd_text"],
    )
    report["session_id"] = session_id
    return report
