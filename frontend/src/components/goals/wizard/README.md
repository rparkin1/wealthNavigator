# Goal Creation Wizard

Week 11 - UI Redesign Phase 3

## Overview

Multi-step wizard for creating new financial goals with professional design, smart defaults, real-time projections, and draft auto-save.

## Features

### ✅ Implemented

- **Multi-step wizard** - 3-step flow (Category → Details → Funding)
- **Progress indicator** - Filled circles showing completion
- **Professional icons** - SVG icons instead of emojis
- **Form validation** - Inline error messages with step-level validation
- **Smart defaults** - Pre-filled values based on goal category
- **Real-time projections** - Live calculation updates as user types
- **Draft auto-save** - Saves to localStorage every 5 seconds
- **Keyboard navigation** - Tab through fields, Enter to advance
- **Responsive design** - Works on mobile, tablet, desktop
- **Accessibility** - ARIA labels, keyboard support, screen reader friendly

## Components

### GoalCreationWizard (Main)

The orchestrator component that manages wizard state, validation, and navigation.

**Props:**
```typescript
interface GoalCreationWizardProps {
  onComplete: (goalData: WizardFormData) => void;
  onCancel: () => void;
}
```

**Usage:**
```tsx
import { GoalCreationWizard } from './components/goals/wizard';

<GoalCreationWizard
  onComplete={(goalData) => {
    // Handle goal creation
    console.log('New goal:', goalData);
  }}
  onCancel={() => {
    // Handle cancel
    console.log('Wizard cancelled');
  }}
/>
```

### WizardProgressIndicator

Displays step progress with filled circles for completed steps.

**Props:**
```typescript
interface WizardProgressIndicatorProps {
  currentStep: WizardStep; // 1, 2, or 3
  totalSteps: number;      // 3
}
```

### Step1CategorySelection

Grid of clickable category cards with professional SVG icons.

**Props:**
```typescript
interface Step1CategorySelectionProps {
  selectedCategory: GoalCategory | null;
  onSelectCategory: (category: GoalCategory) => void;
}
```

### Step2GoalDetails

Form for goal name, description, target amount, date, current savings, and priority.

**Props:**
```typescript
interface Step2GoalDetailsProps {
  formData: WizardFormData;
  errors: ValidationErrors;
  onChange: (field: keyof WizardFormData, value: any) => void;
}
```

### Step3FundingStrategy

Funding inputs with real-time projection preview showing success probability.

**Props:**
```typescript
interface Step3FundingStrategyProps {
  formData: WizardFormData;
  errors: ValidationErrors;
  onChange: (field: keyof WizardFormData, value: any) => void;
}
```

## Smart Defaults by Category

| Category      | Default Amount | Default Monthly | Default Return |
|---------------|----------------|-----------------|----------------|
| Retirement    | $1,500,000     | $2,500          | 7.0%           |
| Education     | $240,000       | $1,200          | 6.0%           |
| Home Purchase | $100,000       | $2,000          | 5.0%           |
| Major Expense | $50,000        | $1,000          | 4.0%           |
| Emergency     | $30,000        | $500            | 2.0%           |
| Legacy        | $500,000       | $1,500          | 6.5%           |

## Projection Calculations

The wizard calculates projections using future value formulas:

- **Future Value of Current Savings:** `FV = PV * (1 + r)^n`
- **Future Value of Contributions:** `FV = PMT * [((1 + r)^n - 1) / r] * (1 + r)`
- **Success Probability:** Simplified model based on % of goal achieved

Where:
- `PV` = Present value (current savings)
- `PMT` = Monthly payment (contribution)
- `r` = Monthly interest rate (annual / 12)
- `n` = Number of months to goal

### Real Monte Carlo Integration

When `runMonteCarloOnCreation` is checked, the system will run a full Monte Carlo simulation (5,000+ iterations) after goal creation for detailed probability analysis.

## Draft Auto-Save

The wizard automatically saves progress to localStorage every 5 seconds:

- **Storage Key:** `goalWizardDraft`
- **Data Saved:** Form data, current step, timestamp
- **Expiration:** 24 hours
- **Restoration:** Automatic on mount if valid draft exists

## Validation Rules

### Step 1: Category Selection
- Must select a category before proceeding

### Step 2: Goal Details
- **Name:** Required, non-empty
- **Target Amount:** Required, must be > 0
- **Target Date:** Required, must be in the future
- **Priority:** Required

### Step 3: Funding Strategy
- **Monthly Contribution:** Required, must be >= 0
- **Expected Return:** Required, 0-20%

## Design System Compliance

### Colors
- Primary: `--primary-600` (#2563eb)
- Success: `--success-600` (#16a34a)
- Warning: `--warning-600` (#d97706)
- Error: `--error-600` (#dc2626)

### Typography
- Page title: `text-2xl font-semibold`
- Section heading: `text-lg font-semibold`
- Labels: `text-sm font-medium`
- Body: `text-base`

### Spacing
- Card padding: `p-6`
- Section gaps: `space-y-6`
- Input padding: `px-4 py-3`

### Border Radius
- Inputs/Buttons: `rounded-md` (8px)
- Cards: `rounded-lg` (12px)
- Modal: `rounded-xl` (16px)

## Accessibility

- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Screen reader announcements for step changes
- ✅ Error messages linked to inputs via `aria-describedby`
- ✅ Focus management between steps
- ✅ Color contrast meets WCAG 2.1 AA

## Performance

- **Initial Render:** <100ms
- **Step Transition:** <50ms (instant)
- **Projection Calculation:** <10ms (debounced)
- **Auto-save:** 5-second throttle

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

- [ ] Multi-goal dependency warnings
- [ ] Historical data integration for return estimates
- [ ] Goal templates (common scenarios)
- [ ] AI-powered goal suggestions
- [ ] Goal import from financial accounts
- [ ] Collaborative goal planning (shared goals)

## Related Components

- `GoalCard` - Displays goal summary
- `GoalDetailView` - Full goal details with tabs
- `MonteCarloFanChart` - Visualization of simulation results
- `WhatIfAnalysis` - Interactive scenario modeling

## Testing

### Unit Tests
```bash
npm test wizard
```

### Integration Tests
```bash
npm test wizard.integration
```

### Accessibility Tests
```bash
npm run test:a11y wizard
```

## Changelog

### v1.0.0 (Week 11, Dec 2024)
- ✅ Initial implementation
- ✅ 3-step wizard flow
- ✅ Professional SVG icons
- ✅ Smart defaults
- ✅ Real-time projections
- ✅ Draft auto-save
- ✅ Full validation
- ✅ Responsive design
- ✅ Accessibility features
