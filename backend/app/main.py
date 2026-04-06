import sys
import os
import time
from queue import Queue
from threading import Thread

# Fix imports for script execution
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.utils.constants import *
from app.utils.audio_recorder import AudioRecorder
from app.core.transcription import TranscriptionProcessor

def main():
    # Initialize components
    recorder = AudioRecorder(chunk_length=CHUNK_LENGTH)
    processor = TranscriptionProcessor(model_size=MODEL_SIZE)
    audio_queue = Queue()
    
    # Store results
    accumulated_transcription = ""
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_file = os.path.join(backend_dir, "storage", "transcriptions", "latest_transcription.txt")
    
    # Ensure directory exists for output
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    # Start the recording thread
    rec_thread = Thread(
        target=recorder.record_loop, 
        args=(audio_queue,), 
        daemon=True
    )
    rec_thread.start()

    print(YELLOW + f"Listening (using {CHUNK_LENGTH}s chunks)... Press Ctrl+C to stop." + RESET_COLOR)
    print(YELLOW + "(Transcription will appear here as it processes)" + RESET_COLOR)

    try:
        while True:
            if not audio_queue.empty():
                audio_data = audio_queue.get()
                
                # Show status if there's a backlog
                if audio_queue.qsize() > 1:
                    print(f"\r{YELLOW}[Processing backlog: {audio_queue.qsize()} chunks]{RESET_COLOR}", end="", flush=True)

                transcription = processor.transcribe_chunk(audio_data)
                
                if transcription and len(transcription.strip()) > 2:
                    # Clear the status line if it was showing a backlog
                    print("\r" + " " * 50 + "\r", end="", flush=True)
                    print(NEON_GREEN + transcription + RESET_COLOR)
                    accumulated_transcription += transcription.strip() + " "
                
                audio_queue.task_done()
            else:
                time.sleep(0.1)

    except KeyboardInterrupt:
        print("\n" + YELLOW + "Stopping..." + RESET_COLOR)
        
        # Final save
        with open(output_file, "w") as f:
            f.write(accumulated_transcription.strip())
        print(GREEN + f"Transcription saved to {output_file}" + RESET_COLOR)
    
    finally:
        print("\nLOG:" + accumulated_transcription.strip())
        recorder.stop()

if __name__ == "__main__":
    main()
