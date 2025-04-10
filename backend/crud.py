from sqlalchemy.orm import Session
from models import Threat, Mitigation, User
from schemas import ThreatCreate, MitigationCreate, UserCreate
from passlib.context import CryptContext
from typing import List

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_threats(db: Session, skip: int = 0, limit: int = 100) -> List[Threat]:
    return db.query(Threat).offset(skip).limit(limit).all()

def create_threat(db: Session, threat: ThreatCreate, user_id: int) -> Threat:
    db_threat = Threat(**threat.dict(), user_id=user_id)
    db.add(db_threat)
    db.commit()
    db.refresh(db_threat)
    return db_threat

def get_mitigations(db: Session, threat_id: int) -> List[Mitigation]:
    return db.query(Mitigation).filter(Mitigation.threat_id == threat_id).all()

def create_mitigation(db: Session, mitigation: MitigationCreate) -> Mitigation:
    db_mitigation = Mitigation(**mitigation.dict())
    db.add(db_mitigation)
    db.commit()
    db.refresh(db_mitigation)
    return db_mitigation

def get_user(db: Session, username: str) -> User:
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user: UserCreate) -> User:
    hashed_password = pwd_context.hash(user.password)
    db_user = User(
        username=user.username,
        password_hash=hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password) 