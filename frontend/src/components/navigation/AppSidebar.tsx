/**
 * AppSidebar - Main navigation sidebar
 * Shows main navigation items for different views
 *
 * NOTE: This is for VIEW navigation, not thread management.
 * Thread sidebar will be added in a future iteration.
 */
import React from 'react';
import { Sidebar, SidebarSection, SidebarItem } from '../layout/Sidebar';
import {
  HomeIcon,
  FlagIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  ReceiptPercentIcon,
  BuildingLibraryIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface AppSidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentView,
  onNavigate,
}) => {
  return (
    <Sidebar>
      {/* Main Section */}
      <SidebarSection title="Main">
        <SidebarItem
          icon={<HomeIcon className="w-5 h-5" />}
          label="Dashboard"
          active={currentView === 'home'}
          onClick={() => onNavigate('home')}
        />
        <SidebarItem
          icon={<FlagIcon className="w-5 h-5" />}
          label="Goals"
          active={currentView === 'goals'}
          onClick={() => onNavigate('goals')}
        />
        <SidebarItem
          icon={<ChartBarIcon className="w-5 h-5" />}
          label="Portfolio"
          active={currentView === 'portfolio'}
          onClick={() => onNavigate('portfolio')}
        />
      </SidebarSection>

      {/* Planning Section */}
      <SidebarSection title="Planning">
        <SidebarItem
          icon={<BanknotesIcon className="w-5 h-5" />}
          label="Budget"
          active={currentView === 'budget'}
          onClick={() => onNavigate('budget')}
        />
        <SidebarItem
          icon={<ArrowPathIcon className="w-5 h-5" />}
          label="Recurring"
          active={currentView === 'recurring'}
          onClick={() => onNavigate('recurring')}
        />
        <SidebarItem
          icon={<CalendarDaysIcon className="w-5 h-5" />}
          label="Retirement"
          active={currentView === 'retirement'}
          onClick={() => onNavigate('retirement')}
        />
        <SidebarItem
          icon={<AcademicCapIcon className="w-5 h-5" />}
          label="Education"
          active={currentView === 'education'}
          onClick={() => onNavigate('education')}
        />
      </SidebarSection>

      {/* Risk & Portfolio Section */}
      <SidebarSection title="Risk & Portfolio">
        <SidebarItem
          icon={<ShieldCheckIcon className="w-5 h-5" />}
          label="Risk Analysis"
          active={currentView === 'risk'}
          onClick={() => onNavigate('risk')}
        />
        <SidebarItem
          icon={<ChartPieIcon className="w-5 h-5" />}
          label="Diversification"
          active={currentView === 'diversification'}
          onClick={() => onNavigate('diversification')}
        />
        <SidebarItem
          icon={<ReceiptPercentIcon className="w-5 h-5" />}
          label="Tax Planning"
          active={currentView === 'tax'}
          onClick={() => onNavigate('tax')}
        />
        <SidebarItem
          icon={<BuildingLibraryIcon className="w-5 h-5" />}
          label="Estate Planning"
          active={currentView === 'estate-planning'}
          onClick={() => onNavigate('estate-planning')}
        />
      </SidebarSection>

      {/* Analysis Section */}
      <SidebarSection title="Analysis">
        <SidebarItem
          icon={<ExclamationTriangleIcon className="w-5 h-5" />}
          label="Sensitivity"
          active={currentView === 'sensitivity'}
          onClick={() => onNavigate('sensitivity')}
        />
        <SidebarItem
          icon={<SparklesIcon className="w-5 h-5" />}
          label="What-If"
          active={currentView === 'what-if'}
          onClick={() => onNavigate('what-if')}
        />
        <SidebarItem
          icon={<CalendarDaysIcon className="w-5 h-5" />}
          label="Life Events"
          active={currentView === 'life-events'}
          onClick={() => onNavigate('life-events')}
        />
      </SidebarSection>

      {/* Settings Section */}
      <SidebarSection>
        <SidebarItem
          icon={<Cog6ToothIcon className="w-5 h-5" />}
          label="Settings"
          active={currentView === 'settings'}
          onClick={() => onNavigate('settings')}
        />
      </SidebarSection>
    </Sidebar>
  );
};
