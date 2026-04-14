"""
FastAPI WebSocket server for real-time audio transcription.
Receives PCM audio from the browser, transcribes with Whisper, 
and sends the result back via WebSocket.
"""
import os
import sys
import json
import asyncio
import numpy as np
import random
import string
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Fix imports for script execution
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.transcription import TranscriptionProcessor
from app.utils.constants import MODEL_SIZE, ENERGY_THRESHOLD, CHUNK_LENGTH

app = FastAPI(title="Transcription WebSocket Server")

# Allow frontend dev server to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the Whisper model once at startup
processor: TranscriptionProcessor = None

# Simple In-Memory Meeting Registry
# In a real app, this would be a database.
# Structure: { meeting_id: { "passcode": "...", "participants": [] } }
meetings = {}

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[tuple[WebSocket, str]]] = {} # {meeting_id: [(ws, user_name)]}

    async def connect(self, websocket: WebSocket, meeting_id: str, user_name: str):
        await websocket.accept()
        if meeting_id not in self.active_connections:
            self.active_connections[meeting_id] = []
        
        # Prevent duplicate participants with the same name (replace old connection if exists)
        self.active_connections[meeting_id] = [conn for conn in self.active_connections[meeting_id] if conn[1] != user_name]
        
        self.active_connections[meeting_id].append((websocket, user_name))
        await self.broadcast_participants(meeting_id)

    def disconnect(self, websocket: WebSocket, meeting_id: str):
        if meeting_id in self.active_connections:
            self.active_connections[meeting_id] = [conn for conn in self.active_connections[meeting_id] if conn[0] != websocket]
            if not self.active_connections[meeting_id]:
                del self.active_connections[meeting_id]
        
    async def broadcast_participants(self, meeting_id: str):
        if meeting_id in self.active_connections:
            participants = [{"id": str(id(ws)), "name": name, "isSpeaking": False} for ws, name in self.active_connections[meeting_id]]
            await self.broadcast(meeting_id, {"type": "participants", "data": participants})

    async def broadcast(self, meeting_id: str, message: dict):
        if meeting_id in self.active_connections:
            for connection, _ in self.active_connections[meeting_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()

STORAGE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "meetings_db.json")

def save_meetings():
    try:
        with open(STORAGE_FILE, "w") as f:
            json.dump(meetings, f)
    except Exception as e:
        print(f"[Storage] Error saving: {e}")

def load_meetings():
    global meetings
    if os.path.exists(STORAGE_FILE):
        try:
            with open(STORAGE_FILE, "r") as f:
                meetings = json.load(f)
            print(f"[Storage] Loaded {len(meetings)} meetings.")
        except Exception as e:
            print(f"[Storage] Error loading: {e}")
    else:
        meetings = {"DEMO": {"passcode": "1234", "participants": []}}
        save_meetings()

@app.on_event("startup")
async def startup_event():
    global processor
    load_meetings()
    print(f"[Core] Initializing Whisper model ({MODEL_SIZE})...")
    processor = TranscriptionProcessor(model_size=MODEL_SIZE)
    print(f"[Core] Model loaded and ready.")

@app.get("/health")
async def health():
    return {"status": "ok", "model": MODEL_SIZE}

@app.post("/meeting/join")
async def join_meeting(data: dict):
    """
    Validate meeting credentials before allowing the frontend to proceed.
    JSON Body: { "meeting_id": "...", "passcode": "..." }
    """
    meeting_id = data.get("meeting_id", "").upper()
    passcode = data.get("passcode", "")

    if meeting_id in meetings:
        if meetings[meeting_id]["passcode"] == passcode:
            return {"status": "success", "message": "Joined meeting", "meeting_id": meeting_id}
        return {"status": "error", "message": "Invalid passcode"}
    
    # Auto-create if not exists for this prototype? 
    # Let's be strict for now:
    return {"status": "error", "message": "Meeting not found"}

@app.post("/meeting/create")
async def create_meeting(data: dict):
    """
    Create a new meeting room with a random ID and passcode.
    """
    # Generate random 6-character ID
    meeting_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    # Generate random 4-digit passcode
    passcode = ''.join(random.choices(string.digits, k=4))
    
    meetings[meeting_id] = {
        "passcode": passcode,
        "created_at": datetime.now().isoformat(),
        "scheduled_at": data.get("scheduled_at"),
        "mode": data.get("mode", "instant"),
        "creator": data.get("name", "Anonymous"),
        "participants": []
    }
    save_meetings()
    
    return {
        "status": "success", 
        "meeting_id": meeting_id, 
        "passcode": passcode,
        "invite_link": f"http://localhost:5173/login?meetingId={meeting_id}&passcode={passcode}"
    }


