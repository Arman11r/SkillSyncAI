import uuid
from typing import Dict, Any

sessions: Dict[str, Any] = {}


def create_session() -> str:
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "jd_text": None,
        "resume_text": None,
        "skills": [],
        "current_skill_idx": 0,
        "current_question_num": 0,
        "questions_per_skill": 3,
        "skill_conversations": {},
        "scores": {},
        "required_levels": {},
        "complete": False,
    }
    return session_id


def get_session(session_id: str) -> Dict[str, Any]:
    return sessions.get(session_id)


def update_session(session_id: str, data: Dict[str, Any]):
    if session_id in sessions:
        sessions[session_id].update(data)
