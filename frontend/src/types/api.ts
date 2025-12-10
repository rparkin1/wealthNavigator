/**
 * Generic API Response Types
 * Shared across all API services
 */

export interface ApiResponse<T> {
  data: T | null;
  error: ErrorResponse | null;
}

export interface ErrorResponse {
  error: string;
  detail: string;
}

// Explicit type re-exports for Vite/TypeScript compatibility
export type {
  ApiResponse,
  ErrorResponse,
};
