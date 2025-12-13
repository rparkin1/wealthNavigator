# Goal Detail Components

Comprehensive goal detail view with tabbed interface for Monte Carlo simulations, what-if analysis, funding strategies, and goal history.

**Implementation:** Phase 3, Week 8 of UI Redesign Plan

## Components

### GoalDetailView

Main goal detail view component with header, progress tracking, and tabbed content.

```tsx
import { GoalDetailView } from '@/components/goals/detail';

<GoalDetailView
  goal={goal}
  simulation={simulation}
  onEdit={(id) => navigate(`/goals/${id}/edit`)}
  onBack={() => navigate('/goals')}
  onRunSimulation={(id) => runMonteCarloSimulation(id)}
/>
```

**Props:**
- `goal` (Goal): Goal data object
- `simulation` (MonteCarloSimulation, optional): Simulation results
- `onEdit` (function, optional): Edit goal callback
- `onBack` (function, optional): Back navigation callback
- `onRunSimulation` (function, optional): Run simulation callback

**Features:**
- Responsive layout (mobile, tablet, desktop)
- Professional design system implementation
- Tab navigation for different views
- Real-time progress tracking
- Success probability display

---

### TabNavigation

Horizontal tab navigation for switching between projection, what-if, funding, and history views.

```tsx
import { TabNavigation } from '@/components/goals/detail';

<TabNavigation
  tabs={[
    { id: 'projection', label: 'Projection', enabled: true },
    { id: 'what-if', label: 'What-If', enabled: true },
    { id: 'funding', label: 'Funding', enabled: true },
    { id: 'history', label: 'History', enabled: true },
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
/>
```

**Props:**
- `tabs` (Tab[]): Array of tab configurations
- `activeTab` (GoalDetailTab): Currently active tab ID
- `onChange` (function): Tab change callback

**Features:**
- Desktop: Horizontal tab bar
- Mobile: Dropdown selector
- Keyboard navigation
- Disabled state support

---

### ProjectionTab

Monte Carlo simulation results display with fan chart and key statistics.

```tsx
import { ProjectionTab } from '@/components/goals/detail';

<ProjectionTab
  goal={goal}
  simulation={simulation}
  onRunSimulation={(id) => runSimulation(id)}
/>
```

**Props:**
- `goal` (Goal): Goal data object
- `simulation` (MonteCarloSimulation, optional): Simulation results
- `onRunSimulation` (function, optional): Run simulation callback

**Features:**
- Empty state with CTA to run simulation
- Loading state with progress indicator
- Fan chart visualization
- Success probability display
- Key statistics cards
- Methodology explanation

---

### SuccessProbabilityDisplay

Visual display of Monte Carlo simulation success probability with confidence indicators.

```tsx
import { SuccessProbabilityDisplay } from '@/components/goals/detail';

<SuccessProbabilityDisplay
  probability={0.87}
  iterations={5000}
  goalAmount={1500000}
  medianValue={1620000}
/>
```

**Props:**
- `probability` (number): Success probability (0.0 - 1.0)
- `iterations` (number): Number of simulation iterations
- `goalAmount` (number): Target goal amount
- `medianValue` (number): Median projected value

**Features:**
- Large, bold percentage display
- Confidence level indicator
- Color-coded based on probability
- Key metrics grid
- Expected surplus/shortfall calculation

---

### MonteCarloFanChartRedesign

Enhanced D3.js fan chart with responsive design and touch interactions.

```tsx
import { MonteCarloFanChartRedesign } from '@/components/goals/detail';

<MonteCarloFanChartRedesign
  projections={portfolioProjections}
  goalAmount={1500000}
  width={800}
  height={400}
/>
```

**Props:**
- `projections` (PortfolioProjection[]): Array of projection data
- `goalAmount` (number, optional): Target goal amount
- `width` (number, optional): Chart width in pixels
- `height` (number, optional): Chart height in pixels

**Features:**
- Responsive sizing with ResizeObserver
- Interactive tooltips on hover
- Percentile bands (10th-90th)
- Median line
- Goal target line
- Professional color scheme
- Legend with explanation

---

## Design System Compliance

All components follow the WealthNavigator UI Redesign specifications:

- **Colors:** Primary blues (#3b82f6), success greens, warning oranges
- **Typography:** Inter font, modular scale, proper hierarchy
- **Spacing:** 8px grid system
- **Shadows:** Elevation-based shadow system
- **Borders:** Consistent radius (8px for cards, 4px for badges)
- **Icons:** Professional SVG icons (no emojis)
- **Touch Targets:** 44x44px minimum (WCAG AAA)
- **Responsive:** Mobile-first with breakpoints at 640px, 768px, 1024px

## Accessibility

- **WCAG 2.1 AA Compliant:** Color contrast, keyboard navigation
- **ARIA Labels:** Proper roles and labels for screen readers
- **Focus Management:** Visible focus indicators, logical tab order
- **Semantic HTML:** Proper heading hierarchy, landmark regions
- **Responsive:** Works on all device sizes

## Performance

- **Chart Rendering:** Optimized D3.js rendering (<500ms)
- **Responsive Sizing:** ResizeObserver for efficient updates
- **Tooltip Cleanup:** Proper cleanup on unmount
- **Code Splitting:** Lazy loading for large visualizations

## Future Enhancements (Week 9-11)

- **What-If Tab:** Interactive sliders for scenario analysis
- **Funding Tab:** Account allocation and tax optimization
- **History Tab:** Goal changes and analysis history
- **Scenario Comparison:** Side-by-side what-if scenarios
- **Export Functionality:** PDF/PNG export of charts
- **Share Results:** Shareable links for goal projections

## Related Documentation

- [UI Redesign Plan](/development_docs/UI_REDESIGN_PLAN.md)
- [Goal Types](/frontend/src/types/goal.ts)
- [Simulation Types](/frontend/src/types/simulation.ts)
- [Design System](/frontend/src/index.css)
