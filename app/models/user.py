from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean(), default=True)
    is_superuser = Column(Boolean(), default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # RBAC — Kullanıcının rolü
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    role = relationship("Role", lazy="joined")

    def has_permission(self, permission_name: str) -> bool:
        """Kullanıcının belirli bir izne sahip olup olmadığını kontrol eder"""
        if self.is_superuser:
            return True
        if self.role:
            return self.role.has_permission(permission_name)
        return False

    @property
    def role_name(self) -> str:
        if self.is_superuser:
            return "admin"
        if self.role:
            return self.role.name
        return "viewer"
