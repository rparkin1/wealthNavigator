/**
 * Help Menu Component
 *
 * Provides quick access to in-app documentation, tutorials, and support
 */

import React, { useState } from 'react';

interface HelpMenuProps {
  onOpenDocumentation: (docPath: string) => void;
  onOpenTutorial: (tutorialId: string) => void;
}

export const HelpMenu: React.FC<HelpMenuProps> = ({
  onOpenDocumentation,
  onOpenTutorial,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const quickLinks = [
    {
      title: 'Quick Start Guide',
      description: 'Get up and running in 5 minutes',
      icon: '🚀',
      action: () => onOpenDocumentation('quick-start'),
    },
    {
      title: 'Goal Planning Tutorial',
      description: 'Learn how to create and manage goals',
      icon: '🎯',
      action: () => onOpenTutorial('goal-planning'),
    },
    {
      title: 'Monte Carlo Guide',
      description: 'Understanding success probabilities',
      icon: '🎲',
      action: () => onOpenTutorial('monte-carlo'),
    },
    {
      title: 'FAQ',
      description: 'Frequently asked questions',
      icon: '❓',
      action: () => onOpenDocumentation('faq'),
    },
  ];

  const supportOptions = [
    {
      title: 'Video Tutorials',
      icon: '🎥',
      action: () => window.open('https://youtube.com/wealthnavigator', '_blank'),
    },
    {
      title: 'Community Forum',
      icon: '💬',
      action: () => window.open('https://community.wealthnavigator.ai', '_blank'),
    },
    {
      title: 'Contact Support',
      icon: '📧',
      action: () => window.location.href = 'mailto:support@wealthnavigator.ai',
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
        aria-label="Help menu"
        aria-expanded={isOpen}
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Dropdown */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[80vh] overflow-auto">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Help & Resources</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Close help menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Quick Links
              </h4>
              <div className="space-y-2">
                {quickLinks.map((link, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      link.action();
                      setIsOpen(false);
                    }}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-start">
                      <div className="text-2xl mr-3 group-hover:scale-110 transition-transform">
                        {link.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {link.title}
                        </div>
                        <div className="text-sm text-gray-600 mt-0.5">
                          {link.description}
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors ml-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Support Options */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Get More Help
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {supportOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      option.action();
                      setIsOpen(false);
                    }}
                    className="p-3 bg-white rounded-lg hover:bg-blue-50 hover:shadow-md transition-all group text-center"
                  >
                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                      {option.icon}
                    </div>
                    <div className="text-xs font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                      {option.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Keyboard Shortcuts</span>
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                  ?
                </kbd>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HelpMenu;
