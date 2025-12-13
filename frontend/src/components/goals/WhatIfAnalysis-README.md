# What-If Analysis Components

**Status:** ✅ Complete
**Phase:** 3 - Advanced Features (Week 9)
**Design System:** Professional financial UI following WealthNavigator design tokens

## Overview

The What-If Analysis suite provides interactive financial scenario modeling with real-time calculations, impact visualization, and scenario comparison capabilities. These components enable users to explore how changes in parameters affect their financial goals.

## Components

### 1. RangeSlider

**File:** `../ui/RangeSlider.tsx`

Touch-optimized range slider for adjusting financial parameters.

**Features:**
- 44px height for touch targets (WCAG AAA compliant)
- Live value display with custom formatting
- Min/max labels
- Accessibility (ARIA labels, keyboard support)
- Smooth transitions and animations
- Disabled state support

**Usage:**
```tsx
import { RangeSlider, formatters } from '@/components/ui';

<RangeSlider
  label="Monthly Contribution"
  value={monthlyAmount}
  min={0}
  max={10000}
  step={100}
  onChange={setMonthlyAmount}
  formatValue={formatters.currency}
  helperText="How much you plan to save each month"
  showMinMax
/>
```

**Built-in Formatters:**
- `formatters.currency` - $1,234
- `formatters.percentage` - 7.5%
- `formatters.years` - 20 years
- `formatters.age` - Age 65
- `formatters.months` - 12 months

---

### 2. WhatIfTab

**File:** `WhatIfTab.tsx`

Main what-if analysis interface with interactive parameter adjustment.

**Features:**
- Real-time calculation engine with debouncing
- Three key parameter sliders:
  - Monthly contribution ($0 - $10,000)
  - Expected annual return (2% - 12%)
  - Retirement age (50 - 75)
- Impact summary showing changes from baseline
- Save scenario functionality
- Reset to baseline
- Professional styling with design system

**Props:**
```tsx
interface WhatIfTabProps {
  goalId: string;
  currentAge: number;
  currentAmount: number;
  targetAmount: number;
  targetDate: string;
  baselineMonthlyContribution: number;
  baselineExpectedReturn: number;
  baselineRetirementAge: number;
  onSaveScenario?: (scenario: SavedScenario) => void;
  className?: string;
}
```

**Usage:**
```tsx
import { WhatIfTab } from '@/components/goals';

<WhatIfTab
  goalId={goal.id}
  currentAge={35}
  currentAmount={250000}
  targetAmount={1500000}
  targetDate="2045-06-01"
  baselineMonthlyContribution={2500}
  baselineExpectedReturn={7.0}
  baselineRetirementAge={65}
  onSaveScenario={handleSaveScenario}
/>
```

---

### 3. ImpactSummary

**File:** `ImpactSummary.tsx`

Visual summary of scenario changes compared to baseline.

**Features:**
- Side-by-side comparison cards
- Color-coded positive/negative changes
- Arrow indicators (up/down)
- Percentage change calculations
- Contextual analysis text
- Recommendations for improvement

**Components:**
- `ImpactSummary` - Full detailed view
- `CompactImpactSummary` - Inline compact version

**Usage:**
```tsx
import { ImpactSummary, CompactImpactSummary } from '@/components/goals';

// Full view
<ImpactSummary
  comparison={comparisonResult}
  baselineValue={baselineResult.projectedValue}
  alternativeValue={alternativeResult.projectedValue}
  baselineProbability={baselineResult.successProbability}
  alternativeProbability={alternativeResult.successProbability}
/>

// Compact inline version
<CompactImpactSummary comparison={comparisonResult} />
```

---

### 4. ScenarioComparison

**File:** `ScenarioComparison.tsx`

Side-by-side comparison table for multiple saved scenarios.

**Features:**
- Multi-scenario comparison table
- Visual highlighting of best/worst values
- Checkbox selection for batch operations
- Remove scenarios
- Set new baseline
- Summary statistics
- Average calculations

**Usage:**
```tsx
import { ScenarioComparison } from '@/components/goals';

<ScenarioComparison
  scenarios={savedScenarios}
  onRemoveScenario={handleRemoveScenario}
  onSelectBaseline={handleSelectBaseline}
/>
```

---

## Calculation Engine

**File:** `../../utils/whatIfCalculations.ts`

Financial calculation utilities for what-if analysis.

**Functions:**

### calculateWhatIf()
Calculate projected outcomes based on parameters.

```tsx
const result = calculateWhatIf({
  monthlyContribution: 2500,
  expectedReturn: 7.0,
  retirementAge: 65,
  currentAge: 35,
  currentAmount: 250000,
  targetAmount: 1500000,
  inflationRate: 2.5  // optional, defaults to 2.5%
});

// Returns:
// {
//   projectedValue: number,
//   successProbability: number,
//   monthlyShortfall: number,
//   yearsToGoal: number,
//   realReturn: number,
//   totalContributions: number,
//   totalGrowth: number
// }
```

### compareScenarios()
Compare two scenarios and calculate differences.

```tsx
const comparison = compareScenarios(baselineResult, alternativeResult);

// Returns:
// {
//   valueDifference: number,
//   valuePercentChange: number,
//   probabilityDifference: number,
//   monthlyDifference: number
// }
```

### calculateOptimalContribution()
Binary search to find optimal monthly contribution for target success probability.

```tsx
const optimalMonthly = calculateOptimalContribution(
  params,
  0.90  // 90% success probability target
);
```

**Formatting Functions:**
- `formatCurrency(value)` - $1,234,567
- `formatPercentage(value, decimals)` - 87.5%
- `formatDifference(value, isCurrency)` - +$25,000 or +5.2%

