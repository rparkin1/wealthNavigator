# New UI Integration Guide

## Quick Start: Using the Goal Creation Wizard

### Option 1: Replace GoalForm in GoalsManager (Recommended)

Replace the old `GoalForm` with the new `GoalCreationWizard`:

**File:** `frontend/src/components/goals/GoalsManager.tsx`

```typescript
// OLD import (line 9)
import { GoalForm } from './GoalForm';

// NEW import - ADD THIS
import { GoalCreationWizard } from './wizard';

// Then find the GoalForm usage around line 250-260 and replace:

{/* OLD CODE - REMOVE THIS */}
{showForm && (
  <GoalForm
    goal={editingGoal}
    onSubmit={handleSaveGoal}
    onCancel={() => {
      setShowForm(false);
      setEditingGoal(null);
    }}
    mode={editingGoal ? 'edit' : 'create'}
  />
)}

{/* NEW CODE - USE THIS */}
{showForm && (
  <GoalCreationWizard
    onComplete={async (goalData) => {
      // Convert wizard data to Goal format
      const newGoal = {
        id: crypto.randomUUID(),
        title: goalData.name,
        category: goalData.category!,
        priority: goalData.priority,
        targetAmount: goalData.targetAmount,
        currentAmount: goalData.currentSavings,
        targetDate: goalData.targetDate,
        monthlyContribution: goalData.monthlyContribution,
        description: goalData.description,
        status: 'on_track' as const,
      };

      await handleSaveGoal(newGoal);
      setShowForm(false);
    }}
    onCancel={() => {
      setShowForm(false);
      setEditingGoal(null);
    }}
  />
)}
```

### Option 2: Standalone Usage (New Page)

Create a dedicated goal creation page:

**File:** `frontend/src/pages/CreateGoal.tsx` (NEW FILE)

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoalCreationWizard } from '../components/goals/wizard';
import type { WizardFormData } from '../components/goals/wizard/types';

