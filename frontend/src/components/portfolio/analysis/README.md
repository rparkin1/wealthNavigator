# Portfolio Analysis Components

Comprehensive portfolio analysis and visualization components following the UI Redesign specifications (Week 10).

## Components

### PortfolioAnalysisView

Main portfolio analysis view with comprehensive visualizations and rebalancing recommendations.

**Features:**
- Current vs. target allocation comparison
- Efficient frontier chart
- Holdings detail table with sorting/filtering
- Rebalancing plan modal
- Real-time portfolio statistics

**Usage:**
```tsx
import { PortfolioAnalysisView } from '@/components/portfolio/analysis';

<PortfolioAnalysisView
  portfolio={portfolioData}
  efficientFrontier={frontierPoints}
  rebalancingPlan={plan}
  onRefresh={() => console.log('Refresh')}
  onRebalance={() => console.log('Rebalance')}
  onOptimize={() => console.log('Optimize')}
/>
```

### AllocationComparison

Dual pie chart visualization comparing current vs. target asset allocation with variance analysis.

**Features:**
- Side-by-side pie charts (current vs. target)
- Allocation variance table
- Visual indicators for drift > 5%
- Rebalancing recommendations
- Responsive design (stacks on mobile)

**Usage:**
```tsx
import { AllocationComparison } from '@/components/portfolio/analysis';

<AllocationComparison
  currentAllocation={{
    us_stocks: 0.65,
    bonds: 0.25,
    cash: 0.10
  }}
  targetAllocation={{
    us_stocks: 0.60,
    bonds: 0.30,
    cash: 0.10
  }}
  onOptimize={() => console.log('Optimize')}
/>
```

### EfficientFrontier

Scatter plot visualization of efficient frontier with current and recommended portfolio positions.

**Features:**
- Interactive scatter chart (risk vs. return)
- Current portfolio marker (orange star)
- Recommended portfolio marker (green star)
- Max Sharpe ratio identification
- Expected improvement calculations
- Hover tooltips with detailed metrics

**Usage:**
```tsx
import { EfficientFrontier } from '@/components/portfolio/analysis';

<EfficientFrontier
  points={efficientFrontierData}
  currentPortfolio={{
    risk: 0.12,
    return: 6.2,
    label: 'Current'
  }}
  recommendedPortfolio={{
    risk: 0.10,
    return: 8.0,
    label: 'Max Sharpe'
  }}
/>
```

### HoldingsTable

Sortable, filterable table of all portfolio holdings grouped by account.

**Features:**
- Multi-column sorting (ticker, name, value, gain/loss, %)
- Search filter across ticker/name
- Account and asset class filters
- Expandable account groups
- Real-time gain/loss calculations
- Color-coded performance indicators

**Usage:**
```tsx
import { HoldingsTable } from '@/components/portfolio/analysis';

<HoldingsTable
  accounts={accountsData}
  onRebalance={() => console.log('Rebalance')}
/>
```

### RebalancingPlanModal

Modal dialog displaying detailed rebalancing plan with trades, tax impact, and expected improvements.

**Features:**
- Trade-by-trade breakdown (buy/sell)
- Tax impact analysis
- Expected performance improvements
- Cost estimation (taxes + trading fees)
- Net benefit calculation
- One-click plan execution

**Usage:**
```tsx
import { RebalancingPlanModal } from '@/components/portfolio/analysis';

<RebalancingPlanModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  plan={rebalancingPlan}
  onExecute={handleExecute}
/>
```

## Icons

Professional SVG icons for portfolio features:

- `PieChartIcon` - Pie chart visualization
- `ScatterChartIcon` - Scatter plot points
- `TableIcon` - Table/grid layout
- `RefreshIcon` - Refresh/reload data
- `RebalanceIcon` - Rebalancing indicator
- `WarningIcon` - Alert/warning triangle
- `CheckCircleIcon` - Success/completion
- `TrendingUpIcon` - Upward trend
- `DollarSignIcon` - Currency/financial
- `SortAscIcon` - Sort ascending
- `SortDescIcon` - Sort descending
- `FilterIcon` - Filter/funnel

**Usage:**
```tsx
import { PieChartIcon, RefreshIcon } from '@/components/portfolio/icons';

<PieChartIcon size={20} className="text-primary-600" />
<RefreshIcon size={16} color="#3b82f6" />
```

## TypeScript Types

Extended portfolio types for UI components:

```typescript
import type {
  Portfolio,
  AssetAllocation,
  EfficientFrontierPoint,
  RebalancingPlanDetails,
  HoldingsFilter,
  HoldingsSortConfig,
  SortField,
  SortDirection,
} from '@/types/portfolio';
```

## Design System Compliance

All components follow the UI Redesign specifications:

- **Color Palette**: Primary blues, semantic colors (success, warning, error)
- **Typography**: Inter font family, modular scale
- **Spacing**: 8px grid system
- **Shadows**: Elevation-based shadow system
- **Border Radius**: Consistent rounded corners (8px, 12px)
- **Touch Targets**: Minimum 44x44px for mobile
- **Accessibility**: WCAG 2.1 AA compliant
- **Responsive**: Mobile-first approach with breakpoints

## Performance

- **Chart Rendering**: Recharts with optimized re-renders
- **Table Sorting**: Memoized with `useMemo`
- **Filtering**: Debounced search inputs (300ms)
- **Lazy Loading**: Chart libraries loaded on-demand
- **Bundle Size**: ~12KB gzipped per component

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

## Testing

Components include:
- TypeScript type safety
- Prop validation
- Accessibility features (ARIA labels, keyboard navigation)
- Responsive design testing
- Cross-browser compatibility

## Future Enhancements

- [ ] Export charts as images (PNG/SVG)
- [ ] Print-friendly layouts
- [ ] Dark mode support
- [ ] Advanced filtering (date ranges, custom rules)
- [ ] Drag-and-drop reordering
- [ ] Real-time WebSocket updates
- [ ] Historical performance charts
- [ ] Benchmark comparisons
- [ ] Custom allocation targets
- [ ] Automated rebalancing schedules

## Related Documentation

- [UI Redesign Plan](/development_docs/UI_REDESIGN_PLAN.md) - Full specification
- [Portfolio Types](/frontend/src/types/portfolio.ts) - TypeScript definitions
- [Design System](/frontend/src/index.css) - CSS tokens and utilities
- [Component Library](/frontend/src/components/ui/) - Base UI components
