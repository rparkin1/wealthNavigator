## Portfolio Detail – Low-Fidelity Wireframe

Legend: [KPI] metric card, [C] chart, [T] table, [P] panel, [A] action

Header
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Breadcrumbs: Portfolios / Core Index 60-40                                  │
│ Title: Core Index 60-40     [A] Rebalance  [A] TLH  [A] Adjust Strategy     │
└─────────────────────────────────────────────────────────────────────────────┘
```

Overview
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [KPI] Value  │ [KPI] YTD Return │ [KPI] Drift │ [KPI] Risk │ [KPI] Cash     │
└─────────────────────────────────────────────────────────────────────────────┘
```

Charts + Side Panel
```
┌───────────────────────────────┬──────────────────────────────────────────────┐
│ [C] Performance Over Time     │ [P] Side Panel: Notes / Documents            │
│  Range: 1M 3M 1Y 5Y Max      │  • Model mapping                             │
│                               │  • Attach docs                               │
│ [C] Allocation (donut/treemap)│  • Free-text notes                           │
└───────────────────────────────┴──────────────────────────────────────────────┘
```

Holdings Table
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [T] Holdings                                                            ⌕   │
│ Ticker | Name | Weight | Value | Cost Basis | Gain/Loss | Yield | Actions    │
│ ------ | ---- | ------ | ----- | ---------- | --------- | ----- | --------   │
│ VTI    | US…  | 35.0%  | $…    | $…         | +$…       | 1.3%  | ⋯          │
│ BND    | US…  | 25.0%  | $…    | $…         | -$…       | 2.2%  | ⋯          │
│ …                                                                            │
│ Footer: Pagination · Column presets (Performance | Tax | Risk)               │
└─────────────────────────────────────────────────────────────────────────────┘
```

Risk & Analytics
```
┌───────────────────────────────┬──────────────────────────────────────────────┐
│ [C] Drawdown / Volatility     │ [C] Correlations Heatmap                    │
│ [KPI] Beta | VaR | Sharpe     │ Tooltips + legend                           │
└───────────────────────────────┴──────────────────────────────────────────────┘
```

Notes
- Primary actions are persistent, mirrored in a sticky action bar on scroll.
- Table supports column pinning, saved views, and lot-level drill-in.
- Side panel toggles without changing route; supports attachments.

Accessibility
- Table headers use proper scope; keyboard sorting and filtering.
- Heatmap uses ARIA descriptions and numeric value tooltips.

