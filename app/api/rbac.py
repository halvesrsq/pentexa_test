"""
RBAC Dependency Guards — require_permission / require_role
Kullanım:
    @router.get("/scans", dependencies=[Depends(require_permission("scan:read"))])
    @router.delete("/users/{id}", dependencies=[Depends(require_role("admin"))])
"""
from typing import List
from fastapi import Depends, HTTPException, status
from app.api.dependencies import get_current_user
from app.models.user import User


class require_permission:
    """Belirli bir izin gerektirir — dependency olarak kullanılır"""

    def __init__(self, permission: str):
        self.permission = permission

    async def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if not current_user.has_permission(self.permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Bu işlem için '{self.permission}' izni gerekli",
            )
        return current_user


class require_role:
    """Belirli bir rol gerektirir — dependency olarak kullanılır"""

    def __init__(self, *roles: str):
        self.roles = roles

    async def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        user_role = current_user.role_name
        if user_role not in self.roles and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Bu işlem için {', '.join(self.roles)} rollerinden biri gerekli",
            )
        return current_user
