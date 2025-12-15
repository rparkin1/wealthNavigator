/**
 * Thread (Conversation) Types
 * Thread-based conversation management for financial planning sessions
 */

export interface Thread {
  id: string; // UUID
  title: string;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  deletedAt?: number; // timestamp for soft delete
  goalTypes: GoalCategory[];
  messages: Message[];
  analysisCount: number;
}

export interface Message {
  id: string;
  threadId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  agentId?: string;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  agentName?: string;
  status?: 'thinking' | 'working' | 'complete';
  progress?: number;
}

export type GoalCategory =
  | 'retirement'
  | 'education'
  | 'home'
  | 'major_expense'
  | 'emergency'
  | 'legacy';

export interface ThreadListItem {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  goalTypes: GoalCategory[];
  lastMessage?: string;
}

export type ThreadCategory = 'today' | 'yesterday' | 'past7days' | 'past30days' | 'older';

export interface ThreadFilters {
  category?: ThreadCategory;
  goalType?: GoalCategory;
  search?: string;
}

// Explicit type re-exports for Vite/TypeScript compatibility
export type {
  GoalCategory,
  Message,
  MessageMetadata,
  Thread,
  ThreadCategory,
  ThreadFilters,
  ThreadListItem,
};
