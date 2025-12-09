import { useEffect, useState, useCallback, useRef } from 'react';
import { socketService, SocketEventHandlers, FrameData } from '@/services/socket';

export interface UseSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: any) => void;
}

export interface UseSocketReturn {
  isConnected: boolean;
  socketId: string | undefined;
  connect: () => void;
  disconnect: () => void;
  startDetection: (sessionId: number, cameraId: number) => void;
  stopDetection: (sessionId: number) => void;
  latestFrame: FrameData | null;
  frameCount: number;
  error: string | null;
}

/**
 * Custom hook for managing Socket.IO connection and events
 */
export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | undefined>(undefined);
  const [latestFrame, setLatestFrame] = useState<FrameData | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Use ref to avoid stale closures
  const handlersRef = useRef<SocketEventHandlers>({});

  // Setup event handlers
  useEffect(() => {
    handlersRef.current = {
      onConnect: () => {
        setIsConnected(true);
        setSocketId(socketService.getSocketId());
        setError(null);
        onConnect?.();
      },
      onDisconnect: (reason) => {
        setIsConnected(false);
        setSocketId(undefined);
        onDisconnect?.(reason);
      },
      onFrame: (data: FrameData) => {
        setLatestFrame(data);
        setFrameCount((prev) => prev + 1);
      },
      onDetectionStarted: (data) => {
        console.log('Detection started:', data);
        setError(null);
      },
      onDetectionStopped: (data) => {
        console.log('Detection stopped:', data);
      },
      onError: (err) => {
        console.error('Socket error:', err);
        setError(err.error || 'Unknown error');
        onError?.(err);
      },
      onConnected: (data) => {
        console.log('Connected:', data);
      },
    };
  }, [onConnect, onDisconnect, onError]);

  // Connect on mount if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      socketService.connect(handlersRef.current);
      setIsConnected(socketService.isConnected());
      setSocketId(socketService.getSocketId());
    }

    // Cleanup on unmount
    return () => {
      if (autoConnect) {
        socketService.disconnect();
      }
    };
  }, [autoConnect]);

  // Manual connect function
  const connect = useCallback(() => {
    socketService.connect(handlersRef.current);
    setIsConnected(socketService.isConnected());
    setSocketId(socketService.getSocketId());
  }, []);

  // Manual disconnect function
  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
    setSocketId(undefined);
    setLatestFrame(null);
    setFrameCount(0);
  }, []);

  // Start detection
  const startDetection = useCallback((sessionId: number, cameraId: number) => {
    socketService.startDetection(sessionId, cameraId);
  }, []);

  // Stop detection
  const stopDetection = useCallback((sessionId: number) => {
    socketService.stopDetection(sessionId);
  }, []);

  return {
    isConnected,
    socketId,
    connect,
    disconnect,
    startDetection,
    stopDetection,
    latestFrame,
    frameCount,
    error,
  };
}

export default useSocket;
