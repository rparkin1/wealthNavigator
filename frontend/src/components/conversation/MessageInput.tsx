/**
 * MessageInput Component
 *
 * Text input for sending chat messages with keyboard shortcuts.
 */

import { type KeyboardEvent, useRef, useEffect } from 'react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ value, onChange, onSend, disabled, placeholder }: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend(value);
      }
    }
  };

  const handleSendClick = () => {
    if (value.trim() && !disabled) {
      onSend(value);
    }
  };

  return (
    <div className="flex items-end space-x-4">
      <div className="flex-1">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder || 'Type your message...'}
          rows={1}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          style={{ maxHeight: '200px' }}
        />
        <p className="text-xs text-gray-500 mt-1 px-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
      <button
        onClick={handleSendClick}
        disabled={!value.trim() || disabled}
        className="flex-shrink-0 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>
  );
}
