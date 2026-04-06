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

@app.on_event("startup")
async def startup_event():
    global processor
    processor = TranscriptionProcessor(model_size=MODEL_SIZE)
    print(f"[SERVER] Whisper '{MODEL_SIZE}' model loaded and ready.")

@app.get("/health")
async def health():
    return {"status": "ok", "model": MODEL_SIZE}


# ─── Audio Buffer Config ────────────────────────────────────────
# We accumulate small PCM packets from the browser into a larger
# buffer before sending them to Whisper for better accuracy.
SAMPLE_RATE = 16000
BUFFER_DURATION_SEC = CHUNK_LENGTH  # Use same chunk length as CLI mode
BUFFER_SIZE = SAMPLE_RATE * BUFFER_DURATION_SEC  # samples needed for one chunk


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    print("[WS] Client connected")

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
