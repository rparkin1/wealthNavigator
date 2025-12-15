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

// Note: All types are already exported inline above, no need for duplicate exports
