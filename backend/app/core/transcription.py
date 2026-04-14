import whisper
import torch
import numpy as np
import threading
from ..utils.constants import ENERGY_THRESHOLD

class TranscriptionProcessor:
    def __init__(self, model_size="medium.en"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.lock = threading.Lock()
        print(f"Loading '{model_size}' model on {self.device}... (Can take a while on CPU)")
        self.model = whisper.load_model(model_size, device=self.device)

    def transcribe_chunk(self, audio_data):
        """Transcribes audio with strict padding to avoid model dimension errors."""
        # 1. Ensure audio is exactly 30 seconds (Whisper standard)
        # 30 seconds at 16000Hz = 480,000 samples
        target_len = 480000 
        if len(audio_data) < target_len:
            audio_data = np.pad(audio_data, (0, target_len - len(audio_data)), 'constant')
        elif len(audio_data) > target_len:
            audio_data = audio_data[:target_len]

        print(f"[Core] Processing chunk: {len(audio_data)} samples")

        # 2. Silence check
        energy = np.sqrt(np.mean(audio_data**2))
        print(f"[Core] Chunk energy: {energy:.4f}")
        if energy < ENERGY_THRESHOLD:
            return ""

        # 3. Transcription using low-level decoding or optimized settings
        # fp16 MUST be False on CPU to prevent dimension errors
        fp16 = torch.cuda.is_available()
        
        try:
            with self.lock:
                result = self.model.transcribe(
                    audio_data, 
                    fp16=fp16, 
                    beam_size=5,
                    condition_on_previous_text=False, # Prevent hallucinations
                    # Force the model to not use old KV caches that might be corrupt
                    # (Note: whisper.transcribe doesn't have use_cache, but it uses it internally)
                )
                return result["text"].strip()
        except Exception as e:
            # Re-raise to be caught and logged by server.py with traceback
            raise e
