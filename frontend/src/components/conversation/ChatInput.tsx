/**
 * ChatInput Component (Week 6 - UI Redesign)
 *
 * Redesigned chat input with improved UX.
 * Features:
 * - Auto-growing textarea
 * - Keyboard shortcuts (⌘/Ctrl + Enter)
 * - Character count
 * - Send button with loading state
 */

import { useState, useRef, type KeyboardEvent, type ChangeEvent } from 'react';

export interface ChatInputProps {
  /**
   * Callback when user sends a message
   */
  onSendMessage?: (message: string) => void;

  /**
   * Whether the input is disabled
   */
  disabled?: boolean;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Maximum character count
   */
  maxLength?: number;

  /**
   * Custom class name
   */
  className?: string;
}

/**
 * ChatInput - Professional chat input component
 *
 * @example
 * ```tsx
 * <ChatInput
 *   onSendMessage={handleSend}
 *   disabled={isStreaming}
 *   placeholder="Type your message..."
 *   maxLength={2000}
 * />
 * ```
 */
export function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = 'Type your message...',
  maxLength = 2000,
  className = '',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && onSendMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const remainingChars = maxLength - message.length;
  const isNearLimit = remainingChars < 100;
  const canSend = message.trim().length > 0 && !disabled && remainingChars >= 0;

  return (
    <div className={`${className}`}>
      <div className="relative">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={1}
          className={`
            w-full px-4 py-3 pr-12
            border border-gray-300 rounded-lg
            resize-none
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
            transition-all
            ${message.length > 0 ? 'min-h-[44px]' : 'h-[44px]'}
          `}
          aria-label="Message input"
        />

        {/* Send Button */}
        <div className="absolute right-2 bottom-2">
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`
              w-8 h-8 rounded-md flex items-center justify-center
              transition-all
              ${
                canSend
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
            aria-label="Send message"
            title="Send message (⌘+Enter)"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Character Count (only show when near limit) */}
      {isNearLimit && (
        <div className="mt-1 text-xs text-right">
          <span
            className={`
            ${remainingChars < 50 ? 'text-red-600 font-medium' : 'text-gray-500'}
          `}
          >
            {remainingChars} characters remaining
          </span>
        </div>
      )}
    </div>
  );
}

export default ChatInput;
