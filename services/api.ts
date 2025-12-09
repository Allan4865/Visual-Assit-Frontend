import axios, { AxiosInstance, AxiosError } from 'axios';

// Types
export interface Camera {
  id: number;
  user_id: number;
  name: string;
  device_index: number;
  location?: string;
  created_at: string;
}

export interface Session {
  id: number;
  camera_id: number;
  start_time: string;
  end_time?: string;
  duration?: number;
}

export interface Detection {
  id: number;
  session_id: number;
  object_class_id: number;
  timestamp: string;
  confidence: number;
  position: 'izquierda' | 'centro' | 'derecha';
  distance_category: 'muy cerca' | 'cerca' | 'medio' | 'lejos';
  bbox_x1: number;
  bbox_y1: number;
  bbox_x2: number;
  bbox_y2: number;
}

export interface ObjectClass {
  id: number;
  english_name: string;
  spanish_name: string;
  description?: string;
}

export interface DetectionWithClass extends Detection {
  object_class: ObjectClass;
}

export interface SessionStats {
  total_detections: number;
  unique_objects: number;
  most_detected: { object_name: string; count: number }[];
  position_distribution: Record<string, number>;
  distance_distribution: Record<string, number>;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  language: string;
  created_at: string;
}

export interface UserStats {
  user_id: number;
  username: string;
  total_cameras: number;
  total_sessions: number;
  total_detections: number;
  language: string;
}

export interface Settings {
  id: number;
  user_id: number;
  key: string;
  value: string;
}

