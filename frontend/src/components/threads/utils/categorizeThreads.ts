/**
 * Thread Categorization Utilities
 *
 * Functions for categorizing and organizing conversation threads by date
 */

interface Thread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  goalTypes: string[];
  messageCount?: number;
  preview?: string;
}

export type ThreadCategory = 'today' | 'yesterday' | 'past_7_days' | 'past_30_days' | 'older';

export interface CategorizedThreads {
  today: Thread[];
  yesterday: Thread[];
  past_7_days: Thread[];
  past_30_days: Thread[];
  older: Thread[];
}

export const categoryLabels: Record<ThreadCategory, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  past_7_days: 'Past 7 Days',
  past_30_days: 'Past 30 Days',
  older: 'Older',
};

/**
 * Categorize threads by their last update time
 */
export function categorizeThreads(threads: Thread[]): CategorizedThreads {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const sevenDaysMs = 7 * oneDayMs;
  const thirtyDaysMs = 30 * oneDayMs;

  const categories: CategorizedThreads = {
    today: [],
    yesterday: [],
    past_7_days: [],
    past_30_days: [],
    older: [],
  };

  threads.forEach((thread) => {
    const age = now - thread.updatedAt;

    if (age < oneDayMs) {
      categories.today.push(thread);
    } else if (age < 2 * oneDayMs) {
      categories.yesterday.push(thread);
    } else if (age < sevenDaysMs) {
      categories.past_7_days.push(thread);
    } else if (age < thirtyDaysMs) {
      categories.past_30_days.push(thread);
    } else {
      categories.older.push(thread);
    }
  });

  // Sort threads within each category by updatedAt (newest first)
  Object.keys(categories).forEach((key) => {
    categories[key as ThreadCategory].sort((a, b) => b.updatedAt - a.updatedAt);
  });

  return categories;
}

/**
 * Get all category keys with threads
 */
export function getCategoriesWithThreads(categorized: CategorizedThreads): ThreadCategory[] {
  return (Object.keys(categorized) as ThreadCategory[]).filter(
    (category) => categorized[category].length > 0
  );
}

/**
 * Get total thread count across all categories
 */
export function getTotalThreadCount(categorized: CategorizedThreads): number {
  return Object.values(categorized).reduce((sum, threads) => sum + threads.length, 0);
}

/**
 * Filter threads by search query
 */
export function filterThreads(threads: Thread[], query: string): Thread[] {
  if (!query.trim()) {
    return threads;
  }

  const lowerQuery = query.toLowerCase();

  return threads.filter((thread) => {
    const titleMatch = thread.title.toLowerCase().includes(lowerQuery);
    const previewMatch = thread.preview?.toLowerCase().includes(lowerQuery);
    const goalMatch = thread.goalTypes.some((type) =>
      type.toLowerCase().includes(lowerQuery)
    );

    return titleMatch || previewMatch || goalMatch;
  });
}
