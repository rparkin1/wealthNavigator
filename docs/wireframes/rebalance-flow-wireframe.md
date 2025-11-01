## Rebalance Flow – Low-Fidelity Wireframe

Legend: [S] step, [C] chart, [T] table, [A] action, [P] panel

[S1] Review Drift
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Title: Rebalance – Review Drift                                             │
│ Current vs Target allocation                                                │
│ [C] Bars: Current (solid) vs Target (outline)                               │
│ [T] Asset | Current | Target | Drift | Suggested Δ | Est. Tax               │
│--------------------------------------------------------------------------------
│ [A] Simulate trades   [A] Save as draft   [A] Cancel                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

[S2] Suggested Trades & Tax Impact
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Title: Rebalance – Suggested Trades                                         │
│ [T] Trade | Ticker | Qty | $ | Account | Lot Selection | Est. Realized Gain │
│ [P] Tax sidebar: Short/Long gains, Wash-sale checks, Harvest opportunities  │
│ [C] Pie: Post-trade allocation vs target                                    │
│ Note: Lot selector opens modal for granular control                          │
│--------------------------------------------------------------------------------
│ [A] Back   [A] Confirm trades   [A] Export PDF                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

[S3] Confirm & Execute
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Title: Rebalance – Confirm                                                  │
│ Summary: # trades, est. costs, tracking error reduction                      │
│ [T] Final review table (read-only)                                          │
│ [A] Execute now   [A] Schedule   [A] Save as draft                           │
│ After: Success toast + link to report and activity log                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

Notes
- Each step is a separate route state (or modal stepper) with local save.
- Provide disabled state previews when data is incomplete.
- Export provides before/after allocation, trades list, and rationale.

Accessibility
- Stepper is keyboard-navigable; announce step changes with ARIA live region.
- Lot selection modal supports full keyboard flows and visible focus.

