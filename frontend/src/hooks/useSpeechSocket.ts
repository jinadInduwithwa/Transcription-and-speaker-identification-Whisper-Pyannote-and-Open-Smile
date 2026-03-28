import { useState, useEffect, useRef, useCallback } from 'react';
import { prepareAudioChunk } from '../utils/audioProcessor';

const WS_URL = 'ws://localhost:8000/ws';

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
    isRecording: boolean;
    isConnected: boolean;
    transcript: TranscriptSegment[];
    acousticFeatures: AcousticFeatures;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
}

/**
 * Hook to manage WebSocket connection and real-time audio streaming for speech-to-text.
 */
export const useSpeechSocket = (): UseSpeechSocketReturn => {
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
    const [acousticFeatures, setAcousticFeatures] = useState<AcousticFeatures>({ pitch: 0, energy: 0 });
    const [isConnected, setIsConnected] = useState<boolean>(false);
    
    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    // Initialize WebSocket
    useEffect(() => {
        const ws = new WebSocket(WS_URL);
        ws.onopen = () => setIsConnected(true);
        ws.onclose = () => setIsConnected(false);
        ws.onerror = (error) => console.error('WebSocket Error:', error);
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.text) {
                    setTranscript((prev) => [...prev, {
                        text: data.text,
                        speaker_id: data.speaker_id || 'unknown',
                        timestamp: new Date().toLocaleTimeString(),
                    }]);
                }
                
                if (data.acoustic_features) {
                    setAcousticFeatures(data.acoustic_features);
                }
            } catch (err) {
                console.error('Failed to parse WebSocket message:', err);
            }
        };

        wsRef.current = ws;
        
        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: true, 
                    noiseSuppression: true,
                    autoGainControl: true,
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
            
            setIsRecording(true);
        } catch (err) {
            console.error('Error starting recording:', err);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current.onaudioprocess = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        setIsRecording(false);
    }, []);

    return {
        isRecording,
        isConnected,
        transcript,
        acousticFeatures,
        startRecording,
        stopRecording
    };
};
