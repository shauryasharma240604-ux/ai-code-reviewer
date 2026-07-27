import os
import json
import logging
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import init_db, get_db, ReviewRecord
from analyzers.pipeline import ReviewPipeline
from services.github_service import GitHubService

# Initialize Logging & DB
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

init_db()

app = FastAPI(
    title="AI Code Reviewer & Bug Detector API",
    description="Hybrid static analysis + LLM reasoning pipeline for automated pull request code reviews.",
    version="1.0.0"
)

# Enable CORS for local Vite development frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
class ReviewRequest(BaseModel):
    code: str = Field(..., examples=["def execute_query(user_id):\n    return db.execute(f'SELECT * FROM users WHERE id = {user_id}')"])
    language: str = Field(default="python", examples=["python"])
    title: Optional[str] = Field(default="Untitled Snippet", examples=["User Auth Module"])
    persona: Optional[str] = Field(default="Senior SDE", examples=["Senior SDE"])
    api_key: Optional[str] = Field(default=None, examples=["AIzaSy..."])

class GitHubReviewRequest(BaseModel):
    url: str = Field(..., examples=["https://github.com/torvalds/linux/pull/1"])
    persona: Optional[str] = Field(default="Senior SDE")
    api_key: Optional[str] = Field(default=None)

class VerifyKeyRequest(BaseModel):
    api_key: str

@app.get("/")
def read_root():
    return {
        "service": "AI-Powered Code Reviewer & Bug Detector",
        "status": "online",
        "docs": "/docs"
    }

@app.post("/api/review")
def review_code(req: ReviewRequest, db: Session = Depends(get_db)):
    """
    Runs the hybrid static + AI code review pipeline on the provided code string.
    """
    try:
        pipeline = ReviewPipeline(api_key=req.api_key)
        report = pipeline.run_review(
            code=req.code,
            language=req.language,
            snippet_title=req.title,
            persona=req.persona
        )

        counts = report.get("counts", {})
        record = ReviewRecord(
            snippet_title=req.title,
            language=req.language,
            code_snippet=req.code,
            health_score=report.get("health_score", 100),
            critical_count=counts.get("critical", 0),
            high_count=counts.get("high", 0),
            medium_count=counts.get("medium", 0),
            low_count=counts.get("low", 0),
            info_count=counts.get("info", 0),
            static_count=counts.get("static", 0),
            ai_count=counts.get("ai", 0),
            report_json=json.dumps(report)
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        report["record_id"] = record.id
        report["github_markdown_comment"] = GitHubService.generate_markdown_pr_comment(report)
        return report

    except Exception as e:
        logger.exception("Error executing code review")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/github/pr")
async def review_github_pr(req: GitHubReviewRequest, db: Session = Depends(get_db)):
    """
    Fetches PR details or file contents from GitHub and executes the review pipeline.
    """
    try:
        github_service = GitHubService()
        pr_data = await github_service.fetch_pr_details(req.url)

        pipeline = ReviewPipeline(api_key=req.api_key)
        file_reviews = []

        total_health = 0
        file_count = len(pr_data.get("changed_files", []))

        for file_info in pr_data.get("changed_files", []):
            filename = file_info.get("filename", "unknown.py")
            ext = filename.split(".")[-1] if "." in filename else "python"
            
            # Infer language
            lang_map = {"py": "python", "js": "javascript", "ts": "typescript", "jsx": "javascript", "tsx": "typescript", "go": "go", "java": "java", "cpp": "cpp", "c": "cpp"}
            language = lang_map.get(ext, "python")

            raw_code = file_info.get("raw_content") or file_info.get("patch") or ""
            
            if not raw_code:
                continue

            file_report = pipeline.run_review(
                code=raw_code,
                language=language,
                snippet_title=filename,
                persona=req.persona
            )
            file_report["filename"] = filename
            file_reviews.append(file_report)
            total_health += file_report.get("health_score", 100)

        avg_health = int(total_health / max(1, len(file_reviews)))

        summary_report = {
            "pr_title": pr_data.get("title"),
            "owner": pr_data.get("owner"),
            "repo": pr_data.get("repo"),
            "pr_number": pr_data.get("pr_number"),
            "author": pr_data.get("author"),
            "overall_health_score": avg_health,
            "file_reviews": file_reviews,
            "changed_files_count": len(file_reviews)
        }

        return summary_report

    except Exception as e:
        logger.exception("Error processing GitHub PR URL")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/history")
def get_review_history(db: Session = Depends(get_db)):
    records = db.query(ReviewRecord).order_by(ReviewRecord.created_at.desc()).limit(50).all()
    return [r.to_dict() for r in records]

@app.get("/api/history/{record_id}")
def get_review_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(ReviewRecord).filter(ReviewRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Review record not found.")
    return record.to_dict()

@app.delete("/api/history/{record_id}")
def delete_review_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(ReviewRecord).filter(ReviewRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Review record not found.")
    db.delete(record)
    db.commit()
    return {"message": "Record deleted successfully"}

@app.post("/api/settings/verify-key")
def verify_api_key(req: VerifyKeyRequest):
    if not req.api_key or len(req.api_key.strip()) < 10:
        return {"valid": False, "message": "API key appears too short or empty."}
    return {"valid": True, "message": "API key format accepted."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
