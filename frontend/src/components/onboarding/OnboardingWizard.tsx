/**
 * Onboarding Wizard Component
 *
 * Interactive multi-step onboarding flow that guides new users through initial setup
 * Target: Complete in <15 minutes
 *
 * Steps:
 * 1. Welcome & Quick Start (1 min)
 * 2. Profile Setup (3 min)
 * 3. First Goal Creation (5 min)
 * 4. Budget Basics (3 min)
 * 5. Dashboard Tour (3 min)
 */

import React, { useState, useEffect } from 'react';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  estimatedTime: number; // minutes
  completed: boolean;
}

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
  userId: string;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onComplete,
  onSkip,
  userId,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [startTime] = useState(Date.now());
  const [formData, setFormData] = useState<any>({
    profile: {},
    firstGoal: {},
    budget: {},
  });

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to WealthNavigator AI',
      description: 'Let\'s get you set up in just 10-15 minutes',
      estimatedTime: 1,
      completed: false,
    },
    {
      id: 'profile',
      title: 'Set Up Your Profile',
      description: 'Tell us a bit about yourself',
      estimatedTime: 3,
      completed: false,
    },
    {
      id: 'first-goal',
      title: 'Create Your First Goal',
      description: 'Start planning for your financial future',
      estimatedTime: 5,
      completed: false,
    },
    {
      id: 'budget',
      title: 'Budget Basics',
      description: 'Quick budget setup (optional)',
      estimatedTime: 3,
      completed: false,
    },
    {
      id: 'tour',
      title: 'Quick Dashboard Tour',
      description: 'Learn where everything is',
      estimatedTime: 3,
      completed: false,
    },
  ];

  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Onboarding complete
      const elapsedTime = (Date.now() - startTime) / 1000 / 60; // minutes
      console.log(`Onboarding completed in ${elapsedTime.toFixed(1)} minutes`);
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipStep = () => {
    handleNext();
  };

  const updateFormData = (section: string, data: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }));
  };

  const renderStep = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'welcome':
        return <WelcomeStep onNext={handleNext} />;

      case 'profile':
        return (
          <ProfileStep
            data={formData.profile}
            onChange={(data) => updateFormData('profile', data)}
            onNext={handleNext}
            onSkip={handleSkipStep}
          />
        );

      case 'first-goal':
        return (
          <FirstGoalStep
            userId={userId}
            data={formData.firstGoal}
            onChange={(data) => updateFormData('firstGoal', data)}
            onNext={handleNext}
            onSkip={handleSkipStep}
          />
        );

      case 'budget':
        return (
          <BudgetStep
            data={formData.budget}
            onChange={(data) => updateFormData('budget', data)}
            onNext={handleNext}
            onSkip={handleSkipStep}
          />
        );

      case 'tour':
        return <TourStep onNext={handleNext} />;

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with Progress */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-2xl font-bold">{steps[currentStep].title}</h2>
              <p className="text-blue-100 text-sm mt-1">
                {steps[currentStep].description}
              </p>
            </div>
            <button
              onClick={onSkip}
              className="text-blue-100 hover:text-white text-sm font-medium transition-colors"
              aria-label="Skip onboarding"
            >
              Skip All
            </button>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="h-2 bg-blue-500 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-blue-100">
              <span>Step {currentStep + 1} of {totalSteps}</span>
              <span>{steps[currentStep].estimatedTime} min</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderStep()}
        </div>

        {/* Footer Navigation */}
        {currentStep > 0 && (
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
            <button
              onClick={handleBack}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              ← Back
            </button>
            <div className="text-sm text-gray-500">
              {Math.round(progress)}% complete
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* Step 1: Welcome */
const WelcomeStep: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  return (
    <div className="text-center py-8">
      <div className="text-6xl mb-6">👋</div>
      <h3 className="text-3xl font-bold text-gray-900 mb-4">
        Welcome to WealthNavigator AI
      </h3>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Your intelligent financial planning assistant. Let's get you set up in just 10-15 minutes.
      </p>

      <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="text-3xl mb-3">🎯</div>
          <h4 className="font-semibold text-gray-900 mb-2">Set Goals</h4>
          <p className="text-sm text-gray-600">
            Plan for retirement, education, or any financial milestone
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <div className="text-3xl mb-3">📊</div>
          <h4 className="font-semibold text-gray-900 mb-2">Track Progress</h4>
          <p className="text-sm text-gray-600">
            Monitor your goals with real-time success probabilities
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-6">
          <div className="text-3xl mb-3">🤖</div>
          <h4 className="font-semibold text-gray-900 mb-2">AI Guidance</h4>
          <p className="text-sm text-gray-600">
            Get personalized advice powered by advanced AI
          </p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
      >
        Let's Get Started →
      </button>
    </div>
  );
};

/* Step 2: Profile Setup */
interface ProfileStepProps {
  data: any;
  onChange: (data: any) => void;
  onNext: () => void;
  onSkip: () => void;
}

const ProfileStep: React.FC<ProfileStepProps> = ({ data, onChange, onNext, onSkip }) => {
  const [formData, setFormData] = useState({
    name: data.name || '',
    age: data.age || '',
    riskTolerance: data.riskTolerance || 'moderate',
    ...data,
  });

  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const newErrors: any = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.age || formData.age < 18 || formData.age > 100) {
      newErrors.age = 'Please enter a valid age (18-100)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onChange(formData);
      onNext();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What's your name?
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your name"
          autoFocus
        />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What's your age?
        </label>
        <input
          type="number"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.age ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your age"
          min="18"
          max="100"
        />
        {errors.age && <p className="text-red-600 text-sm mt-1">{errors.age}</p>}
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          What's your risk tolerance?
        </label>
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: 'conservative', label: 'Conservative', description: 'Prefer safety over returns' },
            { value: 'moderate', label: 'Moderate', description: 'Balanced approach' },
            { value: 'aggressive', label: 'Aggressive', description: 'Higher returns, more risk' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFormData({ ...formData, riskTolerance: option.value })}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                formData.riskTolerance === option.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-900 mb-1">{option.label}</div>
              <div className="text-xs text-gray-600">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Continue →
        </button>
        <button
          onClick={onSkip}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
};