---

## Design System Integration

### Colors Used

**Success (Green):**
- `--success-50` - Background for positive impacts
- `--success-500` - Positive value indicators
- `--success-700` - Positive text

**Error (Red):**
- `--error-50` - Background for negative impacts
- `--error-500` - Negative value indicators
- `--error-700` - Negative text

**Info (Blue):**
- `--info-50` - Information backgrounds
- `--info-200` - Information borders
- `--info-600` - Information text

**Primary (Blue):**
- `--primary-600` - Slider handles, CTAs
- `--primary-700` - Hover states
- `--primary-800` - Active states

### Typography

- **Numbers:** `font-mono` (IBM Plex Mono) for tabular alignment
- **Labels:** `text-sm` (14px) medium weight
- **Values:** `text-2xl` (24px) bold for emphasis
- **Helper Text:** `text-sm` (14px) gray-600

### Spacing

- Component padding: `p-6` (24px)
- Card gaps: `gap-4` (16px)
- Section spacing: `space-y-6` (24px)
- Slider height: 44px (touch-optimized)

---

## Accessibility Features

### WCAG 2.1 AA Compliance

1. **Touch Targets:** Minimum 44x44px for all interactive elements
2. **Color Contrast:** Minimum 4.5:1 for text, 3:1 for UI components
3. **Keyboard Navigation:** Full keyboard support for all interactions
4. **ARIA Labels:**
   - `aria-label` on range sliders
   - `aria-valuemin`, `aria-valuemax`, `aria-valuenow` on sliders
   - `aria-valuetext` for formatted values
5. **Focus Management:** Visible focus indicators on all interactive elements
6. **Screen Reader Support:** Semantic HTML and ARIA attributes

### Keyboard Shortcuts

- **Arrow Keys:** Adjust slider values (±step)
- **Page Up/Down:** Large adjustments (±10× step)
- **Home/End:** Min/max values
- **Tab:** Navigate between sliders
- **Enter:** Trigger save/reset buttons

---

## Performance Optimizations

### Debouncing
Calculations are debounced to prevent excessive re-renders during slider adjustments. Default debounce: 150ms.

### Memoization
All expensive calculations are memoized using `useMemo`:
- Baseline calculations
- Alternative calculations
- Scenario comparisons

### Conditional Rendering
Impact summary only renders when there are changes from baseline, reducing unnecessary DOM updates.

---

## Integration Example

Complete integration in GoalDetailView:

```tsx
import { TabNavigation, ProjectionTab, WhatIfTab, ScenarioComparison } from '@/components/goals';

function GoalDetailView({ goal }: GoalDetailViewProps) {
  const [activeTab, setActiveTab] = useState('projection');
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);

  const handleSaveScenario = (scenario: SavedScenario) => {
    setSavedScenarios(prev => [...prev, scenario]);
    // Optionally persist to backend/localStorage
  };

  return (
    <div>
      <TabNavigation
        tabs={['projection', 'what-if', 'funding', 'history']}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'projection' && (
        <ProjectionTab goal={goal} />
      )}

      {activeTab === 'what-if' && (
        <div className="space-y-8">
          <WhatIfTab
            goalId={goal.id}
            currentAge={35}
            currentAmount={goal.currentAmount}
            targetAmount={goal.targetAmount}
            targetDate={goal.targetDate}
            baselineMonthlyContribution={2500}
            baselineExpectedReturn={7.0}
            baselineRetirementAge={65}
            onSaveScenario={handleSaveScenario}
          />

          {savedScenarios.length > 0 && (
            <ScenarioComparison
              scenarios={savedScenarios}
              onRemoveScenario={(id) => {
                setSavedScenarios(prev => prev.filter(s => s.id !== id));
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Testing Considerations

### Unit Tests
- [ ] Slider value changes trigger onChange
- [ ] Calculation engine produces accurate results
- [ ] Scenario comparison calculates differences correctly
- [ ] Formatters produce expected output

### Integration Tests
- [ ] Real-time updates work end-to-end
- [ ] Saved scenarios persist correctly
- [ ] Reset functionality restores baseline
- [ ] Impact summary shows correct changes

### Accessibility Tests
- [ ] Keyboard navigation works for all controls
- [ ] Screen readers announce slider values
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA

### Performance Tests
- [ ] Debouncing prevents excessive calculations
- [ ] Large scenario lists render efficiently
- [ ] No memory leaks on unmount

---

## Future Enhancements

1. **Scenario Templates:** Pre-built scenarios (conservative, aggressive, etc.)
2. **Monte Carlo Integration:** Run full simulations for saved scenarios
3. **Export Functionality:** PDF/CSV export of comparison table
4. **Charts:** Visual charts showing scenario projections over time
5. **Undo/Redo:** History of slider adjustments
6. **Smart Recommendations:** AI-suggested optimal parameters
7. **Goal Constraints:** Set min/max constraints on parameters
8. **Tax Implications:** Show after-tax projections

---

## Related Components

- **GoalDetailView** - Parent container for tabs
- **TabNavigation** - Tab switching UI
- **ProjectionTab** - Monte Carlo projections
- **MonteCarloFanChartRedesign** - Probability visualization
- **SuccessProbabilityDisplay** - Success metrics

---

## Resources

- Design System: `development_docs/UI_REDESIGN_PLAN.md`
- API Specification: `development_docs/ProductDescription/api-specification.md`
- Financial Calculations: `development_docs/ProductDescription/financial_planning_requirements.md`

---

**Last Updated:** 2025-12-13
**Author:** WealthNavigator AI Development Team
**Status:** ✅ Production Ready
