/**
 * Conversation Components
 *
 * Export all conversation-related components.
 */

// Redesigned components (Week 6 - UI Redesign)
export { ChatPanel } from './ChatPanel';
export { MessageBubble } from './MessageBubble';
export { AgentIndicator } from './AgentIndicator';
export { TypingIndicator } from './TypingIndicator';
export { ChatInput } from './ChatInput';
export { ChatModal } from './ChatModal';

// Types - Redesigned
export type { ChatPanelProps, Message, Agent } from './ChatPanel';
export type { MessageBubbleProps } from './MessageBubble';
export type { AgentIndicatorProps } from './AgentIndicator';
export type { TypingIndicatorProps } from './TypingIndicator';
export type { ChatInputProps } from './ChatInput';
export type { ChatModalProps } from './ChatModal';

// Legacy components (still in use)
export { ChatInterface } from './ChatInterface';
export { MessageList } from './MessageList';
export { MessageInput } from './MessageInput';
export { AgentProgress } from './AgentProgress';
export { VisualizationPanel } from './VisualizationPanel';
export { ThreadSidebar } from './ThreadSidebar';
