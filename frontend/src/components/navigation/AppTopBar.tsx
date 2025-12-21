/**
 * AppTopBar - Configured TopBar for WealthNavigator
 *
 * This component wraps the generic TopBar layout component with
 * WealthNavigator-specific configuration.
 */
import React from 'react';
import { TopBar } from '../layout/TopBar';
import Button from '../ui/Button';
import {
  PlusIcon,
  ChatBubbleLeftIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface AppTopBarProps {
  onNewGoal?: () => void;
  onNewThread?: () => void;
  onOpenSettings?: () => void;
  onMenuClick?: () => void;
}

export const AppTopBar: React.FC<AppTopBarProps> = ({
  onNewGoal,
  onNewThread,
  onOpenSettings,
  onMenuClick,
}) => {
  return (
    <TopBar
      logo={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">WN</span>
          </div>
          <span className="text-lg font-semibold text-gray-900 hidden sm:inline">
            WealthNavigator
          </span>
        </div>
      }
      onMenuClick={onMenuClick}
      actions={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={onNewGoal}
            className="hidden md:flex"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Goal</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onNewThread}
            className="hidden md:flex"
          >
            <ChatBubbleLeftIcon className="w-4 h-4" />
            <span>New Chat</span>
          </Button>
        </>
      }
      search={
        <div className="relative w-full">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search goals, threads, portfolio..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      }
      userMenu={
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Settings"
          >
            <Cog6ToothIcon className="w-6 h-6" />
          </button>
          <button
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="User profile"
          >
            <UserCircleIcon className="w-6 h-6" />
          </button>
        </div>
      }
    />
  );
};
