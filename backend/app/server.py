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
meetings = {
    "DEMO": {"passcode": "1234", "participants": []}
}

@app.on_event("startup")
async def startup_event():
    global processor
    processor = TranscriptionProcessor(model_size=MODEL_SIZE)
    print(f"[SERVER] Whisper '{MODEL_SIZE}' model loaded and ready.")

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
    await ws.accept()
    print(f"[WS] Client connected to meeting: {meeting_id}")

    if meeting_id not in meetings:
        print(f"[WS] Rejecting: Meeting {meeting_id} does not exist.")
        await ws.close(code=1008) # Policy Violation
        return

    audio_buffer = np.array([], dtype=np.float32)
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_dir = os.path.join(backend_dir, "storage", "transcriptions")
    os.makedirs(output_dir, exist_ok=True)
    
    accumulated_text = ""

    try:
        while True:
            # Receive binary PCM data from the browser
            data = await ws.receive_bytes()

            # Convert Int16 PCM bytes → Float32 array (same as our CLI pipeline)
            pcm_int16 = np.frombuffer(data, dtype=np.int16)
            pcm_float32 = pcm_int16.astype(np.float32) / 32768.0

            # Accumulate into buffer
            audio_buffer = np.concatenate([audio_buffer, pcm_float32])

            # Process when we have enough audio
            if len(audio_buffer) >= BUFFER_SIZE:
                chunk = audio_buffer[:BUFFER_SIZE]
                audio_buffer = audio_buffer[BUFFER_SIZE:]

                # Run transcription in a thread to not block the event loop
                loop = asyncio.get_event_loop()
                text = await loop.run_in_executor(
                    None, processor.transcribe_chunk, chunk
                )

                if text and len(text.strip()) > 2:
                    accumulated_text += text.strip() + " "
                    timestamp = datetime.now().strftime("%H:%M:%S")

                    # Send result back to the frontend
                    await ws.send_json({
                        "text": text.strip(),
                        "speaker_id": "1",          # Placeholder until Pyannote is integrated
                        "timestamp": timestamp,
                        "acoustic_features": {       # Placeholder until OpenSmile is integrated
                            "pitch": float(np.mean(np.abs(chunk)) * 100),
                            "energy": float(np.sqrt(np.mean(chunk**2)) * 100),
                        }
                    })
                    print(f"[WS] Transcribed: {text.strip()}")

    except WebSocketDisconnect:
        print("[WS] Client disconnected")
    except Exception as e:
        print(f"[WS] Error: {e}")
    finally:
        # Save accumulated transcription
        if accumulated_text:
            output_file = os.path.join(output_dir, "latest_transcription.txt")
            with open(output_file, "w") as f:
                f.write(accumulated_text.strip())
            print(f"[WS] Transcription saved to {output_file}")
