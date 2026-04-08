import { useState, useEffect, useRef, useCallback } from 'react';
import { prepareAudioChunk } from '../utils/audioProcessor';
import { useMeetingStore } from '../store/useMeetingStore';

const BASE_WS_URL = 'ws://localhost:8000/ws';

export interface TranscriptSegment {
    text: string;
    speaker_id: string;
    timestamp: string;
}

export interface AcousticFeatures {
    pitch: number;
    energy: number;
}

export interface UseSpeechSocketReturn {
    isMicActive: boolean;
    isConnected: boolean;
    transcript: TranscriptSegment[];
    acousticFeatures: AcousticFeatures;
    toggleMic: () => Promise<void>;
}

/**
 * Hook to manage WebSocket connection and real-time audio streaming.
 * 
 * - WebSocket connects immediately on mount (always open).
 * - Mic starts MUTED. User unmutes to begin streaming audio.
 * - Audio is sent as raw 16-bit PCM over the WebSocket.
 * - Transcription results come back as JSON.
 */
export const useSpeechSocket = (): UseSpeechSocketReturn => {
    const [isMicActive, setIsMicActive] = useState<boolean>(false);
    const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
    const [acousticFeatures, setAcousticFeatures] = useState<AcousticFeatures>({ pitch: 0, energy: 0 });
    const [isConnected, setIsConnected] = useState<boolean>(false);
    
    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { user } = useMeetingStore();

    // ─── WebSocket: Connect on mount, auto-reconnect ───────────────
    const connectWebSocket = useCallback(() => {
        if (!user?.meetingId) return;
        
        // Don't reconnect if already open or connecting
        if (wsRef.current?.readyState === WebSocket.OPEN || 
            wsRef.current?.readyState === WebSocket.CONNECTING) return;

        const wsUrl = `${BASE_WS_URL}/${user.meetingId}`;
        console.log('[WS] Connecting to', wsUrl);
        const ws = new WebSocket(wsUrl);
        ws.binaryType = 'arraybuffer';

        ws.onopen = () => {
            console.log('[WS] ✅ Connected');
            setIsConnected(true);
        };

        ws.onclose = () => {
            console.log('[WS] Disconnected — will retry in 3s');
            setIsConnected(false);
            // Auto-reconnect after 3 seconds
            reconnectTimerRef.current = setTimeout(() => {
                connectWebSocket();
            }, 3000);
        };

        ws.onerror = (error) => {
            console.error('[WS] Error:', error);
        };
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.text) {
                    setTranscript((prev) => [...prev, {
                        text: data.text,
                        speaker_id: data.speaker_id || 'unknown',
                        timestamp: data.timestamp || new Date().toLocaleTimeString(),
                    }]);
                }
                if (data.acoustic_features) {
                    setAcousticFeatures(data.acoustic_features);
                }
            } catch (err) {
                console.error('[WS] Failed to parse message:', err);
            }
        };

        wsRef.current = ws;
    }, []);

    // Connect WebSocket immediately on mount
    useEffect(() => {
        connectWebSocket();

        return () => {
            // Cleanup on unmount
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            if (wsRef.current) wsRef.current.close();
        };
    }, [connectWebSocket]);

    // ─── Mic: Start/Stop audio streaming ──────────────────────────
    const startMic = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: true, 
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000,
                } 
            });
            streamRef.current = stream;

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000
            });
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            sourceRef.current = source;
            
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (event: AudioProcessingEvent) => {
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    const inputData = event.inputBuffer.getChannelData(0);
                    const pcmChunk = prepareAudioChunk(inputData, audioContext.sampleRate);
                    wsRef.current.send(pcmChunk);
                }
            };

            source.connect(processor);
            processor.connect(audioContext.destination);
            
            setIsMicActive(true);
            console.log('[Mic] 🎙️ Unmuted — streaming audio');
        } catch (err) {
            console.error('[Mic] Error accessing microphone:', err);
        }
    }, []);

    const stopMic = useCallback(() => {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current.onaudioprocess = null;
            processorRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        
        setIsMicActive(false);
        console.log('[Mic] 🔇 Muted — audio stream stopped');
    }, []);

    // Toggle mic on/off
    const toggleMic = useCallback(async () => {
        if (isMicActive) {
            stopMic();
        } else {
            await startMic();
        }
    }, [isMicActive, startMic, stopMic]);

    // Cleanup mic on unmount
    useEffect(() => {
        return () => {
            stopMic();
        };
    }, [stopMic]);

    return {
        isMicActive,
        isConnected,
        transcript,
        acousticFeatures,
        toggleMic,
    };
};
