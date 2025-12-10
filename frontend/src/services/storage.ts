/**
 * LocalStorage Service
 * Handles persistent storage of threads and user data
 */

import { type Thread } from '../types/thread';

const STORAGE_VERSION = 1;
const STORAGE_KEY = 'wealthnav_data';
const MAX_THREADS = 100;

export interface LocalStorageSchema {
  version: number;
  threads: Thread[];
  currentThreadId: string | null;
  lastSync: number;
}

class StorageService {
  /**
   * Initialize storage with default values if not exists
   */
  initialize(): void {
    const existing = this.getData();
    if (!existing) {
      const initialData: LocalStorageSchema = {
        version: STORAGE_VERSION,
        threads: [],
        currentThreadId: null,
        lastSync: Date.now(),
      };
      this.setData(initialData);
    }
  }

  /**
   * Get all data from localStorage
   */
  private getData(): LocalStorageSchema | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to parse localStorage data:', error);
      return null;
    }
  }

  /**
   * Set all data to localStorage
   */
  private setData(data: LocalStorageSchema): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      throw new Error('Failed to save data');
    }
  }

  /**
   * Get all threads
   */
  getThreads(): Thread[] {
    const data = this.getData();
    if (!data) return [];
    return data.threads.filter((t) => !t.deletedAt);
  }

  /**
   * Get a single thread by ID
   */
  getThread(id: string): Thread | null {
    const threads = this.getThreads();
    return threads.find((t) => t.id === id) || null;
  }

  /**
   * Save a thread (create or update)
   */
  saveThread(thread: Thread): void {
    const data = this.getData();
    if (!data) {
      this.initialize();
      return this.saveThread(thread);
    }

    const existingIndex = data.threads.findIndex((t) => t.id === thread.id);

    if (existingIndex >= 0) {
      // Update existing thread
      data.threads[existingIndex] = {
        ...thread,
        updatedAt: Date.now(),
      };
    } else {
      // Add new thread
      // Check if we've hit the max threads limit
      if (data.threads.filter((t) => !t.deletedAt).length >= MAX_THREADS) {
        throw new Error(`Maximum of ${MAX_THREADS} threads allowed`);
      }
      data.threads.push({
        ...thread,
        createdAt: thread.createdAt || Date.now(),
        updatedAt: Date.now(),
      });
    }

    data.lastSync = Date.now();
    this.setData(data);
  }

  /**
   * Delete a thread (soft delete)
   */
  deleteThread(id: string): void {
    const data = this.getData();
    if (!data) return;

    const thread = data.threads.find((t) => t.id === id);
    if (thread) {
      thread.deletedAt = Date.now();
      data.lastSync = Date.now();
      this.setData(data);
    }
  }

  /**
   * Permanently delete a thread
   */
  permanentlyDeleteThread(id: string): void {
    const data = this.getData();
    if (!data) return;

    data.threads = data.threads.filter((t) => t.id !== id);
    data.lastSync = Date.now();
    this.setData(data);
  }

  /**
   * Restore a soft-deleted thread
   */
  restoreThread(id: string): void {
    const data = this.getData();
    if (!data) return;

    const thread = data.threads.find((t) => t.id === id);
    if (thread && thread.deletedAt) {
      delete thread.deletedAt;
      thread.updatedAt = Date.now();
      data.lastSync = Date.now();
      this.setData(data);
    }
  }

  /**
   * Get current thread ID
   */
  getCurrentThreadId(): string | null {
    const data = this.getData();
    return data?.currentThreadId || null;
  }

  /**
   * Set current thread ID
   */
  setCurrentThreadId(id: string | null): void {
    const data = this.getData();
    if (!data) {
      this.initialize();
      return this.setCurrentThreadId(id);
    }

    data.currentThreadId = id;
    data.lastSync = Date.now();
    this.setData(data);
  }

  /**
   * Clear all data (use with caution!)
   */
  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Export all data as JSON
   */
  exportData(): string {
    const data = this.getData();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from JSON
   */
  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      // Validate schema
      if (!data.version || !Array.isArray(data.threads)) {
        throw new Error('Invalid data format');
      }
      this.setData(data);
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('Failed to import data: Invalid format');
    }
  }

  /**
   * Clean up old deleted threads (>30 days)
   */
  cleanupDeletedThreads(): number {
    const data = this.getData();
    if (!data) return 0;

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const beforeCount = data.threads.length;

    data.threads = data.threads.filter((t) => {
      if (t.deletedAt && t.deletedAt < thirtyDaysAgo) {
        return false; // Remove old deleted threads
      }
      return true;
    });

    const deleted = beforeCount - data.threads.length;
    if (deleted > 0) {
      data.lastSync = Date.now();
      this.setData(data);
    }

    return deleted;
  }
}

// Export singleton instance
export const storageService = new StorageService();

// Initialize on module load
storageService.initialize();
