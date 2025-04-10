from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os
from dotenv import load_dotenv
import tempfile

from database import SessionLocal, engine
from models import Base
from schemas import ThreatCreate, ThreatResponse, UserCreate, UserResponse
from crud import create_threat, get_threats, create_user, get_user
from auth import get_current_user, create_access_token
from agents.manager import AgentManager
from agents.input_processor import InputProcessor

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MAESTRO Threat Modeling API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agent manager and input processor
agent_manager = AgentManager()
input_processor = InputProcessor()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/analyze/")
async def analyze_system(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user)
):
    """Analyze a system using the multi-agent workflow."""
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            # Process the input file
            processed_data = await input_processor.process(temp_file_path)
            
            # Run the agent analysis
            results = await agent_manager.process_input(
                input_processor.format_for_agents(processed_data)
            )
            
            # Save the results
            threats = await agent_manager.save_results(results, current_user.id)
            
            return {
                "message": "Analysis completed successfully",
                "threats": threats
            }
            
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

@app.post("/threats/", response_model=ThreatResponse)
def create_threat_endpoint(threat: ThreatCreate, db: Session = Depends(get_db), current_user: UserResponse = Depends(get_current_user)):
    return create_threat(db=db, threat=threat)

@app.get("/threats/", response_model=List[ThreatResponse])
def read_threats(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: UserResponse = Depends(get_current_user)):
    threats = get_threats(db, skip=skip, limit=limit)
    return threats

@app.post("/users/", response_model=UserResponse)
def create_user_endpoint(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return create_user(db=db, user=user)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 