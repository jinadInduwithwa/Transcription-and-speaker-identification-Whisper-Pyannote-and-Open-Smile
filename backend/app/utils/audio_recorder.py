import pyaudio
import numpy as np
from threading import Thread

class AudioRecorder:
    def __init__(self, chunk_length=3, rate=16000):
        self.chunk_length = chunk_length
        self.rate = rate
        self.p = pyaudio.PyAudio()
        self.stream = self.p.open(
            format=pyaudio.paInt16, 
            channels=1, 
            rate=self.rate, 
            input=True, 
            frames_per_buffer=1024
        )
        self.is_running = True

    def record_loop(self, audio_queue):
        """Continuously records audio and puts chunks into the queue."""
        while self.is_running:
            try:
                frames = []
                # Total samples to record for this chunk
                for _ in range(0, int(self.rate / 1024 * self.chunk_length)):
                    if not self.is_running:
                        break
                    data = self.stream.read(1024, exception_on_overflow=False)
                    frames.append(data)
                
                # Convert to numpy array and normalize to float32
                audio_np = np.frombuffer(b''.join(frames), dtype=np.int16).astype(np.float32) / 32768.0
                audio_queue.put(audio_np)
            except Exception as e:
                if "stream closed" not in str(e).lower():
                    print(f"Recording error: {e}")
                break

    def stop(self):
        self.is_running = False
        self.stream.stop_stream()
        self.stream.close()
        self.p.terminate()
