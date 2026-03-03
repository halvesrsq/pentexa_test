from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base

class ScanTask(Base):
    """Kullanıcıların arka planda çalıştırdığı tarama görevleri"""
    __tablename__ = "scan_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String(255), unique=True, index=True, nullable=False) # Celery ile ilişkili ID
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_url = Column(String(500), nullable=False)
    
    # Durumlar: PENDING, RUNNING, SUCCESS, FAILED
    status = Column(String(50), default="PENDING", index=True)
    
    # Tarama sonuçları JSON formatında tutulacak
    result = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<ScanTask(id={self.id}, task_id='{self.task_id}', status='{self.status}')>"
