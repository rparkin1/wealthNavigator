/**
 * User Hook
 * Provides user information from localStorage
 */

import { useState, useEffect } from 'react';

export interface UserProfile {
  userId: string;
  age?: number;
  birthYear?: number;
  gender?: 'male' | 'female';
  retirementAge?: number;
}

/**
 * Hook to get current user information
 * Uses localStorage as temporary storage until proper auth is implemented
 */
export function useUser(): UserProfile {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    // Get user_id from localStorage (matches API client pattern)
    // NOTE: Changed default from 'demo-user' to 'test-user-123' to match Plaid data
    const userId = localStorage.getItem('user_id') || 'test-user-123';

    // Try to get additional profile data
    const storedProfile = localStorage.getItem('user_profile');
    if (storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);
        return { userId, ...profile };
      } catch (e) {
        console.warn('Failed to parse user profile from localStorage', e);
      }
    }

    // Default profile
    return {
      userId,
      age: 65,
      birthYear: new Date().getFullYear() - 65,
      retirementAge: 65,
    };
  });

  // Listen for storage changes (multi-tab support)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_id' || e.key === 'user_profile') {
        const userId = localStorage.getItem('user_id') || 'test-user-123';
        const storedProfile = localStorage.getItem('user_profile');

        if (storedProfile) {
          try {
            const profile = JSON.parse(storedProfile);
            setUserProfile({ userId, ...profile });
          } catch (e) {
            setUserProfile({ userId });
          }
        } else {
          setUserProfile({ userId });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return userProfile;
}

/**
 * Helper function to update user profile
 */
export function updateUserProfile(profile: Partial<UserProfile>): void {
  const current = localStorage.getItem('user_profile');
  let currentProfile: Partial<UserProfile> = {};

  if (current) {
    try {
      currentProfile = JSON.parse(current);
    } catch (e) {
      console.warn('Failed to parse existing profile', e);
    }
  }

  const updated = { ...currentProfile, ...profile };
  localStorage.setItem('user_profile', JSON.stringify(updated));

  // Trigger storage event for useUser hook
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: 'user_profile',
      newValue: JSON.stringify(updated),
    })
  );
}