// API Client Class
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    this.client = axios.create({
      baseURL: `${baseURL}/api`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if needed in the future
        // const token = localStorage.getItem('token');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          // Server responded with error status
          console.error('API Error:', error.response.status, error.response.data);
        } else if (error.request) {
          // Request made but no response received
          console.error('Network Error: No response from server');
        } else {
          console.error('Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // ==================== CAMERA ENDPOINTS ====================

  async getCameras(): Promise<Camera[]> {
    const response = await this.client.get<Camera[]>('/cameras/');
    return response.data;
  }

  async getCamera(id: number): Promise<Camera> {
    const response = await this.client.get<Camera>(`/cameras/${id}`);
    return response.data;
  }

  async createCamera(data: Partial<Camera>): Promise<Camera> {
    const response = await this.client.post<Camera>('/cameras/', data);
    return response.data;
  }

  async updateCamera(id: number, data: Partial<Camera>): Promise<Camera> {
    const response = await this.client.put<Camera>(`/cameras/${id}`, data);
    return response.data;
  }

  async deleteCamera(id: number): Promise<void> {
    await this.client.delete(`/cameras/${id}`);
  }

  async discoverCameras(): Promise<{ index: number; name: string }[]> {
    // Increase timeout for camera discovery as it can take longer (OpenCV tests each index)
    const response = await this.client.get<{ index: number; name: string }[]>('/cameras/discover', {
      timeout: 30000, // 30 seconds timeout for camera discovery
    });
    return response.data;
  }

  async testCamera(index: number): Promise<{ success: boolean; message: string }> {
    const response = await this.client.post<{ success: boolean; message: string }>(`/cameras/test/${index}`);
    return response.data;
  }

  async getCameraStats(id: number): Promise<any> {
    const response = await this.client.get(`/cameras/${id}/stats`);
    return response.data;
  }

  // ==================== SESSION ENDPOINTS ====================

  async getSessions(): Promise<Session[]> {
    const response = await this.client.get<Session[]>('/sessions/');
    return response.data;
  }

  async getSession(id: number): Promise<Session> {
    const response = await this.client.get<Session>(`/sessions/${id}`);
    return response.data;
  }

  async createSession(data: { camera_id: number }): Promise<Session> {
    const response = await this.client.post<{ success: boolean; session: Session }>('/sessions/', data);
    return response.data.session;
  }

  async endSession(id: number): Promise<Session> {
    const response = await this.client.post<Session>(`/sessions/${id}/end`);
    return response.data;
  }

  async deleteSession(id: number): Promise<void> {
    await this.client.delete(`/sessions/${id}`);
  }

  async getActiveSessions(): Promise<Session[]> {
    const response = await this.client.get<Session[]>('/sessions/active');
    return response.data;
  }

  async getCompletedSessions(): Promise<Session[]> {
    const response = await this.client.get<Session[]>('/sessions/completed');
    return response.data;
  }

  async getSessionsWithCounts(): Promise<any[]> {
    const response = await this.client.get('/sessions/with-counts');
    return response.data;
  }

  async getSessionDurationStats(): Promise<any> {
    const response = await this.client.get('/sessions/duration-stats');
    return response.data;
  }

  async getCameraSessions(cameraId: number): Promise<Session[]> {
    const response = await this.client.get<Session[]>(`/sessions/camera/${cameraId}`);
    return response.data;
  }

  // ==================== DETECTION ENDPOINTS ====================

  async createDetection(data: Partial<Detection>): Promise<Detection> {
    const response = await this.client.post<Detection>('/detections/', data);
    return response.data;
  }

  async createBulkDetections(data: Partial<Detection>[]): Promise<Detection[]> {
    const response = await this.client.post<Detection[]>('/detections/bulk', data);
    return response.data;
  }

  async getDetection(id: number): Promise<DetectionWithClass> {
    const response = await this.client.get<DetectionWithClass>(`/detections/${id}`);
    return response.data;
  }

  async getSessionDetections(sessionId: number): Promise<DetectionWithClass[]> {
    const response = await this.client.get<DetectionWithClass[]>(`/detections/session/${sessionId}`);
    return response.data;
  }

  async getSessionDetectionsByClass(sessionId: number, classId: number): Promise<DetectionWithClass[]> {
    const response = await this.client.get<DetectionWithClass[]>(`/detections/session/${sessionId}/class/${classId}`);
    return response.data;
  }

  async getSessionDetectionsByPosition(
    sessionId: number,
    position: 'izquierda' | 'centro' | 'derecha'
  ): Promise<DetectionWithClass[]> {
    const response = await this.client.get<DetectionWithClass[]>(
      `/detections/session/${sessionId}/position/${position}`
    );
    return response.data;
  }

  async getSessionDetectionsByDistance(
    sessionId: number,
    distance: 'muy cerca' | 'cerca' | 'medio' | 'lejos'
  ): Promise<DetectionWithClass[]> {
    const response = await this.client.get<DetectionWithClass[]>(
      `/detections/session/${sessionId}/distance/${distance}`
    );
    return response.data;
  }

  async getPriorityDetections(sessionId: number): Promise<DetectionWithClass[]> {
    const response = await this.client.get<DetectionWithClass[]>(
      `/detections/session/${sessionId}/priority`
    );
    return response.data;
  }

  async getSessionStats(sessionId: number): Promise<SessionStats> {
    const response = await this.client.get<SessionStats>(`/detections/session/${sessionId}/stats`);
    return response.data;
  }

  async getDangerZones(sessionId: number): Promise<any> {
    const response = await this.client.get(`/detections/session/${sessionId}/danger-zones`);
    return response.data;
  }

  // ==================== USER ENDPOINTS ====================

  async getUsers(): Promise<User[]> {
    const response = await this.client.get<User[]>('/users/');
    return response.data;
  }

  async getUser(id: number): Promise<User> {
    const response = await this.client.get<User>(`/users/${id}`);
    return response.data;
  }

  async createUser(data: { username: string; email?: string; language?: string }): Promise<User> {
    const response = await this.client.post<User>('/users/', data);
    return response.data;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response = await this.client.put<User>(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: number): Promise<void> {
    await this.client.delete(`/users/${id}`);
  }

  async getUserStats(id: number): Promise<UserStats> {
    const response = await this.client.get<UserStats>(`/users/${id}/stats`);
    return response.data;
  }

  async getUserSettings(userId: number): Promise<Settings[]> {
    const response = await this.client.get<Settings[]>(`/users/${userId}/settings`);
    return response.data;
  }

  async getUserSetting(userId: number, key: string): Promise<Settings> {
    const response = await this.client.get<Settings>(`/users/${userId}/settings/${key}`);
    return response.data;
  }

  async setUserSetting(userId: number, key: string, value: string): Promise<Settings> {
    const response = await this.client.post<Settings>(`/users/${userId}/settings`, { key, value });
    return response.data;
  }

  async deleteUserSetting(userId: number, key: string): Promise<void> {
    await this.client.delete(`/users/${userId}/settings/${key}`);
  }

  // Helper method for error handling
  handleError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        return error.response.data?.message || error.response.statusText;
      } else if (error.request) {
        return 'No se pudo conectar con el servidor';
      }
    }
    return 'Ha ocurrido un error inesperado';
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
