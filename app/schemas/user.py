from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# --- Permission & Role Schemas ---
class PermissionBase(BaseModel):
    name: str
    description: Optional[str] = None

class Permission(PermissionBase):
    id: int
    
    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    permission_names: List[str] = []

class Role(RoleBase):
    id: int
    permissions: List[Permission] = []
    
    class Config:
        from_attributes = True

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)
    role_id: Optional[int] = None

class UserInDBBase(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    role: Optional[Role] = None

    class Config:
        from_attributes = True

class User(UserInDBBase):
    """API response model — hassas bilgi içermez"""
    pass

class UserInDB(UserInDBBase):
    """DB model — hashed password dahil"""
    hashed_password: str
