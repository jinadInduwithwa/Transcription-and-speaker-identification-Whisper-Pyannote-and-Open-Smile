# Transcription and Speaker Identification Project

Real-time audio transcription and speaker identification using **Whisper**, **Pyannote**, and **OpenSmile**.

## 🚀 Current Status
- [x] **Real-time Transcription**: Whisper-based speech-to-text
- [x] **Multi-threaded Backend**: Concurrent recording and inference
- [x] **FastAPI WebSocket Server**: Streams transcription to the frontend in real-time
- [x] **React Frontend (Vite + TailwindCSS)**: Meeting dashboard with live transcript panel
- [ ] **Speaker Identification**: Pyannote integration (planned)
- [ ] **Acoustic Features**: OpenSmile integration (planned)

## 📂 Project Structure

```text
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   └── transcription.py    # Whisper model + transcribe logic
│   │   ├── utils/
│   │   │   ├── audio_recorder.py   # PyAudio recording thread (CLI mode)
│   │   │   └── constants.py        # Shared configuration
│   │   ├── server.py               # FastAPI WebSocket server (frontend integration)
│   │   └── main.py                 # CLI-only entry point
│   ├── storage/
│   │   └── transcriptions/         # Saved transcription output
│   └── requirements.txt
│
├── frontend/                       # Vite + React + TailwindCSS
│   ├── src/
│   │   ├── components/
│   │   │   └── MeetingDashboard.tsx # Main UI with live transcript sidebar
│   │   ├── hooks/
│   │   │   └── useSpeechSocket.ts  # WebSocket client + browser mic capture
│   │   ├── store/
│   │   │   └── useMeetingStore.ts  # Zustand state management
│   │   └── utils/
│   │       └── audioProcessor.ts   # PCM audio conversion for WebSocket
│   └── package.json
│
└── README.md
```

## 🏁 Getting Started

### 1. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the FastAPI WebSocket Server
```bash
cd backend
uvicorn app.server:app --host 0.0.0.0 --port 8000 --reload
```
The server will load the Whisper model and listen on `ws://localhost:8000/ws`.

### 3. Start the Frontend Dev Server
```bash
cd frontend
pnpm install
pnpm run dev
```
Open the frontend in your browser (default: `http://localhost:5173`).

### 4. Use It
1. Click **START REC** in the dashboard header
2. Allow microphone access in the browser
3. Speak — transcribed text will appear in the **Board Activity Log** sidebar
4. Click **STOP REC** to end the session

## 🔧 Architecture

```
┌──────────────┐     PCM Audio (WebSocket)     ┌──────────────────┐
│   Browser    │  ──────────────────────────▶  │  FastAPI Server  │
│  (React UI)  │                                │  (server.py)     │
│              │  ◀──────────────────────────  │                  │
│  useSpeech   │     JSON { text, speaker }     │  Whisper Model   │
│  Socket.ts   │                                │  transcription.py│
└──────────────┘                                └──────────────────┘
```

**Flow:**
1. Browser captures mic audio via `getUserMedia()` at 16kHz
2. Audio is converted to 16-bit PCM and sent over WebSocket
3. FastAPI buffers PCM into 3-second chunks
4. Whisper transcribes each chunk in a thread pool
5. JSON result is sent back to the browser
6. React UI updates the transcript sidebar in real-time

## ⚙️ Configuration
Edit `backend/app/utils/constants.py`:
- `MODEL_SIZE`: `"medium.en"` (try `"small.en"` or `"base.en"` for faster CPU performance)
- `CHUNK_LENGTH`: `3` seconds per transcription chunk
- `ENERGY_THRESHOLD`: `0.02` (silence detection threshold)

## 🔬 CLI Mode (No Frontend)
You can still run transcription directly from the terminal:
```bash
cd backend
python app/main.py
```
This uses PyAudio to record from the system mic and prints transcription to the console.
