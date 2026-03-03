"""
Audit Log Model — Kullanıcı aksiyonlarını kaydeder
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base


class AuditLog(Base):
    """Sistem genelinde aksiyon kayıtları"""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    def __repr__(self):
        return f"<AuditLog {self.action} user={self.user_id} at={self.created_at}>"
