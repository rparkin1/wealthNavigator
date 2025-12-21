/**
 * MobileMoreMenu - Full-screen modal for additional navigation items
 * Displays in a grid layout with icons and labels
 */
import React from 'react';
import {
  CalendarDaysIcon,
  BanknotesIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  ReceiptPercentIcon,
  BuildingLibraryIcon,
  ScaleIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';

interface MobileMoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

export const MobileMoreMenu: React.FC<MobileMoreMenuProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const handleNavigate = (view: string) => {
    onNavigate(view);
    onClose();
  };

  const menuItems = [
    { id: 'budget', label: 'Budget', icon: BanknotesIcon, color: 'text-green-600' },
    { id: 'recurring', label: 'Recurring', icon: ArrowPathIcon, color: 'text-blue-600' },
    { id: 'retirement', label: 'Retirement', icon: CalendarDaysIcon, color: 'text-purple-600' },
    { id: 'education', label: 'Education', icon: AcademicCapIcon, color: 'text-indigo-600' },
    { id: 'risk', label: 'Risk Analysis', icon: ExclamationTriangleIcon, color: 'text-red-600' },
    { id: 'diversification', label: 'Diversification', icon: ChartPieIcon, color: 'text-teal-600' },
    { id: 'tax', label: 'Tax Planning', icon: ReceiptPercentIcon, color: 'text-orange-600' },
    { id: 'estate-planning', label: 'Estate Planning', icon: BuildingLibraryIcon, color: 'text-gray-600' },
    { id: 'sensitivity', label: 'Sensitivity', icon: ShieldCheckIcon, color: 'text-yellow-600' },
    { id: 'what-if', label: 'What-If', icon: SparklesIcon, color: 'text-pink-600' },
    { id: 'life-events', label: 'Life Events', icon: CalendarDaysIcon, color: 'text-cyan-600' },
    { id: 'insurance', label: 'Insurance', icon: HeartIcon, color: 'text-rose-600' },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon, color: 'text-gray-600' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">More Options</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Grid of menu items */}
      <div className="grid grid-cols-2 gap-4 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className="flex flex-col items-center gap-2 p-6 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <Icon className={`w-8 h-8 ${item.color}`} />
              <span className="text-sm font-medium text-gray-900 text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
