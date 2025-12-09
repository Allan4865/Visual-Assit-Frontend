import { io, Socket } from 'socket.io-client';
import type { DetectionWithClass } from './api';

// Types for Socket.IO events
export interface FrameData {
  frame: string; // base64 encoded image
  detections: DetectionWithClass[];
  frame_number: number;
  timestamp: number;
}

export interface DetectionStartedData {
  message: string;
  session_id: number;
  camera_id: number;
}

export interface DetectionStoppedData {
  message: string;
  session_id: number;
}

export interface SocketError {
  error: string;
  details?: any;
}

// Event handlers type
export interface SocketEventHandlers {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onFrame?: (data: FrameData) => void;
  onDetectionStarted?: (data: DetectionStartedData) => void;
  onDetectionStopped?: (data: DetectionStoppedData) => void;
  onError?: (error: SocketError) => void;
  onConnected?: (data: any) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private namespace: string;
  private url: string;

  constructor() {
    this.url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    this.namespace = process.env.NEXT_PUBLIC_SOCKET_NAMESPACE || '/detection';
  }

  /**
   * Connect to Socket.IO server
   */
  connect(handlers?: SocketEventHandlers): Socket {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    console.log(`Connecting to Socket.IO: ${this.url}${this.namespace}`);

    this.socket = io(`${this.url}${this.namespace}`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.setupEventHandlers(handlers);

    return this.socket;
  }

  /**
   * Setup event handlers for socket events
   */
  private setupEventHandlers(handlers?: SocketEventHandlers) {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket.IO connected:', this.socket?.id);
      handlers?.onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      handlers?.onDisconnect?.(reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      handlers?.onError?.({ error: 'Connection error', details: error });
    });

    // Custom events from backend
    this.socket.on('connected', (data) => {
      console.log('Connected event received:', data);
      handlers?.onConnected?.(data);
    });

    this.socket.on('frame', (data: FrameData) => {
      handlers?.onFrame?.(data);
    });

    this.socket.on('detection_started', (data: DetectionStartedData) => {
      console.log('Detection started:', data);
      handlers?.onDetectionStarted?.(data);
    });

    this.socket.on('detection_stopped', (data: DetectionStoppedData) => {
      console.log('Detection stopped:', data);
      handlers?.onDetectionStopped?.(data);
    });

    this.socket.on('error', (error: SocketError) => {
      console.error('Socket.IO error event:', error);
      handlers?.onError?.(error);
    });
  }

  /**
   * Start detection session
   */
  startDetection(sessionId: number, cameraId: number): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected. Call connect() first.');
      return;
    }

    console.log('Emitting start_detection:', { session_id: sessionId, camera_id: cameraId });

    this.socket.emit('start_detection', {
      session_id: sessionId,
      camera_id: cameraId,
    });
  }

  /**
   * Stop detection session
   */
  stopDetection(sessionId: number): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    console.log('Emitting stop_detection:', { session_id: sessionId });

    this.socket.emit('stop_detection', {
      session_id: sessionId,
    });
  }

  /**
   * Update event handlers dynamically
   */
  updateHandlers(handlers: SocketEventHandlers): void {
    if (!this.socket) return;

    // Remove existing listeners
    this.socket.off('frame');
    this.socket.off('detection_started');
    this.socket.off('detection_stopped');
    this.socket.off('error');
    this.socket.off('connected');

    // Add new handlers
    if (handlers.onFrame) {
      this.socket.on('frame', handlers.onFrame);
    }
    if (handlers.onDetectionStarted) {
      this.socket.on('detection_started', handlers.onDetectionStarted);
    }
    if (handlers.onDetectionStopped) {
      this.socket.on('detection_stopped', handlers.onDetectionStopped);
    }
    if (handlers.onError) {
      this.socket.on('error', handlers.onError);
    }
    if (handlers.onConnected) {
      this.socket.on('connected', handlers.onConnected);
    }
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
