import { useState, useCallback, useEffect } from 'react';
import { DetectionWithClass } from '@/services/api';
import { FrameData } from '@/services/socket';

export interface DetectionEvent {
  id: string;
  objectName: string;
  objectNameEs: string;
  confidence: number;
  position: 'izquierda' | 'centro' | 'derecha';
  distanceCategory: 'muy cerca' | 'cerca' | 'medio' | 'lejos';
  timestamp: number;
  priority: number;
}

export interface UseDetectionsOptions {
  maxHistorySize?: number;
  priorityThreshold?: number;
}

export interface UseDetectionsReturn {
  detections: DetectionEvent[];
  latestDetection: DetectionEvent | null;
  priorityDetections: DetectionEvent[];
  addDetections: (frameData: FrameData) => void;
  clearDetections: () => void;
  getDetectionsByPosition: (position: string) => DetectionEvent[];
  getDetectionsByDistance: (distance: string) => DetectionEvent[];
  totalDetections: number;
}

/**
 * Custom hook for managing detection events
 */
export function useDetections(options: UseDetectionsOptions = {}): UseDetectionsReturn {
  const { maxHistorySize = 50, priorityThreshold = 0.7 } = options;

  const [detections, setDetections] = useState<DetectionEvent[]>([]);
  const [latestDetection, setLatestDetection] = useState<DetectionEvent | null>(null);

  /**
   * Calculate priority score for a detection
   * Higher score = higher priority (more urgent)
   */
  const calculatePriority = useCallback((detection: DetectionWithClass): number => {
    let score = 0;

    // Distance weight (closer = higher priority)
    const distanceWeights = {
      'muy cerca': 100,
      'cerca': 70,
      'medio': 40,
      'lejos': 10,
    };
    score += distanceWeights[detection.distance_category] || 0;

    // Position weight (center = higher priority)
    const positionWeights = {
      'centro': 30,
      'izquierda': 20,
      'derecha': 20,
    };
    score += positionWeights[detection.position] || 0;

    // Confidence weight
    score += detection.confidence * 20;

    return score;
  }, []);

  /**
   * Convert backend detection to frontend event format
   */
  const convertDetection = useCallback(
    (detection: DetectionWithClass, timestamp: number): DetectionEvent => {
      const priority = calculatePriority(detection);

      return {
        id: `${detection.id || Date.now()}-${Math.random()}`,
        objectName: detection.object_class?.english_name || 'Unknown',
        objectNameEs: detection.object_class?.spanish_name || 'Desconocido',
        confidence: detection.confidence,
        position: detection.position,
        distanceCategory: detection.distance_category,
        timestamp,
        priority,
      };
    },
    [calculatePriority]
  );

  /**
   * Add detections from a frame
   */
  const addDetections = useCallback(
    (frameData: FrameData) => {
      if (!frameData.detections || frameData.detections.length === 0) {
        return;
      }

      const newDetections = frameData.detections.map((det) =>
        convertDetection(det, frameData.timestamp)
      );

      setDetections((prev) => {
        const updated = [...newDetections, ...prev];
        // Limit history size
        return updated.slice(0, maxHistorySize);
      });

      // Set latest detection (highest priority from current frame)
      const highestPriority = newDetections.reduce((max, det) =>
        det.priority > max.priority ? det : max
      );
      setLatestDetection(highestPriority);
    },
    [convertDetection, maxHistorySize]
  );

  /**
   * Clear all detections
   */
  const clearDetections = useCallback(() => {
    setDetections([]);
    setLatestDetection(null);
  }, []);

  /**
   * Get detections filtered by position
   */
  const getDetectionsByPosition = useCallback(
    (position: string) => {
      return detections.filter((det) => det.position === position);
    },
    [detections]
  );

  /**
   * Get detections filtered by distance
   */
  const getDetectionsByDistance = useCallback(
    (distance: string) => {
      return detections.filter((det) => det.distanceCategory === distance);
    },
    [detections]
  );

  /**
   * Get priority detections (above threshold)
   */
  const priorityDetections = detections.filter(
    (det) => det.priority / 150 >= priorityThreshold
  );

  return {
    detections,
    latestDetection,
    priorityDetections,
    addDetections,
    clearDetections,
    getDetectionsByPosition,
    getDetectionsByDistance,
    totalDetections: detections.length,
  };
}

export default useDetections;
