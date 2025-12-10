# Monte Carlo Simulation Tutorial

Learn how to run and interpret Monte Carlo simulations to understand your financial plan's success probability.

---

## 📚 What You'll Learn

- What Monte Carlo simulations are
- Why they're better than single projections
- How to run simulations
- How to interpret results
- How to use scenarios
- How to improve your success probability

**Time Required:** 15 minutes
**Difficulty:** Beginner to Intermediate

---

## What is Monte Carlo Simulation?

### The Problem with Single Projections

**Traditional approach:**
```
Starting amount: $100,000
Annual return: 8%
After 30 years: $1,006,266

Result: "You'll have $1 million!" ✅
```

**But this assumes:**
- Returns are exactly 8% every year
- No market crashes
- No market booms
- Perfect predictability

**Reality:** Markets are unpredictable! Some years +30%, some years -20%.

---

### The Monte Carlo Solution

Instead of one projection, run **thousands of scenarios**:

**Simulation approach:**
```
Run 5,000 different scenarios:
- Scenario 1: Market crash Year 1, boom Year 5 → End: $850K
- Scenario 2: Steady 8% every year → End: $1.0M
- Scenario 3: Boom Year 1, crash Year 10 → End: $920K
- ... (4,997 more scenarios)

Result: "You reach $1M in 87% of scenarios" (4,350 out of 5,000)
Success probability: 87%
```

**This accounts for:**
- Market volatility
- Sequence of returns risk
- Real-world uncertainty
- Statistical probabilities

---

## Why Monte Carlo is Better

### Example: Two Different Return Sequences

**Sequence A: Early gains**
```
Year 1: +20%  → $120,000
Year 2: +15%  → $138,000
Year 3: -10%  → $124,200
Year 4: +8%   → $134,136
Year 5: +8%   → $144,867

Average: 8.2% per year
Ending balance: $144,867
```

**Sequence B: Early losses (same average return)**
```
Year 1: -10%  → $90,000
Year 2: +8%   → $97,200
Year 3: +8%   → $104,976
Year 4: +20%  → $125,971
Year 5: +15%  → $144,867

Average: 8.2% per year
Ending balance: $144,867
```

**Same average return, same end result when just investing.**

**BUT with contributions and withdrawals:**

**Sequence A (early gains) with $1,000/month contribution:**
```
Year 5 balance: $209,342
```

**Sequence B (early losses) with $1,000/month contribution:**
```
Year 5 balance: $196,187
```

**Difference: $13,155 (7% less!)** due to sequence of returns.

**Monte Carlo accounts for all possible sequences.**

---

## How It Works

### The Simulation Process

**Step 1: Define Parameters**
```
Starting value: $100,000
Monthly contribution: $2,000
Time horizon: 30 years
Goal amount: $2,000,000

Expected return: 8% annual
Volatility: 15% annual
```

**Step 2: Generate Random Returns**
For each scenario, generate 30 random annual returns:
```
Scenario 1: [12%, -8%, 15%, 9%, -3%, 22%, -12%, ...]
Scenario 2: [6%, 11%, -5%, 19%, 8%, -15%, 14%, ...]
Scenario 3: [-2%, 9%, 16%, 7%, -10%, 13%, 11%, ...]
...
Scenario 5000: [...]
```

**Returns follow a normal distribution:**
- Mean: 8%
- Standard deviation: 15%
- Most returns fall within -7% to +23% (8% ± 15%)

**Step 3: Calculate Portfolio Growth**
For each scenario, calculate month-by-month:
```
Month 1: $100,000 × (1 + monthly_return) + $2,000
Month 2: Month1_value × (1 + monthly_return) + $2,000
...
Month 360: Final value
```

**Step 4: Determine Success**
```
Scenario 1 final value: $2,150,000 → SUCCESS ✅
Scenario 2 final value: $1,890,000 → FAILURE ❌
Scenario 3 final value: $2,340,000 → SUCCESS ✅
...
```

**Step 5: Calculate Probability**
```
Successes: 4,350 out of 5,000
Success probability: 87%
```

---

## Running a Simulation

