/**
 * Thread Management Components
 *
 * Barrel exports for thread/conversation management components
 * Part of WealthNavigator UI Redesign - Phase 2 Week 7
 */

export { ThreadSidebarRedesign } from './ThreadSidebarRedesign';
export { ThreadSearchInput } from './ThreadSearchInput';
export { ThreadListItem } from './ThreadListItem';
export { ThreadCategorySection } from './ThreadCategorySection';
export { MobileThreadDrawer } from './MobileThreadDrawer';
export { DeleteConfirmModal } from './DeleteConfirmModal';

// Utilities
export {
  categorizeThreads,
  filterThreads,
  getCategoriesWithThreads,
  getTotalThreadCount,
  categoryLabels,
  type ThreadCategory,
  type CategorizedThreads,
} from './utils/categorizeThreads';
