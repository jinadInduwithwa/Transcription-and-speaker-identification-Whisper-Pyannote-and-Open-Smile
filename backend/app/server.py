"""
FastAPI WebSocket server for real-time audio transcription.
Receives PCM audio from the browser, transcribes with Whisper,
and sends the result back via WebSocket.

Architecture:
  - All persistent state lives in PostgreSQL (via CRUD layer)
  - Active connection state lives in-memory (ConnectionManager)
  - No JSON files or .txt files are written
"""
import os
import sys
import json
import asyncio
import numpy as np
import random
import string
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Fix imports for script execution
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.transcription import TranscriptionProcessor
from app.utils.constants import MODEL_SIZE, ENERGY_THRESHOLD, CHUNK_LENGTH
from app.db.database import get_db, engine, Base
from app.db import crud, models

app = FastAPI(title="Meeting Portal API")

# Allow frontend dev server to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Whisper model (loaded once on startup) ────────────────────────
processor: TranscriptionProcessor = None


# ─── In-Memory Connection Manager ─────────────────────────────────
# Tracks ACTIVE websocket connections only.
# Historical data (chat, transcripts) is persisted to PostgreSQL.
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[tuple[WebSocket, str]]] = {}

    async def connect(self, websocket: WebSocket, meeting_id: str, user_name: str):
        await websocket.accept()
        if meeting_id not in self.active_connections:
            self.active_connections[meeting_id] = []

        # Replace old connection if same user reconnects
        self.active_connections[meeting_id] = [
            conn for conn in self.active_connections[meeting_id] if conn[1] != user_name
        ]
        self.active_connections[meeting_id].append((websocket, user_name))
        await self.broadcast_participants(meeting_id)

    def disconnect(self, websocket: WebSocket, meeting_id: str):
        if meeting_id in self.active_connections:
            self.active_connections[meeting_id] = [
                conn for conn in self.active_connections[meeting_id] if conn[0] != websocket
            ]
            if not self.active_connections[meeting_id]:
                del self.active_connections[meeting_id]

    async def broadcast_participants(self, meeting_id: str):
        if meeting_id in self.active_connections:
            participants = [
                {"id": str(id(ws)), "name": name, "isSpeaking": False}
                for ws, name in self.active_connections[meeting_id]
            ]
            await self.broadcast(meeting_id, {"type": "participants", "data": participants})

    async def broadcast(self, meeting_id: str, message: dict):
        if meeting_id in self.active_connections:
            for connection, _ in self.active_connections[meeting_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass


manager = ConnectionManager()


# ─── App Lifecycle ─────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    global processor
    # Create all tables (idempotent — skips existing tables)
    Base.metadata.create_all(bind=engine)

    # Seed DEMO meeting if it doesn't exist
    db = next(get_db())
    try:
        if not crud.get_meeting(db, "DEMO"):
            crud.create_meeting(db, "DEMO", "1234", "System")
            print("[DB] Seeded DEMO meeting.")
    finally:
        db.close()

    print(f"[Core] Initializing Whisper model ({MODEL_SIZE})...")
    processor = TranscriptionProcessor(model_size=MODEL_SIZE)
    print(f"[Core] Model loaded and ready.")


# ─── REST Endpoints ────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "model": MODEL_SIZE}


@app.post("/meeting/create")
async def create_meeting(data: dict, db: Session = Depends(get_db)):
    """Create a new meeting room, persisted in PostgreSQL."""
    meeting_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    passcode   = ''.join(random.choices(string.digits, k=4))

    scheduled_at = None
    if data.get("scheduled_at"):
        try:
            scheduled_at = datetime.fromisoformat(data["scheduled_at"])
        except ValueError:
            pass

    crud.create_meeting(
        db,
        meeting_id=meeting_id,
        passcode=passcode,
        creator=data.get("name", "Anonymous"),
        mode=data.get("mode", "instant"),
        scheduled_at=scheduled_at,
    )

    return {
        "status": "success",
        "meeting_id": meeting_id,
        "passcode": passcode,
        "invite_link": f"http://localhost:5173/login?meetingId={meeting_id}&passcode={passcode}",
    }


@app.post("/meeting/join")
async def join_meeting(data: dict, db: Session = Depends(get_db)):
    """Validate meeting credentials against PostgreSQL."""
    meeting_id = data.get("meeting_id", "").upper()
    passcode   = data.get("passcode", "")

    meeting = crud.get_meeting(db, meeting_id)
    if not meeting:
        return {"status": "error", "message": "Meeting not found"}
    if meeting.passcode != passcode:
        return {"status": "error", "message": "Invalid passcode"}

    return {"status": "success", "message": "Joined meeting", "meeting_id": meeting_id}


@app.get("/meeting/{meeting_id}/chats")
async def get_chat_history(meeting_id: str, db: Session = Depends(get_db)):
    """Return persisted chat history for a meeting (used when chat panel opens)."""
    messages = crud.get_chat_history(db, meeting_id.upper())
    return {
        "status": "success",
        "messages": [
            {
                "id": m.id,
                "sender": m.sender,
                "text": m.text,
                "timestamp": m.timestamp.strftime("%H:%M"),
            }
            for m in messages
        ],
    }


@app.get("/meeting/{meeting_id}/transcript")
async def get_transcript(meeting_id: str, db: Session = Depends(get_db)):
    """Return the full persisted transcript for a meeting."""
    entries = crud.get_transcript(db, meeting_id.upper())
    return {
        "status": "success",
        "transcript": [
            {
                "id": e.id,
                "speaker_name": e.speaker_name,
                "text": e.text,
                "created_at": e.created_at.isoformat(),
            }
            for e in entries
        ],
    }


# ─── Audio/WebSocket Config ────────────────────────────────────────
SAMPLE_RATE         = 16000
BUFFER_DURATION_SEC = CHUNK_LENGTH
BUFFER_SIZE         = SAMPLE_RATE * BUFFER_DURATION_SEC


@app.websocket("/ws/{meeting_id}")
async def websocket_endpoint(ws: WebSocket, meeting_id: str):
    user_name = ws.query_params.get("name", "Guest")

    # Validate meeting exists in DB
    db = next(get_db())
    try:
        meeting = crud.get_meeting(db, meeting_id)
        if not meeting:
            await ws.accept()
            await ws.send_json({"type": "error", "message": "Meeting not found"})
            await ws.close(code=1008)
            return
    finally:
        db.close()

    await manager.connect(ws, meeting_id, user_name)
    print(f"[WS] User '{user_name}' connected to meeting: {meeting_id}")

    audio_buffer = np.array([], dtype=np.float32)

    try:
        while True:
            try:
                message = await ws.receive()
            except WebSocketDisconnect:
                break

            if "bytes" in message:
                data = message["bytes"]
                pcm_int16   = np.frombuffer(data, dtype=np.int16)
                pcm_float32 = pcm_int16.astype(np.float32) / 32768.0
                audio_buffer = np.concatenate([audio_buffer, pcm_float32])

                # Send real-time acoustics to dashboard
                try:
                    await ws.send_json({
                        "type": "acoustics",
                        "data": {
                            "pitch":  float(np.mean(np.abs(pcm_float32)) * 120),
                            "energy": float(np.sqrt(np.mean(pcm_float32**2)) * 150),
                        }
                    })
                except Exception:
                    pass

            elif "text" in message:
                try:
                    payload  = json.loads(message["text"])
                    msg_type = payload.get("type")

                    if msg_type == "ping":
                        continue

                    elif msg_type == "chat":
                        text = payload.get("text", "").strip()
                        if text:
                            # Persist to PostgreSQL
                            db = next(get_db())
                            try:
                                crud.save_chat_message(db, meeting_id, user_name, text)
                            finally:
                                db.close()

                            timestamp = datetime.now().strftime("%H:%M")
                            await manager.broadcast(meeting_id, {
                                "type": "chat",
                                "data": {
                                    "sender":    user_name,
                                    "text":      text,
                                    "timestamp": timestamp,
                                }
                            })
                            print(f"[Chat] {user_name}: {text}")

                except Exception as e:
                    print(f"[WS] Failed to parse text message: {e}")
            else:
                continue

            # ─── Transcription ─────────────────────────────────────
            if len(audio_buffer) >= BUFFER_SIZE:
                chunk        = audio_buffer[:BUFFER_SIZE]
                audio_buffer = audio_buffer[BUFFER_SIZE:]

                energy = np.sqrt(np.mean(chunk**2))
                if energy < ENERGY_THRESHOLD:
                    continue

                loop = asyncio.get_event_loop()
                text = await loop.run_in_executor(None, processor.transcribe_chunk, chunk)

                if text and len(text.strip()) > 2:
                    # Persist to PostgreSQL
                    db = next(get_db())
                    try:
                        crud.save_transcript_entry(db, meeting_id, user_name, text.strip())
                    finally:
                        db.close()

                    timestamp = datetime.now().strftime("%H:%M:%S")
                    try:
                        await manager.broadcast(meeting_id, {
                            "type": "transcription",
                            "data": {
                                "text":         text.strip(),
                                "speaker_id":   str(id(ws)),
                                "speaker_name": user_name,
                                "timestamp":    timestamp,
                            }
                        })
                    except Exception:
                        pass
                    print(f"[WS] {user_name}: {text.strip()}")

    except WebSocketDisconnect:
        pass
    except Exception as e:
        import traceback
        print(f"[WS] Critical Error: {e}")
        traceback.print_exc()
    finally:
        manager.disconnect(ws, meeting_id)
        await manager.broadcast_participants(meeting_id)
        print(f"[WS] User '{user_name}' disconnected from meeting: {meeting_id}")
