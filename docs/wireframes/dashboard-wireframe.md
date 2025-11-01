## Dashboard – Low-Fidelity Wireframe

Legend: [KPI] metric card, [C] chart, [T] table, [L] list, [A] action

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Topbar: Search | Date Range | Notifications | User                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌──── Sidebar ────┐ ┌──────────────────── Main Content ──────────────────────┐
│ Dashboard       │ │ [KPI] Total Value | [KPI] YTD | [KPI] Risk | [KPI] Cash│
│ Portfolios      │ │ [KPI] 12m Income                                             │
│ Transactions    │ ├─────────────────────────────────────────────────────────┤
│ Goals           │ │ [C] Performance Over Time (range tabs: 1M 3M 1Y 5Y Max) │
│ Analytics       │ │──────────────────────────┬──────────────────────────────│
│ Reports         │ │ [C] Allocation Donut     │ [A] Quick Actions            │
│ Alerts          │ │                          │  • Rebalance                │
│ Settings        │ │                          │  • Add Funds                │
└─────────────────┘ │                          │  • Run Scenario             │
                    ├──────────────────────────┴──────────────────────────────┤
                    │ [C] Contributions vs Withdrawals     │ [C] Goal Progress │
                    │ (stacked bars)                       │ (donut/list)      │
                    ├─────────────────────────────────────────────────────────┤
                    │ [L] Alerts Stream (severity, CTA)    │ [T] Recent Txns   │
                    │ • Drift > threshold   [A] Review     │ Date | Type | $   │
                    │ • TLH opportunity     [A] Harvest    │                     │
                    └─────────────────────────────────────────────────────────┘
```

Notes
- KPIs clickable → deep link to relevant views.
- Performance chart annotates deposits/withdrawals; hover tooltips summarize.
- Quick actions open a right-side drawer to avoid navigation loss.
- Alerts include severity tags and direct CTAs.

Empty States
- No portfolios: Show CTA to connect/import; populate demo data option.
- No alerts: Soft confirmation message; link to thresholds in Settings.

Accessibility
- Keyboard focus order: Topbar → KPIs → charts → lists/tables.
- Provide CSV download for time-series; ARIA labels on charts.

