import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageInput } from './MessageInput';

describe('MessageInput', () => {
  it('renders input field and send button', () => {
    render(
      <MessageInput
        value=""
        onChange={() => {}}
        onSend={() => {}}
        disabled={false}
        placeholder="Type a message"
      />
    );

    expect(screen.getByPlaceholderText('Type a message')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const handleChange = vi.fn();
    render(
      <MessageInput
        value=""
        onChange={handleChange}
        onSend={() => {}}
        disabled={false}
        placeholder="Type a message"
      />
    );

    const input = screen.getByPlaceholderText('Type a message');
    fireEvent.change(input, { target: { value: 'Hello' } });

    expect(handleChange).toHaveBeenCalledWith('Hello');
  });

  it('calls onSend when clicking send button', () => {
    const handleSend = vi.fn();
    render(
      <MessageInput
        value="Test message"
        onChange={() => {}}
        onSend={handleSend}
        disabled={false}
        placeholder="Type a message"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleSend).toHaveBeenCalledWith('Test message');
  });

  it('calls onSend when pressing Enter', () => {
    const handleSend = vi.fn();
    render(
      <MessageInput
        value="Test message"
        onChange={() => {}}
        onSend={handleSend}
        disabled={false}
        placeholder="Type a message"
      />
    );

    const input = screen.getByPlaceholderText('Type a message');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(handleSend).toHaveBeenCalledWith('Test message');
  });

  it('does not send empty messages', () => {
    const handleSend = vi.fn();
    render(
      <MessageInput
        value=""
        onChange={() => {}}
        onSend={handleSend}
        disabled={false}
        placeholder="Type a message"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleSend).not.toHaveBeenCalled();
  });

  it('disables input and button when disabled prop is true', () => {
    render(
      <MessageInput
        value=""
        onChange={() => {}}
        onSend={() => {}}
        disabled={true}
        placeholder="Type a message"
      />
    );

    const input = screen.getByPlaceholderText('Type a message');
    const button = screen.getByRole('button');

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it('allows Shift+Enter for multiline without sending', () => {
    const handleSend = vi.fn();
    render(
      <MessageInput
        value="Test message"
        onChange={() => {}}
        onSend={handleSend}
        disabled={false}
        placeholder="Type a message"
      />
    );

    const input = screen.getByPlaceholderText('Type a message');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true });

    expect(handleSend).not.toHaveBeenCalled();
  });
});