### Method 1: Automatic (Recommended)

When you create a goal, the AI automatically runs simulation:

```
You: I want to retire at 65 with $80,000/year income

AI: Analyzing your plan...
    Running Monte Carlo simulation (5,000 iterations)...
    ⏱ Completed in 0.06 seconds

    Results:
    ✅ Success Probability: 87%
    📊 Median outcome: $2.1M
    📈 Best case (90th %ile): $3.2M
    📉 Worst case (10th %ile): $1.4M
```

### Method 2: Manual Run

1. Go to existing goal
2. Click **"Run Simulation"**
3. (Optional) Adjust parameters:
   - Number of iterations (default: 5,000)
   - Expected return
   - Volatility
   - Correlation assumptions
4. Click **"Calculate"**
5. View results

**Simulation runs in ~5-10 seconds** (5,000 iterations).

---

## Interpreting Results

### Success Probability

**What it means:**
```
87% success = In 87 out of 100 market scenarios, you reach your goal
```

**Interpretation guidelines:**
- **90-100%**: Excellent! Very likely to succeed
- **80-89%**: Good. Likely to succeed
- **70-79%**: Moderate. May need adjustments
- **60-69%**: Concerning. Consider plan changes
- **<60%**: High risk. Revise plan

**Recommended target:** 80-90% for most goals

**Note:** 100% means you're being too conservative (leaving money on the table).

---

### Percentile Projections

**What they show:** Range of possible outcomes

**Example results:**
```
Portfolio Value at Retirement:
┌──────────────────────────────────────┐
│ 90th percentile (best 10%): $3.2M   │ ← Optimistic
│ 75th percentile: $2.6M              │
│ 50th percentile (median): $2.1M     │ ← Most likely
│ 25th percentile: $1.7M              │
│ 10th percentile (worst 10%): $1.4M  │ ← Pessimistic
└──────────────────────────────────────┘

Your goal: $2.0M
Success probability: 87%
```

**How to read:**
- **Median (50th)**: Most likely outcome
- **10th percentile**: 90% of scenarios do better than this
- **90th percentile**: Only 10% of scenarios do this well

**If your goal is below the 50th percentile:** Great! Most scenarios succeed.

**If your goal is above the 75th percentile:** Risky. Only 25% of scenarios succeed.

---

### Fan Chart Visualization

The fan chart shows portfolio value over time:

```
              Value ($M)
              4.0 ┤
                  │            ╱╲ ← 90th percentile (green)
              3.0 ┤          ╱    ╲
                  │        ╱        ╲
              2.0 ┤──────────────────── ← Your goal
                  │      ╱            ╲ ← 50th percentile (yellow)
              1.0 ┤    ╱                ╲
                  │  ╱                    ╲ ← 10th percentile (red)
              0.0 ┤╱
                  └────────────────────────
                  0    10    20    30 Years
```

**Color zones:**
- 🟢 **Green area**: Best 10% of outcomes (90th percentile)
- 🟡 **Yellow area**: Middle 50% of outcomes (25th-75th percentile)
- 🔴 **Red area**: Worst 10% of outcomes (10th percentile)

**Your goal line** shows target value over time.

**If goal line:**
- Inside green zone → Very achievable ✅
- Inside yellow zone → Achievable ✅
- Outside all zones → Difficult ❌

---

### Key Statistics

**Median Final Value**
- Most likely outcome
- 50% of scenarios above, 50% below
- **Example:** $2.1M (goal: $2.0M) ✅

**Probability of Loss**
- Chance of ending below starting value
- Should be very low (<5%) for long horizons
- **Example:** 2% (very good)

**Shortfall Amount (if <100% success)**
- How much you miss goal by in failing scenarios
- **Example:** Average shortfall: $150K (in 13% of scenarios)

---

## Running Scenarios

Test "what-if" questions by creating scenarios.

### Common Scenarios

#### 1. Market Returns

**Baseline:**
```
Expected return: 8%
Success probability: 87%
```

**Optimistic (+2%):**
```
Expected return: 10%
Success probability: 94%
Interpretation: If markets do better than expected
```

