/**
 * DeleteConfirmModal Component
 *
 * Confirmation modal for destructive actions like deleting threads
 * Following WealthNavigator UI redesign design system
 */

import React, { useEffect } from 'react';
import { Button } from '../ui/Button';

interface DeleteConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function DeleteConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Delete',
  cancelText = 'Cancel',
}: DeleteConfirmModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50
                 animate-fadeIn"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="modal-title"
          className="text-lg font-semibold text-gray-900 mb-2"
        >
          {title}
        </h3>

        <p
          id="modal-description"
          className="text-sm text-gray-600 mb-6"
        >
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <Button
            onClick={onCancel}
            variant="secondary"
            size="md"
          >
            {cancelText}
          </Button>

          <Button
            onClick={onConfirm}
            variant="danger"
            size="md"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
