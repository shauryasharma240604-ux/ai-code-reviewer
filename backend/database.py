import json
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./code_reviewer.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class ReviewRecord(Base):
    __tablename__ = "review_records"

    id = Column(Integer, primary_key=True, index=True)
    snippet_title = Column(String(255), default="Untitled Snippet")
    language = Column(String(50), index=True)
    code_snippet = Column(Text, nullable=False)
    health_score = Column(Integer, default=100)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    info_count = Column(Integer, default=0)
    static_count = Column(Integer, default=0)
    ai_count = Column(Integer, default=0)
    report_json = Column(Text, nullable=False)  # Serialized full report
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "snippet_title": self.snippet_title,
            "language": self.language,
            "code_snippet": self.code_snippet,
            "health_score": self.health_score,
            "counts": {
                "critical": self.critical_count,
                "high": self.high_count,
                "medium": self.medium_count,
                "low": self.low_count,
                "info": self.info_count,
                "static": self.static_count,
                "ai": self.ai_count,
            },
            "report": json.loads(self.report_json) if self.report_json else {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