# ─── Audio Buffer Config ────────────────────────────────────────
# We accumulate small PCM packets from the browser into a larger
# buffer before sending them to Whisper for better accuracy.
SAMPLE_RATE = 16000
BUFFER_DURATION_SEC = CHUNK_LENGTH  # Use same chunk length as CLI mode
BUFFER_SIZE = SAMPLE_RATE * BUFFER_DURATION_SEC  # samples needed for one chunk


@app.websocket("/ws/{meeting_id}")
async def websocket_endpoint(ws: WebSocket, meeting_id: str):
    # Get user name from query params (e.g. /ws/ABC?name=Jinad)
    user_name = ws.query_params.get("name", "Guest")
    
    if meeting_id not in meetings:
        await ws.accept()
        await ws.send_json({"type": "error", "message": "Meeting not found"})
        await ws.close(code=1008)
        return

    await manager.connect(ws, meeting_id, user_name)
    print(f"[WS] User '{user_name}' connected to meeting: {meeting_id}")

    audio_buffer = np.array([], dtype=np.float32)
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_dir = os.path.join(backend_dir, "storage", "transcriptions")
    os.makedirs(output_dir, exist_ok=True)
    
    accumulated_text = ""

    try:
        while True:
            try:
                # Receive message from the browser
                message = await ws.receive()
            except WebSocketDisconnect:
                break
            
            if "bytes" in message:
                data = message["bytes"]
                # Convert Int16 PCM bytes → Float32 array (same as our CLI pipeline)
                pcm_int16 = np.frombuffer(data, dtype=np.int16)
                pcm_float32 = pcm_int16.astype(np.float32) / 32768.0

                # Accumulate into buffer
                audio_buffer = np.concatenate([audio_buffer, pcm_float32])

                # Send real-time acoustic data for the dashboard
                try:
                    await ws.send_json({
                        "type": "acoustics",
                        "data": {
                            "pitch": float(np.mean(np.abs(pcm_float32)) * 120),
                            "energy": float(np.sqrt(np.mean(pcm_float32**2)) * 150),
                        }
                    })
                except Exception:
                    # Connection might be closing, skip sending acoustics
                    pass

            elif "text" in message:
                try:
                    payload = json.loads(message["text"])
                    msg_type = payload.get("type")

                    if msg_type == "ping":
                        # Just a heartbeat to keep connection alive
                        continue

                    elif msg_type == "chat":
                        text = payload.get("text", "").strip()
                        if text:
                            timestamp = datetime.now().strftime("%H:%M")
                            await manager.broadcast(meeting_id, {
                                "type": "chat",
                                "data": {
                                    "sender": user_name,
                                    "text": text,
                                    "timestamp": timestamp,
                                }
                            })
                            print(f"[Chat] {user_name}: {text}")

                except Exception as e:
                    print(f"[WS] Failed to parse text message: {e}")
            else:
                continue


            # Process when we have enough audio for transcription
            if len(audio_buffer) >= BUFFER_SIZE:
                chunk = audio_buffer[:BUFFER_SIZE]
                audio_buffer = audio_buffer[BUFFER_SIZE:]

                # Check energy level to avoid transcribing silence (hallucination prevention)
                energy = np.sqrt(np.mean(chunk**2))
                if energy < ENERGY_THRESHOLD:
                    # Clear buffer and skip transcription if too quiet
                    continue

                # Run transcription in a thread to not block the event loop
                loop = asyncio.get_event_loop()
                text = await loop.run_in_executor(
                    None, processor.transcribe_chunk, chunk
                )
                
                if text and len(text.strip()) > 2:
                    accumulated_text += text.strip() + " "
                    timestamp = datetime.now().strftime("%H:%M:%S")

                    # Send result back to all meeting participants
                    try:
                        await manager.broadcast(meeting_id, {
                            "type": "transcription",
                            "data": {
                                "text": text.strip(),
                                "speaker_id": str(id(ws)),
                                "speaker_name": user_name,
                                "timestamp": timestamp,
                            }
                        })
                    except Exception:
                        pass
                    print(f"[WS] {user_name}: {text.strip()}")

    except WebSocketDisconnect:
        manager.disconnect(ws, meeting_id)
        await manager.broadcast_participants(meeting_id)
        print(f"[WS] User '{user_name}' disconnected")
    except Exception as e:
        import traceback
        print(f"[WS] Critical Error: {e}")
        traceback.print_exc()
    finally:
        # Save accumulated transcription
        if accumulated_text:
            output_file = os.path.join(output_dir, "latest_transcription.txt")
            with open(output_file, "w") as f:
                f.write(accumulated_text.strip())
            print(f"[WS] Transcription saved to {output_file}")
