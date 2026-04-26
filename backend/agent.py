import json
import re
import os
import time
from typing import List, Dict, Tuple

from google import genai
from google.genai import types
from google.genai import errors as genai_errors

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Model preference order — gemini-2.5-flash first (confirmed working)
MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]


def _generate(prompt: str) -> str:
    """Call Gemini with automatic retry across model fallbacks."""
    last_err = None
    for model in MODELS:
        for attempt in range(3):          # up to 3 retries per model
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(temperature=0.7),
                )
                return response.text
            except genai_errors.ClientError as e:
                last_err = e
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                    wait = 10 * (attempt + 1)   # 10s, 20s, 30s
                    print(f"[Rate limit on {model}] Retrying in {wait}s…")
                    time.sleep(wait)
                else:
                    break   # non-rate-limit error — try next model
            except Exception as e:
                last_err = e
                break       # unexpected error — try next model
    raise RuntimeError(f"All Gemini models exhausted. Last error: {last_err}")


def _clean_json(text: str) -> str:
    """Strip markdown code fences from LLM output."""
    text = re.sub(r"```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```", "", text)
    return text.strip()


# ── Skill Extraction ─────────────────────────────────────────────────────────

def extract_skills(jd_text: str) -> Tuple[List[str], Dict[str, int]]:
    """Extract required skills and proficiency levels from a job description."""
    prompt = f"""
You are a technical recruiter AI. Analyze this job description and extract the required skills.

JOB DESCRIPTION:
{jd_text}

Return a JSON object with this EXACT format (no markdown, no explanation):
{{
  "skills": ["Skill1", "Skill2", "Skill3"],
  "required_levels": {{"Skill1": 4, "Skill2": 3, "Skill3": 5}}
}}

Rules:
- Extract 4-6 of the most critical skills (technical + key soft skills)
- Be specific: "React.js" not "Frontend", "PostgreSQL" not "Database"
- required_levels scale: 1=Beginner, 2=Basic, 3=Intermediate, 4=Advanced, 5=Expert
- Return ONLY valid JSON
"""
    data = json.loads(_clean_json(_generate(prompt)))
    return data["skills"], data["required_levels"]


# ── Question Generation ───────────────────────────────────────────────────────

def generate_question(
    skill: str,
    question_num: int,
    previous_qa: List[Dict],
    resume_text: str,
) -> str:
    """Generate an adaptive, scenario-based interview question for a skill."""
    history_text = ""
    if previous_qa:
        history_text = "\n".join(
            [f"Q{i+1}: {qa['question']}\nA{i+1}: {qa.get('answer', '[no answer yet]')}"
             for i, qa in enumerate(previous_qa) if "answer" in qa]
        )

    templates = {
        0: "Start with a real-world scenario or 'walk me through a time you...' style question.",
        1: "Based on their previous answer, probe deeper into a specific technical detail or decision they made.",
        2: "Ask about a hard challenge they faced with this skill, or how they'd design/architect something complex.",
    }
    instruction = templates.get(question_num, "Ask a practical follow-up question.")

    prompt = f"""You are an expert technical interviewer assessing "{skill}".

RESUME CONTEXT (brief):
{resume_text[:800]}

PREVIOUS CONVERSATION FOR THIS SKILL:
{history_text if history_text else "No previous questions yet."}

QUESTION #{question_num + 1} of 3 — INSTRUCTION: {instruction}

Rules:
- Be conversational, not quiz-like
- 1–2 sentences max
- Target REAL proficiency, not memorization
- Be specific to "{skill}"

Return ONLY the question text, nothing else."""
    return _generate(prompt).strip()


# ── Answer Feedback ───────────────────────────────────────────────────────────

def generate_feedback(skill: str, answer: str, question: str) -> str:
    """Generate a brief, natural acknowledgment to bridge to the next question."""
    prompt = f"""You are a friendly AI interviewer. Write ONE short natural sentence acknowledging this answer about "{skill}".
Do not score or evaluate yet — just transition naturally.

Question asked: {question}
Candidate answered: {answer}

Return ONLY the acknowledgment sentence."""
    return _generate(prompt).strip()


# ── Skill Evaluation ──────────────────────────────────────────────────────────

def evaluate_skill(
    skill: str,
    qa_pairs: List[Dict],
    resume_text: str,
) -> Tuple[int, str]:
    """Score a candidate's actual proficiency in a skill based on their answers."""
    qa_text = "\n".join(
        [f"Q: {qa['question']}\nA: {qa.get('answer', '')}" for qa in qa_pairs if "answer" in qa]
    )

    prompt = f"""You are an expert technical evaluator assessing "{skill}" proficiency.

RESUME CONTEXT:
{resume_text[:500]}

ASSESSMENT CONVERSATION:
{qa_text}

Proficiency Scale:
1 = Beginner | 2 = Basic | 3 = Intermediate | 4 = Advanced | 5 = Expert

Evaluate their ACTUAL demonstrated proficiency based on ANSWERS (not resume claims).

Return JSON only:
{{
  "score": 3,
  "notes": "1–2 sentence assessment of their actual demonstrated proficiency"
}}"""
    data = json.loads(_clean_json(_generate(prompt)))
    return int(data["score"]), data["notes"]


# ── Learning Plan Generation ──────────────────────────────────────────────────

def generate_learning_plan(
    skills: List[str],
    scores: Dict[str, int],
    required_levels: Dict[str, int],
    resume_text: str,
    jd_text: str,
) -> Dict:
    """Generate full gap analysis report and personalised learning plan."""
    skills_data = [
        {
            "skill": s,
            "assessed": scores.get(s, 1),
            "required": required_levels.get(s, 3),
            "gap": max(0, required_levels.get(s, 3) - scores.get(s, 1)),
        }
        for s in skills
    ]

    prompt = f"""You are an expert career coach. Generate a skill gap report and personalised learning plan.

JOB DESCRIPTION (summary):
{jd_text[:800]}

CANDIDATE RESUME (summary):
{resume_text[:500]}

SKILL SCORES:
{json.dumps(skills_data, indent=2)}

Return ONLY this JSON structure (no markdown):
{{
  "candidate_summary": "2–3 sentence summary of candidate profile and overall fit",
  "overall_match_score": 72,
  "skills_assessment": [
    {{
      "skill": "React.js",
      "required_level": 4,
      "assessed_level": 3,
      "gap": 1,
      "notes": "Strong fundamentals but needs advanced pattern experience"
    }}
  ],
  "learning_plan": [
    {{
      "skill": "React.js",
      "gap_score": 1,
      "priority": "medium",
      "resources": [
        {{
          "title": "React - The Complete Guide",
          "type": "course",
          "url": "https://www.udemy.com/course/react-the-complete-guide-incl-redux/",
          "time_estimate": "40 hours"
        }},
        {{
          "title": "Build a production React app",
          "type": "project",
          "url": "https://github.com/topics/react-projects",
          "time_estimate": "20 hours"
        }}
      ],
      "total_time_estimate": "2–3 weeks"
    }}
  ]
}}

Rules:
- Include ALL skills in skills_assessment
- Only include skills with gap > 0 in learning_plan
- priority: gap >= 3 → "high", gap == 2 → "medium", gap == 1 → "low"
- 2–4 REAL resources per skill (actual working URLs to courses, docs, GitHub topics, YouTube)
- Resource types: "course", "documentation", "book", "project", "video"
- overall_match_score is 0–100 percentage
- Return ONLY valid JSON"""
    return json.loads(_clean_json(_generate(prompt)))
