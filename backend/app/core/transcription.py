import whisper
import torch
import numpy as np
from ..utils.constants import ENERGY_THRESHOLD

class TranscriptionProcessor:
    def __init__(self, model_size="medium.en"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Loading '{model_size}' model on {self.device}... (Can take a while on CPU)")
        self.model = whisper.load_model(model_size, device=self.device)

    def transcribe_chunk(self, audio_data):
        """Transcribes audio with basic energy-based silence detection."""
        # 1. Silence check (prevent transcribing static/background noise)
        energy = np.sqrt(np.mean(audio_data**2))
        if energy < ENERGY_THRESHOLD:
            return ""

        # 2. Transcription
        # fp16 only works on CUDA for some versions/platforms
        fp16 = torch.cuda.is_available()
        result = self.model.transcribe(audio_data, fp16=fp16, beam_size=5)
        text = result["text"].strip()

        return text