/* Step 3: First Goal Creation */
interface FirstGoalStepProps {
  userId: string;
  data: any;
  onChange: (data: any) => void;
  onNext: () => void;
  onSkip: () => void;
}

const FirstGoalStep: React.FC<FirstGoalStepProps> = ({ data, onChange, onNext, onSkip }) => {
  const [goalType, setGoalType] = useState<string>(data.goalType || '');
  const [goalDetails, setGoalDetails] = useState({
    name: data.name || '',
    targetAmount: data.targetAmount || '',
    targetDate: data.targetDate || '',
    monthlyContribution: data.monthlyContribution || '',
    ...data,
  });

  const goalTypes = [
    { value: 'retirement', label: 'Retirement', icon: '🏖️', description: 'Plan for retirement' },
    { value: 'education', label: 'Education', icon: '🎓', description: 'College savings' },
    { value: 'home', label: 'Home Purchase', icon: '🏠', description: 'Down payment' },
    { value: 'emergency', label: 'Emergency Fund', icon: '💰', description: '3-6 months expenses' },
  ];

  const handleSubmit = () => {
    const completeData = { goalType, ...goalDetails };
    onChange(completeData);
    onNext();
  };

  return (
    <div className="max-w-3xl mx-auto">
      {!goalType ? (
        <>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              What's your first financial goal?
            </h3>
            <p className="text-gray-600">
              Choose a goal to start planning. You can add more goals later.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {goalTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setGoalType(type.value)}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="text-4xl mb-3">{type.icon}</div>
                <div className="font-semibold text-lg text-gray-900 mb-1">{type.label}</div>
                <div className="text-sm text-gray-600">{type.description}</div>
              </button>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={onSkip}
              className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Skip for now
            </button>
          </div>
        </>
      ) : (
        <>
          <button
            onClick={() => setGoalType('')}
            className="mb-6 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            ← Choose a different goal
          </button>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Goal Name
              </label>
              <input
                type="text"
                value={goalDetails.name}
                onChange={(e) => setGoalDetails({ ...goalDetails, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`My ${goalTypes.find(t => t.value === goalType)?.label}`}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Amount
                </label>
                <input
                  type="number"
                  value={goalDetails.targetAmount}
                  onChange={(e) => setGoalDetails({ ...goalDetails, targetAmount: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="$100,000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Date
                </label>
                <input
                  type="date"
                  value={goalDetails.targetDate}
                  onChange={(e) => setGoalDetails({ ...goalDetails, targetDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Contribution (optional)
              </label>
              <input
                type="number"
                value={goalDetails.monthlyContribution}
                onChange={(e) => setGoalDetails({ ...goalDetails, monthlyContribution: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="$500"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Continue →
            </button>
            <button
              onClick={onSkip}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Skip
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/* Step 4: Budget Basics */
interface BudgetStepProps {
  data: any;
  onChange: (data: any) => void;
  onNext: () => void;
  onSkip: () => void;
}

const BudgetStep: React.FC<BudgetStepProps> = ({ data, onChange, onNext, onSkip }) => {
  const [formData, setFormData] = useState({
    monthlyIncome: data.monthlyIncome || '',
    monthlyExpenses: data.monthlyExpenses || '',
    ...data,
  });

  const handleSubmit = () => {
    onChange(formData);
    onNext();
  };

  const monthlySavings = formData.monthlyIncome && formData.monthlyExpenses
    ? formData.monthlyIncome - formData.monthlyExpenses
    : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Quick Budget Overview
        </h3>
        <p className="text-gray-600">
          Help us understand your cash flow (you can skip this and add details later)
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Income (after taxes)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={formData.monthlyIncome}
              onChange={(e) => setFormData({ ...formData, monthlyIncome: parseFloat(e.target.value) })}
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="5,000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Expenses (estimate)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={formData.monthlyExpenses}
              onChange={(e) => setFormData({ ...formData, monthlyExpenses: parseFloat(e.target.value) })}
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="3,500"
            />
          </div>
        </div>

        {monthlySavings !== 0 && (
          <div className={`p-4 rounded-lg ${monthlySavings > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="text-sm font-medium mb-1">
              {monthlySavings > 0 ? 'Monthly Savings:' : 'Monthly Shortfall:'}
            </div>
            <div className={`text-2xl font-bold ${monthlySavings > 0 ? 'text-green-700' : 'text-red-700'}`}>
              ${Math.abs(monthlySavings).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={handleSubmit}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Continue →
        </button>
        <button
          onClick={onSkip}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
};

/* Step 5: Dashboard Tour */
const TourStep: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  return (
    <div className="text-center py-8">
      <div className="text-6xl mb-6">🎉</div>
      <h3 className="text-3xl font-bold text-gray-900 mb-4">
        You're All Set!
      </h3>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Here's a quick tour of your dashboard features
      </p>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-8">
        <div className="bg-gray-50 rounded-lg p-6 text-left">
          <div className="text-3xl mb-3">🎯</div>
          <h4 className="font-semibold text-gray-900 mb-2">Goals Dashboard</h4>
          <p className="text-sm text-gray-600 mb-2">
            Track all your financial goals in one place. Monitor progress, success probabilities, and get AI recommendations.
          </p>
          <p className="text-xs text-blue-600">Find it in: Goals menu</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 text-left">
          <div className="text-3xl mb-3">💬</div>
          <h4 className="font-semibold text-gray-900 mb-2">AI Chat</h4>
          <p className="text-sm text-gray-600 mb-2">
            Ask questions about your finances, create goals, and get personalized advice from our AI assistant.
          </p>
          <p className="text-xs text-blue-600">Find it in: Chat menu</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 text-left">
          <div className="text-3xl mb-3">📊</div>
          <h4 className="font-semibold text-gray-900 mb-2">Portfolio Analysis</h4>
          <p className="text-sm text-gray-600 mb-2">
            View comprehensive portfolio insights, performance metrics, and optimization recommendations.
          </p>
          <p className="text-xs text-blue-600">Find it in: Portfolio menu</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 text-left">
          <div className="text-3xl mb-3">❓</div>
          <h4 className="font-semibold text-gray-900 mb-2">Help & Tutorials</h4>
          <p className="text-sm text-gray-600 mb-2">
            Access tutorials, FAQ, and guides anytime from the help menu in the header.
          </p>
          <p className="text-xs text-blue-600">Find it in: ? icon (top right)</p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
      >
        Go to Dashboard →
      </button>
    </div>
  );
};

export default OnboardingWizard;
