'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Camera, Session, apiClient } from '@/services/api';

export interface SessionContextValue {
  // Camera state
  selectedCamera: Camera | null;
  availableCameras: Camera[];
  setSelectedCamera: (camera: Camera | null) => void;
  loadCameras: () => Promise<void>;
  discoverCameras: () => Promise<{ index: number; name: string }[]>;

  // Session state
  currentSession: Session | null;
  isSessionActive: boolean;
  startSession: (cameraId: number) => Promise<Session | null>;
  endSession: () => Promise<void>;

  // UI state
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  // Camera state
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [availableCameras, setAvailableCameras] = useState<Camera[]>([]);

  // Session state
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load available cameras from API
   */
  const loadCameras = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const cameras = await apiClient.getCameras();
      setAvailableCameras(cameras);

      // Auto-select first camera if none selected
      if (!selectedCamera && cameras.length > 0) {
        setSelectedCamera(cameras[0]);
      }
    } catch (err) {
      const errorMessage = apiClient.handleError(err);
      setError(errorMessage);
      console.error('Error loading cameras:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCamera]);

  /**
   * Discover available cameras (physical devices)
   */
  const discoverCameras = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const discovered = await apiClient.discoverCameras();
      return discovered;
    } catch (err) {
      const errorMessage = apiClient.handleError(err);
      setError(errorMessage);
      console.error('Error discovering cameras:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Start a new detection session
   */
  const startSession = useCallback(async (cameraId: number): Promise<Session | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await apiClient.createSession({ camera_id: cameraId });
      setCurrentSession(session);
      setIsSessionActive(true);
      console.log('Session started:', session);
      return session;
    } catch (err) {
      const errorMessage = apiClient.handleError(err);
      setError(errorMessage);
      console.error('Error starting session:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * End current detection session
   */
  const endSession = useCallback(async () => {
    if (!currentSession) {
      console.warn('No active session to end');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await apiClient.endSession(currentSession.id);
      setCurrentSession(null);
      setIsSessionActive(false);
      console.log('Session ended');
    } catch (err) {
      const errorMessage = apiClient.handleError(err);
      setError(errorMessage);
      console.error('Error ending session:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: SessionContextValue = {
    // Camera
    selectedCamera,
    availableCameras,
    setSelectedCamera,
    loadCameras,
    discoverCameras,

    // Session
    currentSession,
    isSessionActive,
    startSession,
    endSession,

    // UI
    isLoading,
    error,
    clearError,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Hook to use session context
 */
export function useSession() {
  const context = useContext(SessionContext);

  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }

  return context;
}

export default SessionContext;
