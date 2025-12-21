/**
 * AppMobileNav - Bottom navigation for mobile devices
 * Displays 5 primary navigation items with icons and labels
 */
import React from 'react';
import { MobileNav, MobileNavItem } from '../layout/MobileNav';
import {
  HomeIcon,
  FlagIcon,
  ChatBubbleLeftIcon,
  ChartBarIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';

interface AppMobileNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onMoreClick: () => void;
}

export const AppMobileNav: React.FC<AppMobileNavProps> = ({
  currentView,
  onNavigate,
  onMoreClick,
}) => {
  return (
    <MobileNav>
      <MobileNavItem
        icon={<HomeIcon className="w-6 h-6" />}
        label="Dashboard"
        active={currentView === 'home'}
        onClick={() => onNavigate('home')}
      />
      <MobileNavItem
        icon={<FlagIcon className="w-6 h-6" />}
        label="Goals"
        active={currentView === 'goals'}
        onClick={() => onNavigate('goals')}
      />
      <MobileNavItem
        icon={<ChatBubbleLeftIcon className="w-6 h-6" />}
        label="Chat"
        active={currentView === 'chat'}
        onClick={() => onNavigate('chat')}
      />
      <MobileNavItem
        icon={<ChartBarIcon className="w-6 h-6" />}
        label="Portfolio"
        active={currentView === 'portfolio'}
        onClick={() => onNavigate('portfolio')}
      />
      <MobileNavItem
        icon={<EllipsisHorizontalIcon className="w-6 h-6" />}
        label="More"
        onClick={onMoreClick}
      />
    </MobileNav>
  );
};
