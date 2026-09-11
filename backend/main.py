from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from livekit import api
import os
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi import Depends

# Import Database and Models
from database import engine, get_db
import models

# Create SQLite tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Interviewer Backend")

# Enable CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TokenRequest(BaseModel):
    participant_name: str
    room_name: str

@app.get("/")
def read_root():
    return {"status": "ok", "message": "AI Interviewer API is running"}

@app.post("/api/token")
async def generate_token(req: TokenRequest, db: Session = Depends(get_db)):
    """
    Generate a LiveKit connection token for the frontend participant,
    and create an interview session record in the SQLite database.
    """
    livekit_api_key = os.getenv("LIVEKIT_API_KEY")
    livekit_api_secret = os.getenv("LIVEKIT_API_SECRET")

    if not livekit_api_key or not livekit_api_secret:
        raise HTTPException(status_code=500, detail="LiveKit credentials not configured")

    # Create session record in database
    new_session = models.InterviewSession(
        participant_name=req.participant_name,
        room_name=req.room_name,
        status="in-progress"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    token = api.AccessToken(livekit_api_key, livekit_api_secret)
    token.with_identity(req.participant_name)
    token.with_name(req.participant_name)
    token.with_grants(api.VideoGrants(
        room_join=True,
        room=req.room_name,
    ))

    return {"token": token.to_jwt()}