export function CreateGoalPage() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const handleComplete = async (goalData: WizardFormData) => {
    setIsCreating(true);

    try {
      // Submit to your API
      const response = await fetch('/api/v1/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: goalData.name,
          category: goalData.category,
          target_amount: goalData.targetAmount,
          target_date: goalData.targetDate,
          current_savings: goalData.currentSavings,
          priority: goalData.priority,
          monthly_contribution: goalData.monthlyContribution,
          expected_return: goalData.expectedReturn,
          description: goalData.description,
        }),
      });

      if (!response.ok) throw new Error('Failed to create goal');

      const { goal_id } = await response.json();

      // Optionally trigger Monte Carlo
      if (goalData.runMonteCarloOnCreation) {
        await fetch('/api/v1/simulations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goal_id,
            iterations: 5000,
          }),
        });
      }

      // Navigate back to goals list
      navigate('/goals');
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Failed to create goal. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    navigate('/goals');
  };

  return (
    <div>
      <GoalCreationWizard
        onComplete={handleComplete}
        onCancel={handleCancel}
      />

      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <p>Creating goal...</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Option 3: Button to Open Wizard (Modal)

Add a button anywhere in your app:

```typescript
import { useState } from 'react';
import { GoalCreationWizard } from './components/goals/wizard';

function MyComponent() {
  const [showWizard, setShowWizard] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowWizard(true)}
        className="px-6 py-2 bg-primary-600 text-white rounded-md"
      >
        + New Goal
      </button>

      {showWizard && (
        <GoalCreationWizard
          onComplete={(goalData) => {
            console.log('Goal created:', goalData);
            // Handle goal creation
            setShowWizard(false);
          }}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </>
  );
}
```

---

## Using the Redesigned Dashboard

### Replace GoalDashboard

**File:** `frontend/src/components/goals/GoalsManager.tsx`

```typescript
// OLD import
import { GoalDashboard } from './GoalDashboard';

// NEW import
import { GoalDashboardRedesign } from './GoalDashboardRedesign';

// Then replace the component usage:

{/* OLD */}
<GoalDashboard
  goals={goals}
  onEditGoal={handleEditGoal}
  onDeleteGoal={handleDeleteGoal}
  onSelectGoal={handleSelectGoal}
/>

{/* NEW */}
<GoalDashboardRedesign
  goals={goals}
  onEditGoal={handleEditGoal}
  onDeleteGoal={handleDeleteGoal}
  onSelectGoal={handleSelectGoal}
  onNewGoal={handleNewGoal}
/>
```

---

## Using the Goal Detail View

### Navigate to Goal Details

**File:** `frontend/src/components/goals/GoalsManager.tsx`

```typescript
import { GoalDetailView } from './detail';

// Add state
const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

// Render conditionally
{selectedGoalId ? (
  <GoalDetailView
    goalId={selectedGoalId}
    onBack={() => setSelectedGoalId(null)}
  />
) : (
  <GoalDashboardRedesign
    goals={goals}
    onSelectGoal={(goalId) => setSelectedGoalId(goalId)}
    // ... other props
  />
)}
```

---

## Using the Portfolio Analysis View

### Add to App Navigation

**File:** `frontend/src/App.tsx`

```typescript
import { PortfolioAnalysisView } from './components/analysis/PortfolioAnalysisView';

// Add to navigation menu
const navItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'goals', label: 'Goals' },
  { id: 'portfolio', label: 'Portfolio Analysis' }, // NEW
  { id: 'chat', label: 'Chat' },
];

// Render based on activeView
{activeView === 'portfolio' && (
  <PortfolioAnalysisView
    currentAllocation={currentAllocation}
    targetAllocation={targetAllocation}
    holdings={holdings}
    onRebalance={(plan) => {
      console.log('Execute rebalancing:', plan);
    }}
  />
)}
```

---

## Checking if it Works

### 1. Start the Development Server

```bash
cd frontend
npm install  # Install any new dependencies
npm run dev  # Start Vite dev server
```

### 2. Open in Browser

Navigate to: `http://localhost:5173`

### 3. Test the Wizard

1. Click "+ New Goal" button
2. You should see the redesigned wizard modal with:
   - Progress indicator at top (3 circles)
   - Step 1: Grid of 6 category cards with icons
   - Professional styling (no emojis)

### 4. Walk Through All Steps

- **Step 1:** Click a category (e.g., "Retirement")
- **Step 2:** Fill in goal details
- **Step 3:** See real-time projections update as you change contribution amounts

### 5. Verify Auto-Save

- Fill in some fields
- Wait 5 seconds
- Refresh the page
- The wizard should restore your progress

---

## Troubleshooting

### Issue: Wizard doesn't appear

**Check 1:** Import path is correct
```typescript
// Correct
import { GoalCreationWizard } from './components/goals/wizard';

// Incorrect (missing /wizard)
import { GoalCreationWizard } from './components/goals';
```

**Check 2:** Modal is rendering (check z-index)
- Open browser DevTools
- Search for "Create New Goal" text
- If it exists but not visible, check CSS z-index

### Issue: Styles look broken

**Check 1:** Tailwind CSS is configured
```bash
# Make sure tailwind.config.js includes wizard path
content: [
  "./src/**/*.{js,jsx,ts,tsx}",
  "./src/components/goals/wizard/**/*.{ts,tsx}", // Add this
]
```

**Check 2:** Run Tailwind build
```bash
npm run build:css  # If you have this script
```

### Issue: TypeScript errors

**Check:** Install types
```bash
npm install --save-dev @types/react @types/node
```

**Check:** tsconfig.json includes wizard
```json
{
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx"
  ]
}
```

---

## Next Steps After Integration

1. **Test Goal Creation Flow**
   - Create goals in all 6 categories
   - Verify data saves correctly
   - Check API integration

2. **Test Validation**
   - Leave required fields empty
   - Enter invalid dates
   - Verify error messages appear

3. **Test Auto-Save**
   - Start wizard
   - Fill in partial data
   - Refresh page
   - Confirm data restored

4. **Test Projections**
   - Adjust contribution amounts
   - Verify success probability updates
   - Check recommended contribution calculations

5. **Test Responsiveness**
   - Open on mobile (< 640px)
   - Open on tablet (768px - 1024px)
   - Open on desktop (> 1024px)

---

## Need Help?

### Common Questions

**Q: Can I use both old and new UI?**
A: Yes! You can keep GoalForm for editing and use GoalCreationWizard for new goals.

**Q: Do I need to migrate existing goals?**
A: No, the wizard just creates new goals. Existing goals work with current format.

**Q: What about the API?**
A: The wizard produces data in WizardFormData format. Map it to your API schema in onComplete handler.

**Q: Can I customize the wizard?**
A: Yes! All components accept props. Modify constants.ts for defaults.

---

## Summary

**Quickest Way to Try It:**

1. Edit `GoalsManager.tsx`
2. Change line 9: `import { GoalCreationWizard } from './wizard';`
3. Replace `<GoalForm>` with `<GoalCreationWizard>` around line 250
4. Run `npm run dev`
5. Click "+ New Goal"

**You should see the new wizard! 🎉**
