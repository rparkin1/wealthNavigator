/**
 * useOnboarding Hook
 *
 * Manages onboarding state and flow
 */

import { useState, useEffect } from 'react';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  currentStep: number;
  completedSteps: string[];
  skippedSteps: string[];
  startTime: number | null;
  completionTime: number | null;
}

const STORAGE_KEY = 'wealthnav_onboarding_state';

export const useOnboarding = () => {
  const [state, setState] = useState<OnboardingState>(() => {
    // Load from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Failed to parse onboarding state:', error);
      }
    }

    // Default state
    return {
      hasCompletedOnboarding: false,
      currentStep: 0,
      completedSteps: [],
      skippedSteps: [],
      startTime: null,
      completionTime: null,
    };
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const startOnboarding = () => {
    setState({
      ...state,
      startTime: Date.now(),
      hasCompletedOnboarding: false,
    });
  };

  const completeOnboarding = () => {
    const completionTime = Date.now();
    const elapsedMinutes = state.startTime
      ? (completionTime - state.startTime) / 1000 / 60
      : 0;

    console.log(`Onboarding completed in ${elapsedMinutes.toFixed(1)} minutes`);

    setState({
      ...state,
      hasCompletedOnboarding: true,
      completionTime,
    });
  };

  const skipOnboarding = () => {
    setState({
      ...state,
      hasCompletedOnboarding: true,
      completionTime: Date.now(),
    });
  };

  const resetOnboarding = () => {
    setState({
      hasCompletedOnboarding: false,
      currentStep: 0,
      completedSteps: [],
      skippedSteps: [],
      startTime: null,
      completionTime: null,
    });
  };

  const shouldShowOnboarding = () => {
    return !state.hasCompletedOnboarding;
  };

  const getElapsedTime = () => {
    if (!state.startTime) return 0;
    const endTime = state.completionTime || Date.now();
    return (endTime - state.startTime) / 1000 / 60; // minutes
  };

  return {
    state,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    shouldShowOnboarding,
    getElapsedTime,
  };
};

export default useOnboarding;
