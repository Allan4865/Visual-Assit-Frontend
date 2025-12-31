'use client';

/*
 * Componente React para mostrar la transmisión de video y los eventos de
 * detección en tiempo real usando Socket.IO.
 *
 * - Conecta al backend mediante Socket.IO en el namespace /detection
 * - Recibe frames de video codificados en base64 desde el backend
 * - Muestra detecciones en tiempo real con priorización
 * - Ofrece síntesis de voz configurable para alertas
 * - Accesibilidad mejorada con aria-live regions
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useDetections } from '@/hooks/useDetections';
import { useSession } from '@/context/SessionContext';
import { useAccessibility } from '@/context/AccessibilityContext';
import { FaPlay, FaStop, FaVolumeUp, FaVolumeMute, FaFileAlt, FaVideo } from 'react-icons/fa';

export default function VideoStream() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [announcement, setAnnouncement] = useState<string>('');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [isDetectionRunning, setIsDetectionRunning] = useState(false);
  const [textMode, setTextMode] = useState(false);

  const { theme } = useAccessibility();

  // TTS throttling refs
  const lastSpeechTimeRef = useRef<number>(0);
  const isSpeakingRef = useRef<boolean>(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const SPEECH_THROTTLE_MS = 2000;

  // Audio refs for sound effects
  const connectSound = useRef<HTMLAudioElement | null>(null);
  const disconnectSound = useRef<HTMLAudioElement | null>(null);

  // Initialize sound effects
  useEffect(() => {
    if (typeof window !== 'undefined') {
      connectSound.current = new Audio('/sounds/connect.mp3'); // Placeholder paths
      disconnectSound.current = new Audio('/sounds/disconnect.mp3');

      // Force load voices
      const handleVoicesChanged = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log(`🎤 Voices loaded: ${voices.length}`);
      };

      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
      // Trigger initially in case they are already loaded
      handleVoicesChanged();

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  const {
    selectedCamera,
    currentSession,
    startSession,
    endSession,
    loadCameras,
  } = useSession();

  const {
    isConnected,
    latestFrame,
    frameCount,
    startDetection,
    stopDetection,
    error: socketError,
  } = useSocket({
    autoConnect: true,
    onConnect: () => {
      console.log('Socket connected');
      // Play connect sound if enabled (logic could be refined)
    },
    onDisconnect: (reason) => {
      console.log('Socket disconnected:', reason);
      if (audioEnabled) disconnectSound.current?.play().catch(() => { });
    },
  });

  const { detections, latestDetection, addDetections, clearDetections } = useDetections({
    maxHistorySize: 20,
  });

  // Load cameras
  useEffect(() => {
    loadCameras();
  }, [loadCameras]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input or pressing a button
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLButtonElement
      ) return;

      switch (e.key.toLowerCase()) {
        case ' ': // Space: Toggle Detection
        case 'enter':
          e.preventDefault();
          if (isDetectionRunning) handleStopDetection();
          else handleStartDetection();
          break;
        case 'm': // M: Toggle Mute
          setAudioEnabled(prev => !prev);
          speak(audioEnabled ? "Audio desactivado" : "Audio activado", true);
          break;
        case 't': // T: Toggle Text Mode
          setTextMode(prev => !prev);
          speak(textMode ? "Modo video" : "Modo solo texto", true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDetectionRunning, audioEnabled, textMode]); // Dependencies for handlers

  // Process detections from latest frame (Always run, regardless of view mode)
  useEffect(() => {
    if (latestFrame) {
      addDetections(latestFrame);
    }
  }, [latestFrame, addDetections]);

  // Render video frame & overlays (Only run in Video Mode)
  useEffect(() => {
    if (!latestFrame || !canvasRef.current || textMode) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Draw High Contrast Overlays if enabled
      if (theme === 'high-contrast' && detections.length > 0) {
        // Draw HUD overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, 40);
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#FFFF00';
        ctx.fillText(`Objetos: ${detections.length}`, 10, 30);
      }
    };
    img.src = `data:image/jpeg;base64,${latestFrame.frame}`;
  }, [latestFrame, textMode, theme, detections]);

  // Audio Feedback Logic
  useEffect(() => {
    if (!latestDetection) return;

    const message = `${latestDetection.objectNameEs} ${latestDetection.distanceCategory} a la ${latestDetection.position}`;
    setAnnouncement(message);

    // Debug: Log detection data
    console.log('🎯 Detection received:', {
      object: latestDetection.objectNameEs,
      distanceCategory: latestDetection.distanceCategory,
      position: latestDetection.position,
      audioEnabled,
    });

    if (audioEnabled) {
      const now = Date.now();
      const timeSinceLastSpeech = now - lastSpeechTimeRef.current;

      // Normalize distance category for comparison (handle both formats)
      const distCat = latestDetection.distanceCategory?.toLowerCase().trim();
      const isPriority = distCat === 'muy cerca' || distCat === 'muy_cerca' ||
        distCat === 'cerca' || distCat === 'close' || distCat === 'very close';

      // Debug: Log TTS decision factors
      console.log('🔊 TTS Check:', {
        distanceCategory: distCat,
        isPriority,
        timeSinceLastSpeech,
        throttleMs: SPEECH_THROTTLE_MS,
        isSpeaking: isSpeakingRef.current,
        willSpeak: timeSinceLastSpeech >= SPEECH_THROTTLE_MS && !isSpeakingRef.current && isPriority
      });

      if (timeSinceLastSpeech >= SPEECH_THROTTLE_MS && !isSpeakingRef.current && isPriority) {
        console.log('✅ Speaking:', message);
        speak(message);
        lastSpeechTimeRef.current = now;
      }
    }
  }, [latestDetection, audioEnabled, SPEECH_THROTTLE_MS]);

  const speak = useCallback((message: string, force = false) => {
    if (typeof window === 'undefined' || (!audioEnabled && !force)) return;
    const synth = window.speechSynthesis;
    if (!synth) return;

    if (force) {
      synth.cancel(); // Interrupt if forced (system message)
      isSpeakingRef.current = false;
      if (currentUtteranceRef.current) {
        currentUtteranceRef.current = null;
      }
    }

    // Prevent overlap if not forced
    if (isSpeakingRef.current && !force) return;

    isSpeakingRef.current = true;
    const utter = new SpeechSynthesisUtterance(message);
    utter.lang = 'es-ES';
    utter.rate = 1.2;

    // Store reference to prevent garbage collection which can stop events from firing
    currentUtteranceRef.current = utter;

    const cleanup = () => {
      if (currentUtteranceRef.current === utter) {
        isSpeakingRef.current = false;
        currentUtteranceRef.current = null;
      }
    };

    utter.onend = cleanup;
    utter.onerror = (e) => {
      console.error("Speech error", e);
      cleanup();
    };

    synth.speak(utter);

    // Safety timeout: Reset after 5 seconds just in case onend never fires
    // This prevents the system from getting "stuck" thinking it's speaking forever
    setTimeout(cleanup, 5000);

  }, [audioEnabled]);

  const handleStartDetection = useCallback(async () => {
    if (!selectedCamera) {
      speak("Error. Selecciona una cámara primero.", true);
      return;
    }
    try {
      const session = await startSession(selectedCamera.id);
      if (!session?.id) throw new Error('Invalid session');

      startDetection(session.id, selectedCamera.id);
      setIsDetectionRunning(true);
      clearDetections();
      speak("Iniciando detección", true);
    } catch (err) {
      console.error(err);
      speak("Error al iniciar detección", true);
    }
  }, [selectedCamera, startSession, startDetection, clearDetections, speak]);

  const handleStopDetection = useCallback(async () => {
    if (!currentSession) return;
    try {
      stopDetection(currentSession.id);
      setIsDetectionRunning(false);
      await endSession();
      speak("Detección detenida", true);
    } catch (err) {
      console.error(err);
    }
  }, [currentSession, stopDetection, endSession, speak]);

  return (
    <div className="space-y-4" role="region" aria-label="Reproductor de video">
      {/* Status Bar */}
      <div className="flex flex-wrap gap-4 items-center text-sm justify-between bg-gray-900/50 p-2 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2" role="status">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={theme === 'high-contrast' ? 'text-white font-bold' : 'text-gray-200'}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          {selectedCamera && (
            <div className={theme === 'high-contrast' ? 'text-yellow-400 font-bold' : 'text-gray-400'}>
              📷 {selectedCamera.name}
            </div>
          )}
        </div>

        {/* Keyboard Hints */}
        <div className="hidden md:flex gap-3 text-xs text-gray-500">
          <span>[Espacio] Iniciar/Parar</span>
          <span>[M] Audio</span>
          <span>[T] Modo Texto</span>
        </div>
      </div>

      {socketError && (
        <div className="p-3 bg-red-900/50 border border-red-700 rounded-md text-red-200" role="alert">
          Error: {socketError}
        </div>
      )}

      {/* Main Content Area */}
      <div className={`relative rounded-lg overflow-hidden border-2 min-h-[400px] flex flex-col
        ${theme === 'high-contrast' ? 'border-yellow-400 bg-black' : 'border-gray-800 bg-black'}`}>

        {textMode ? (
          // TEXT MODE VIEW
          <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center justify-center text-center">
            <h3 className={`text-2xl font-bold mb-6 ${theme === 'high-contrast' ? 'text-yellow-400' : 'text-white'}`}>
              Modo Solo Texto
            </h3>
            {detections.length > 0 ? (
              <ul className="space-y-4 w-full max-w-2xl">
                {detections.slice(0, 5).map((det, idx) => (
                  <li key={idx} className={`
                    p-6 rounded-lg text-2xl font-bold border-2
                    ${theme === 'high-contrast'
                      ? 'bg-black border-white text-white'
                      : 'bg-gray-800 border-gray-700 text-white'}
                  `}>
                    {det.objectNameEs} - {det.distanceCategory}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-xl">Esperando detecciones...</p>
            )}
          </div>
        ) : (
          // VIDEO MODE VIEW
          <>
            <canvas
              ref={canvasRef}
              className="w-full h-auto max-h-[600px] object-contain mx-auto"
            />
            {!latestFrame && (
              <div className="absolute inset-0 flex items-center justify-center z-0">
                <p className={`text-xl ${theme === 'high-contrast' ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {isDetectionRunning ? 'Esperando video...' : 'Presiona [Espacio] para iniciar'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls Bar */}
      {/* Controls */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center">
        <button
          onClick={isDetectionRunning ? handleStopDetection : handleStartDetection}
          onFocus={() => speak(isDetectionRunning ? "Botón Detener detección" : "Botón Iniciar detección")}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 ${isDetectionRunning
            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
            : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            }`}
          aria-label={isDetectionRunning ? "Detener detección" : "Iniciar detección"}
        >
          {isDetectionRunning ? <FaStop /> : <FaPlay />}
          {isDetectionRunning ? 'Detener' : 'Iniciar'}
        </button>

        <button
          onClick={() => setTextMode(!textMode)}
          onFocus={() => speak(`Botón Modo Texto: ${textMode ? 'Activado' : 'Desactivado'}`)}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 ${textMode
            ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            : 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
            }`}
          aria-label={textMode ? "Desactivar modo texto" : "Activar modo texto"}
        >
          {textMode ? <FaVideo /> : <FaFileAlt />}
          {textMode ? 'Modo Video' : 'Modo Texto'}
        </button>

        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          onFocus={() => speak(`Botón Audio: ${audioEnabled ? 'Activado' : 'Desactivado'}`)}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 ${audioEnabled
            ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
            : 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
            }`}
          aria-label={audioEnabled ? "Desactivar audio" : "Activar audio"}
        >
          {audioEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
          {audioEnabled ? 'Audio On' : 'Audio Off'}
        </button>

        <button
          onClick={() => speak("Prueba de audio. Uno, dos, tres.", true)}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-indigo-500"
        >
          🔊 Prueba de Audio
        </button>
      </div>

      {/* Debug Overlay */}
      <div className="p-2 bg-black/80 text-green-400 font-mono text-xs rounded border border-green-900 mt-2">
        <p>DEBUG AUDIO:</p>
        <p>Enabled: {audioEnabled.toString()}</p>
        <p>Voices Loaded: {window.speechSynthesis?.getVoices().length || 0}</p>
        <p>Latest Category: {latestDetection ? `"${latestDetection.distanceCategory}"` : 'None'}</p>
        <p>Is Priority: {latestDetection && (
          ['muy cerca', 'cerca', 'close', 'very close'].includes(latestDetection.distanceCategory?.toLowerCase().trim())
        ).toString()}</p>
      </div>
      <div role="status" aria-live="assertive" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
