/**
 * API Client Service
 * Handles all HTTP requests to the backend API
 */

import axios, { type AxiosInstance, AxiosError } from 'axios';
import { type Thread, type ThreadListItem } from '../types/thread';
import { type Goal } from '../types/goal';
import { type Portfolio, type OptimizationParams, type OptimizationResult } from '../types/portfolio';
import { type SimulationParams, type SimulationResult } from '../types/simulation';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth tokens (when implemented)
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          // Server responded with error status
          console.error('API Error:', error.response.data);
        } else if (error.request) {
          // Request made but no response
          console.error('Network Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // ==================== Thread Management ====================

  async getThreads(params?: {
    limit?: number;
    offset?: number;
    category?: string;
    goalType?: string;
    search?: string;
  }): Promise<{ threads: ThreadListItem[]; total: number; hasMore: boolean }> {
    const response = await this.client.get('/threads', { params });
    return response.data;
  }

  async getThread(id: string): Promise<Thread> {
    const response = await this.client.get(`/threads/${id}`);
    return response.data;
  }

  async createThread(title?: string): Promise<Thread> {
    const response = await this.client.post('/threads', { title });
    return response.data;
  }

  async updateThread(id: string, data: Partial<Thread>): Promise<Thread> {
    const response = await this.client.patch(`/threads/${id}`, data);
    return response.data;
  }

  async deleteThread(id: string): Promise<void> {
    await this.client.delete(`/threads/${id}`);
  }

  async restoreThread(id: string): Promise<void> {
    await this.client.post(`/threads/${id}/restore`);
  }

  // ==================== Chat & Messaging ====================

  async sendMessage(
    threadId: string,
    message: string,
    context?: Record<string, any>
  ): Promise<{ messageId: string; response: string }> {
    const response = await this.client.post('/chat/message', {
      threadId,
      message,
      context,
    });
    return response.data;
  }

  // SSE streaming handled separately in streaming.ts

  // ==================== Goal Management ====================

  async getGoals(params?: {
    category?: string;
    priority?: string;
    status?: string;
  }): Promise<{ goals: Goal[] }> {
    const response = await this.client.get('/goals', { params });
    return response.data;
  }

  async getGoal(id: string): Promise<Goal> {
    const response = await this.client.get(`/goals/${id}`);
    return response.data;
  }

  async createGoal(goal: Partial<Goal>): Promise<Goal> {
    const response = await this.client.post('/goals', goal);
    return response.data;
  }

  async updateGoal(id: string, data: Partial<Goal>): Promise<Goal> {
    const response = await this.client.patch(`/goals/${id}`, data);
    return response.data;
  }

  async deleteGoal(id: string): Promise<void> {
    await this.client.delete(`/goals/${id}`);
  }

  // ==================== Portfolio Operations ====================

  async getCurrentPortfolio(): Promise<Portfolio> {
    const response = await this.client.get('/portfolio/current');
    return response.data;
  }

  async optimizePortfolio(params: OptimizationParams): Promise<OptimizationResult> {
    const response = await this.client.post('/portfolio/optimize', params);
    return response.data;
  }

  // ==================== Monte Carlo Simulations ====================

  async runSimulation(params: SimulationParams): Promise<{ simulationId: string; statusUrl: string }> {
    const response = await this.client.post('/simulations/run', params);
    return response.data;
  }

  async getSimulationStatus(
    simulationId: string
  ): Promise<{ status: string; progress: number; completedAt?: number }> {
    const response = await this.client.get(`/simulations/${simulationId}/status`);
    return response.data;
  }

  async getSimulationResult(simulationId: string): Promise<SimulationResult> {
    const response = await this.client.get(`/simulations/${simulationId}/result`);
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
