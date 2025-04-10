from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, CheckConstraint, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    ANALYST = "Analyst"

class ThreatStatus(str, enum.Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"

class ThreatClassification(str, enum.Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class Threat(Base):
    __tablename__ = "threats"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(Text, nullable=False)
    classification = Column(String(10), nullable=False)
    status = Column(String(20), nullable=False)
    layer = Column(String(50), nullable=False)
    likelihood = Column(Integer, nullable=False)
    impact = Column(Integer, nullable=False)
    embedding = Column(String)  # Vector storage for LLM embeddings
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, onupdate=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))

    mitigations = relationship("Mitigation", back_populates="threat")
    user = relationship("User", back_populates="threats")

    __table_args__ = (
        CheckConstraint("classification IN ('High', 'Medium', 'Low')", name="check_classification"),
        CheckConstraint("status IN ('Open', 'In Progress', 'Resolved')", name="check_status"),
        CheckConstraint("likelihood BETWEEN 1 AND 5", name="check_likelihood"),
        CheckConstraint("impact BETWEEN 1 AND 5", name="check_impact"),
    )

class Mitigation(Base):
    __tablename__ = "mitigations"

    id = Column(Integer, primary_key=True, index=True)
    threat_id = Column(Integer, ForeignKey("threats.id"))
    description = Column(Text, nullable=False)
    status = Column(String(20), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, onupdate=func.now())

    threat = relationship("Threat", back_populates="mitigations")

    __table_args__ = (
        CheckConstraint("status IN ('Pending', 'Completed')", name="check_mitigation_status"),
    )

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default=UserRole.ANALYST)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    threats = relationship("Threat", back_populates="user")

    __table_args__ = (
        CheckConstraint("role IN ('Admin', 'Analyst')", name="check_role"),
    ) 