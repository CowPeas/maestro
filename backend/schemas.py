from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ThreatBase(BaseModel):
    description: str
    classification: str
    status: str
    layer: str
    likelihood: int
    impact: int

class ThreatCreate(ThreatBase):
    pass

class ThreatResponse(ThreatBase):
    id: int
    created_at: datetime
    user_id: int

    class Config:
        from_attributes = True

class MitigationBase(BaseModel):
    description: str
    status: str

class MitigationCreate(MitigationBase):
    threat_id: int

class MitigationResponse(MitigationBase):
    id: int
    created_at: datetime
    threat_id: int

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None 