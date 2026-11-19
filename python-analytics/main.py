"""
StudentPulse AI — Optional Python Analytics Microservice (FastAPI + Pandas + NumPy)
Matches the exact deterministic scoring rules implemented in src/utils/analyticsEngine.ts.
Deploy independently to Google Cloud Run and set PYTHON_ANALYTICS_URL in the main Node server.
"""

from typing import Dict, List, Optional
import numpy as np
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="StudentPulse AI Python Analytics Service", version="1.0.0")


class SkillInput(BaseModel):
    name: str
    selfReportedScore: float = Field(ge=0, le=100)
    assessmentScore: Optional[float] = Field(default=None, ge=0, le=100)


class RequirementInput(BaseModel):
    name: str
    requiredScore: float = Field(ge=1, le=100)
    importance: str = "Medium"
    weight: float = 2.0
    category: str = "General"


class AcademicInput(BaseModel):
    semester: int
    subject: str
    marksObtained: float
    maxMarks: float


class SkillGapRequest(BaseModel):
    skills: List[SkillInput]
    requirements: List[RequirementInput]
    goodMin: float = 75
    moderateMin: float = 50


def normalize_skill(name: str) -> str:
    cleaned = "".join(ch if ch.isalnum() else " " for ch in name.lower()).strip()
    cleaned = " ".join(cleaned.split())
    aliases = {
        "java": "core java",
        "oop": "object oriented programming",
        "oops": "object oriented programming",
        "dsa": "data structures algorithms",
        "data structures and algorithms": "data structures algorithms",
        "git and github": "git github",
        "git": "git github",
        "mysql": "sql",
        "postgresql": "sql",
    }
    return aliases.get(cleaned, cleaned)


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok", "engine": "python-fastapi-pandas-numpy"}


@app.post("/analyze/skill-gap")
def analyze_skill_gap(payload: SkillGapRequest) -> Dict[str, object]:
    skill_lookup: Dict[str, float] = {}
    for s in payload.skills:
        eff = s.assessmentScore if s.assessmentScore is not None else s.selfReportedScore
        skill_lookup[normalize_skill(s.name)] = float(np.clip(round(eff), 0, 100))

    rows = []
    weighted_achieved = 0.0
    weighted_required = 0.0

    for req in payload.requirements:
        key = normalize_skill(req.name)
        current = skill_lookup.get(key)
        if current is None:
            rows.append({
                "skillName": req.name,
                "currentScore": None,
                "requiredScore": req.requiredScore,
                "gap": None,
                "status": "Insufficient Evidence",
                "priority": "High" if req.importance == "High" else "Medium",
            })
            continue

        capped = min(current, req.requiredScore)
        weighted_achieved += (capped / req.requiredScore) * 100.0 * req.weight
        weighted_required += req.weight
        gap = round(req.requiredScore - current, 2)
        status = "Improvement Needed" if gap > 0 else "Meets Target"
        boost = 15 if req.importance == "High" else (5 if req.importance == "Medium" else 0)
        severity = gap + boost
        priority = "Low" if gap <= 0 else ("High" if severity >= 35 else ("Medium" if severity >= 18 else "Low"))

        rows.append({
            "skillName": req.name,
            "currentScore": current,
            "requiredScore": req.requiredScore,
            "gap": gap,
            "status": status,
            "priority": priority,
        })

    match_score = round(weighted_achieved / weighted_required) if weighted_required > 0 else None
    return {
        "engine": "python-fastapi-pandas-numpy",
        "technicalSkillMatchScore": match_score,
        "skillGaps": rows,
    }


@app.post("/analyze/academics")
def analyze_academics(records: List[AcademicInput]) -> Dict[str, object]:
    valid = [r.model_dump() for r in records if r.maxMarks > 0 and r.marksObtained >= 0]
    if not valid:
        return {"cgpa": None, "averagePercentage": None, "semesterTrend": []}

    df = pd.DataFrame(valid)
    df["percentage"] = np.round((df["marksObtained"] / df["maxMarks"]) * 100.0, 1)
    avg_pct = float(np.round(df["percentage"].mean(), 1))
    cgpa = float(np.round(min(10.0, avg_pct / 9.5), 2))

    sem_group = (
        df.groupby("semester", as_index=False)["percentage"]
        .mean()
        .sort_values("semester")
    )
    trend = [
        {
            "semester": f"Sem {int(row.semester)}",
            "averagePercent": round(float(row.percentage), 1),
            "sgpa": round(min(10.0, float(row.percentage) / 9.5), 2),
        }
        for row in sem_group.itertuples()
    ]
    return {"cgpa": cgpa, "averagePercentage": avg_pct, "semesterTrend": trend}
