from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

# ---- Many-to-Many: Role <-> Permission ----
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)


class Permission(Base):
    """İzin tanımları — ör: scan:read, scan:write, user:manage"""
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)

    def __repr__(self):
        return f"<Permission {self.name}>"


class Role(Base):
    """Kullanıcı rolleri — ör: admin, analyst, viewer"""
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    permissions = relationship(
        "Permission",
        secondary=role_permissions,
        lazy="joined",
        cascade="all, delete",
    )

    def __repr__(self):
        return f"<Role {self.name}>"

    def has_permission(self, permission_name: str) -> bool:
        return any(p.name == permission_name for p in self.permissions)
