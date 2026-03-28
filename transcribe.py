import os
import wave
import pyaudio
import whisper
import torch

# Color Constants
NEON_GREEN = '\033[92m'
RESET_COLOR = '\033[0m'
YELLOW = '\033[93m'
GREEN = '\033[92m'

# Configuration
MODEL_SIZE = "medium.en"  # Upgraded from base.en for higher accuracy
CHUNK_LENGTH = 3         # 3-second chunks for better context
ENERGY_THRESHOLD = 0.01  # Minimum audio energy to trigger transcription
HALLUCINATION_FILTER = ["you", "thank you.", "subtitles by", "thanks for watching.", "bye.", "."]

def whisperModel(model_size, device="cuda"):
    """Loads the Whisper model."""
    return whisper.load_model(model_size, device=device)

import numpy as np

def transcribe_chunk(model, audio_data):
    """
    Transcribes audio data with silence detection and basic hallucination filtering.
    """
    # 1. Silence check (prevent transcribing static/background noise)
    energy = np.sqrt(np.mean(audio_data**2))
    if energy < ENERGY_THRESHOLD:
        return ""

    # 2. Transcription
    fp16 = torch.cuda.is_available()
    result = model.transcribe(audio_data, fp16=fp16, beam_size=5)
    text = result["text"].strip()

    # 3. Filter common Whisper hallucinations in silent parts
    if text.lower() in HALLUCINATION_FILTER:
        return ""
        
    return text

def record_chunk(p, stream, chunk_length=3):
    """Records audio from stream and returns it as a numpy float32 array."""
    frames = []
    # Read frames in chunks
    for _ in range(0, int(16000/1024 * chunk_length)):
        data = stream.read(1024, exception_on_overflow=False)
        frames.append(data)
    
    # Convert directly to numpy (bypassing disk)
    return np.frombuffer(b''.join(frames), dtype=np.int16).astype(np.float32) / 32768.0

def main2():
    # Note: If CUDA is not available, we'll fall back to CPU
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Loading '{MODEL_SIZE}' model on {device}... (First run will download)")
    model = whisperModel(MODEL_SIZE, device=device)
    
    p = pyaudio.PyAudio()
    stream = p.open(format=pyaudio.paInt16, channels=1, rate=16000, input=True, frames_per_buffer=1024)
    
    accumulated_transcription = ""
    print(YELLOW + f"Listening (using {CHUNK_LENGTH}s chunks)... Press Ctrl+C to stop." + RESET_COLOR)

    try:
        while True:
            audio_data = record_chunk(p, stream, CHUNK_LENGTH)
            transcription = transcribe_chunk(model, audio_data)
            
            if transcription and len(transcription) > 2:
                print(NEON_GREEN + transcription + RESET_COLOR)
                accumulated_transcription += transcription + " "

    except KeyboardInterrupt:
        print("\n" + YELLOW + "Stopping recording..." + RESET_COLOR)
        with open("transcription.txt", "w") as log_file:
            log_file.write(accumulated_transcription.strip())
        print(GREEN + "Transcription saved to transcription.txt" + RESET_COLOR)
    finally:
        print("LOG:" + accumulated_transcription.strip())
        stream.stop_stream()
        stream.close()
        p.terminate()

if __name__ == "__main__":
    main2()