**Pessimistic (-2%):**
```
Expected return: 6%
Success probability: 72%
Interpretation: If markets disappoint
```

**Takeaway:** Still 72% success in bad markets. Acceptable risk.

---

#### 2. Contribution Amounts

**Baseline:**
```
Monthly contribution: $2,000
Success probability: 87%
```

**Increased (+$500):**
```
Monthly contribution: $2,500
Success probability: 94%
Improvement: +7 percentage points
```

**Decreased (-$500):**
```
Monthly contribution: $1,500
Success probability: 76%
Decline: -11 percentage points
```

**Takeaway:** Extra $500/month adds 7% to success. Worth it?

---

#### 3. Timeline

**Baseline:**
```
Retire at 65
Success probability: 87%
```

**Work 2 More Years (retire at 67):**
```
Success probability: 95%
Improvement: +8 percentage points
Additional savings: $48,000 ($2K × 24 months)
Shorter retirement: 2 years less withdrawals
```

**Early Retirement (retire at 63):**
```
Success probability: 69%
Decline: -18 percentage points
Less savings: ($48,000)
Longer retirement: 2 more years of withdrawals
```

**Takeaway:** Each year of work significantly improves odds.

---

#### 4. Spending in Retirement

**Baseline:**
```
Annual spending: $80,000
Success probability: 87%
```

**Reduced Spending (-$10K):**
```
Annual spending: $70,000
Success probability: 95%
Improvement: +8 percentage points
```

**Increased Spending (+$10K):**
```
Annual spending: $90,000
Success probability: 74%
Decline: -13 percentage points
```

**Takeaway:** $10K/year less spending = 8% higher success.

---

### Creating Side-by-Side Comparisons

**Compare multiple scenarios:**
```
Scenario             | Success | Median Value
---------------------|---------|-------------
Baseline             | 87%     | $2.1M
Work to 67           | 95%     | $2.4M ✅ (Best)
Save extra $500/mo   | 94%     | $2.3M
Spend $10K less/year | 95%     | $2.2M
Optimistic returns   | 94%     | $2.6M
Pessimistic returns  | 72%     | $1.7M ⚠️
```

**Analysis:**
- Working 2 more years is most impactful
- Pessimistic returns still 72% success (acceptable)
- Multiple paths to 95% success

---

## Improving Success Probability

### If Your Success Probability is Low (<80%)

**Options (in order of impact):**

1. **Increase contributions** (+25% savings → +10-15% success)
2. **Work longer** (+2 years → +8-12% success)
3. **Reduce goal** (-10% spending → +8-10% success)
4. **Increase risk** (+10% stocks → +3-5% success, but more volatility)

**Example improvement plan:**
```
Current: 72% success
Goal: 85% success
Gap: 13 percentage points

Option A: Work to 67 (+2 years)
Improvement: +10 points → 82%
Still short by 3 points

Option B: Work to 67 + Save extra $250/month
Improvement: +13 points → 85% ✅

Option C: Work to 66 + Reduce spending by $5K/year
Improvement: +13 points → 85% ✅
```

Choose based on what's most acceptable to you.

---

### Understanding Sequence of Returns Risk

**The Problem:**
Two people save the same amount, earn the same average return, but have different outcomes.

**Example:**

**Person A: Early gains, late losses**
```
Ages 35-50: Markets average +12%
Ages 50-65: Markets average +4%
Overall average: 8%
Retirement portfolio: $2.3M
```

**Person B: Early losses, late gains (same average)**
```
Ages 35-50: Markets average +4%
Ages 50-65: Markets average +12%
Overall average: 8%
Retirement portfolio: $1.9M
```

**Difference: $400K (21% less) despite same average return!**

**Why?** Early gains compound over more time.

**Monte Carlo accounts for this** by testing all possible sequences.

**Protection strategies:**
1. **Diversification**: Mix of stocks, bonds, cash
2. **Rebalancing**: Sell high, buy low
3. **Glide path**: Reduce risk as goal approaches
4. **Flexible spending**: Cut back in bad markets

---

## Advanced Tips

### 1. Run Sensitivity Analysis

Test how sensitive your plan is to key variables:

