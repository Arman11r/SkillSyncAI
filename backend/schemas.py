from pydantic import BaseModel
from typing import List, Optional, Dict


class UploadResponse(BaseModel):
    session_id: str
    message: str


class StartRequest(BaseModel):
    session_id: str


class StartResponse(BaseModel):
    session_id: str
    skills: List[str]
    first_question: str
    current_skill: str
    total_skills: int
    skill_index: int


class ChatRequest(BaseModel):
    session_id: str
    answer: str


class ChatResponse(BaseModel):
    session_id: str
    message: str
    next_question: Optional[str]
    current_skill: Optional[str]
    skill_index: int
    total_skills: int
    is_complete: bool


class LearningResource(BaseModel):
    title: str
    type: str
    url: str
    time_estimate: str


class SkillAssessment(BaseModel):
    skill: str
    required_level: int
    assessed_level: int
    gap: int
    notes: str


class LearningPlanItem(BaseModel):
    skill: str
    gap_score: int
    priority: str
    resources: List[LearningResource]
    total_time_estimate: str


class ReportResponse(BaseModel):
    session_id: str
    candidate_summary: str
    overall_match_score: int
    skills_assessment: List[SkillAssessment]
    learning_plan: List[LearningPlanItem]