```
Variable              | Change  | Impact on Success
----------------------|---------|------------------
Expected return       | ±2%     | ±15 points
Volatility            | ±5%     | ±3 points
Contribution amount   | ±$500   | ±7 points
Timeline              | ±2 years| ±10 points
```

**Most sensitive:** Returns and timeline
**Least sensitive:** Volatility

**Takeaway:** Focus on what you can control (savings, timeline).

---

### 2. Probability Density Chart

See the full distribution of outcomes:

```
    Frequency
    800 ┤     ╱╲
        │    ╱  ╲
    600 ┤   ╱    ╲
        │  ╱      ╲
    400 ┤ ╱        ╲
        │╱          ╲___
    200 ┤              ╲_____
        │                    ╲___
      0 └────────────────────────
        $0  $1M  $2M  $3M  $4M
                        ↑
                     Your goal ($2M)
```

**Shows:** How outcomes cluster around median.

**Analysis:**
- Most scenarios: $1.8M - $2.4M
- Long tail to the right: Some very high outcomes
- Sharp cutoff at left: Can't go below $0

---

### 3. Year-by-Year Probabilities

See how probability changes over time:

```
Year | Portfolio Value | Success Prob
-----|----------------|-------------
5    | $250K         | 98%
10   | $550K         | 95%
15   | $950K         | 91%
20   | $1.4M         | 88%
25   | $1.8M         | 86%
30   | $2.1M         | 87%
```

**Note:** Probability dips mid-way as uncertainty grows, then recovers.

---

## Best Practices

### 1. Run Simulations Regularly
- **Quarterly**: Check if still on track
- **After major life events**: Marriage, kids, job change
- **Market crashes**: Don't panic, just check

### 2. Use Conservative Assumptions
Better to beat expectations than fall short:
- **Returns**: Use historical averages or slightly below
- **Inflation**: Assume 3% (historical average)
- **Volatility**: Use realistic estimates (15-20% for stocks)

### 3. Plan for Failure Scenarios
Ask: "What if I'm in the unlucky 13%?"

**Backup plans:**
- Work part-time in retirement
- Reduce spending 10-20%
- Delay Social Security to 70 (higher benefits)
- Downsize home

### 4. Don't Chase 100%
**80-90% is optimal** for most goals. 100% means:
- Too conservative allocation
- Leaving money on the table
- Could have retired earlier or spent more

---

## Troubleshooting

### "Simulation is taking too long"
**Expected:** 5-10 seconds for 5,000 iterations
**If longer:**
- Reduce iterations to 1,000
- Close other browser tabs
- Refresh and retry

### "Results seem unrealistic"
**Check:**
1. Return assumptions (8% stocks is reasonable)
2. Volatility (15% for balanced portfolio)
3. Contribution amounts (typo?)
4. Timeline (correct number of years?)

### "Success probability keeps changing"
**This is normal!** Monte Carlo uses random numbers.

**Run-to-run variation:** ±2-3 percentage points
```
Run 1: 87%
Run 2: 85%
Run 3: 89%
```

All within normal range. Don't obsess over 1-2% changes.

### "I'm in the 10th percentile path"
**Don't panic!**
1. Check if it's temporary (one bad year ≠ long-term failure)
2. Rerun simulation with updated data
3. Consider increasing contributions temporarily
4. Remember: 90% of scenarios still ahead of you

---

## Related Tutorials

- [Goal Planning](goal-planning.md) - Create goals to simulate
- [Portfolio Optimization](portfolio-optimization.md) - Optimize allocations
- [Interpreting Results](../guides/interpreting-results.md) - Deep dive on analysis

---

## Next Steps

1. ✅ Run your first Monte Carlo simulation
2. [Interpret your results](../guides/interpreting-results.md)
3. [Create scenarios](../guides/scenario-analysis.md)
4. [Improve your success probability](#improving-success-probability)

---

**Questions?** → [FAQ](../reference/faq.md#what-is-monte-carlo-simulation)

**Need help?** → support@wealthnavigator.ai

**Back to tutorials** → [Tutorial Index](../README.md#feature-tutorials)
