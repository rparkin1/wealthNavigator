# Goal-Based Planning Tutorial

Learn how to create and manage financial goals using WealthNavigator AI's goal-based planning system.

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Goal Categories](#goal-categories)
3. [Creating Goals](#creating-goals)
4. [Managing Goals](#managing-goals)
5. [Priority Levels](#priority-levels)
6. [Advanced Features](#advanced-features)

---

## Overview

### What is Goal-Based Planning?

Instead of just "saving money," goal-based planning connects every dollar to a specific objective:
- 🏖️ **Retirement** at age 65
- 🎓 **College** for your kids
- 🏠 **House** down payment
- 💰 **Emergency fund** for 6 months
- 🌟 **Custom goals** like sabbatical, wedding, etc.

### Benefits

1. **Clarity**: Know exactly what you're saving for
2. **Motivation**: See progress toward real objectives
3. **Optimization**: Allocate resources efficiently
4. **Trade-offs**: Make informed decisions when goals compete

### How It Works

```
1. Define goal → 2. Calculate funding → 3. Optimize portfolio → 4. Track progress
```

**Time Required:** 10-15 minutes per goal
**Difficulty:** Beginner

---

## Goal Categories

WealthNavigator AI supports six goal types:

### 1. 🏖️ Retirement
**Purpose:** Plan your retirement income

**Key Inputs:**
- Retirement age (default: 65)
- Annual income needed (today's dollars)
- Life expectancy (default: 95)
- Social Security estimate
- Pension income (if any)

**Example:**
```
"I want to retire at 65 with $80,000 per year in income."
```

**AI calculates:**
- Total needed: ~$2,000,000 (25x rule)
- Monthly savings required
- Success probability
- Optimal allocation

---

### 2. 🎓 Education
**Purpose:** Save for college expenses

**Key Inputs:**
- Child's current age
- College start year
- Annual cost (or use average: $30K public, $60K private)
- Number of years (default: 4)
- Expected financial aid

**Example:**
```
"I want to save for my 8-year-old's college. She'll start in 10 years.
I need $120,000 total for 4 years at a state school."
```

**AI calculates:**
- Inflation-adjusted cost
- Monthly savings needed
- 529 plan benefits
- Tax-advantaged growth

**Pro Tip:** Start early! An 8-year-old needs $700/month, but an 18-year-old needs $2,500/month for the same goal.

---

### 3. 🏠 Home Purchase
**Purpose:** Save for a down payment

**Key Inputs:**
- Home price target
- Down payment % (recommend 20%)
- Purchase timeline (years)
- Current savings toward goal
- Additional costs (closing, moving)

**Example:**
```
"I want to buy a $500,000 home in 5 years with 20% down."
```

**AI calculates:**
- Down payment needed: $100,000
- Closing costs: ~$15,000
- Total target: $115,000
- Monthly savings: $1,500 (assuming some growth)

**Conservative allocation:** Use lower-risk portfolio (shorter timeline).

---

### 4. 💰 Emergency Fund
**Purpose:** Build financial safety net

**Recommended Size:**
- **3-6 months** of expenses (standard)
- **6-12 months** if self-employed or single income
- **3 months** if stable dual income

**Key Inputs:**
- Monthly expenses
- Months of coverage desired
- Current emergency savings

**Example:**
```
"I spend $5,000 per month. I want 6 months of emergency savings."
```

**AI calculates:**
- Target: $30,000
- Recommended allocation: 100% cash or money market
- Build timeframe: 1-2 years

**Pro Tip:** This should be your **first goal** before investing.

---

### 5. 🌍 Major Expense
**Purpose:** Plan for large one-time expenses

**Examples:**
- Wedding ($30,000)
- Sabbatical ($50,000)
- Renovations ($75,000)
- Vehicle ($40,000)
- Medical procedure

**Key Inputs:**
- Expense amount
- Timeline (when needed)
- Flexibility (can it be delayed?)

**Example:**
```
"I want to take a 6-month sabbatical in 3 years. I need $50,000."
```

**AI recommends:**
- Conservative allocation (short timeline)
- High cash allocation
- Monthly savings: ~$1,350

---

### 6. 🎁 Legacy Planning
**Purpose:** Leave inheritance or charitable gifts

**Key Inputs:**
- Desired legacy amount
- Beneficiaries
- Timeline (upon death or specific age)
- Existing estate value

**Example:**
```
"I want to leave $500,000 to my children."
```

**AI considers:**
- Estate taxes
- Life insurance needs
- Trust structures (consult attorney)
- Current net worth trajectory

**Note:** Consult estate planning attorney for complex situations.

---

## Creating Goals

### Method 1: Conversational (Recommended)

Just tell the AI what you want in plain English:

**Retirement Example:**
```
You: I want to retire at 60 with $100,000 per year

AI: Great! To help plan your retirement, I need a few details:
    1. What's your current age?
    2. How much do you have saved currently?
    3. How much can you contribute monthly?
    4. Do you have any pension or Social Security estimates?

You: I'm 40, have $200,000 saved, can do $3,000/month,
     expect $25,000/year from Social Security at 67.

AI: Analyzing your retirement plan...
    [Creates goal with detailed calculations]
```

### Method 2: Guided Form

1. Click **"New Goal"** button
2. Choose goal category
3. Fill in structured form
4. Review and confirm

### Method 3: Import from File

1. Download template (CSV or Excel)
2. Fill in goal details
3. Upload to WealthNavigator
4. AI validates and imports

---

## Managing Goals

### View All Goals

**Dashboard View:**
```
Active Goals:
┌─────────────────────────────────────────┐
│ 🏖️ Retirement at 65                     │
│ Progress: 45% funded                    │
│ Success Probability: 87%                │
│ Monthly: $2,000                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🎓 College Fund - Sarah                │
│ Progress: 62% funded                    │
│ Success Probability: 92%                │
│ Monthly: $800                           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 💰 Emergency Fund                       │
│ Progress: 100% funded  ✅               │
│ Amount: $30,000                         │
└─────────────────────────────────────────┘
```

### Edit a Goal

Click any goal → **"Edit"** → Update fields:
- Change target amount
- Adjust timeline
- Update monthly contributions
- Modify risk tolerance

**AI recalculates automatically.**

### Archive a Goal

Completed or no longer relevant?
1. Select goal
2. Click **"Archive"**
3. Goal hidden but data preserved

**Can restore anytime.**

### Delete a Goal

⚠️ **Permanent action**
1. Select goal
2. Click **"Delete"**
3. Confirm deletion
4. Goal and history removed

---

## Priority Levels

When goals compete for limited resources, prioritize:

### 🔴 Essential (Priority 1)
**Must achieve** - Life-changing impact if missed

Examples:
- Retirement (can't work forever)
- Emergency fund (financial security)
- Critical medical expenses

**Funding:** Fully fund before other goals

---

### 🟡 Important (Priority 2)
**Should achieve** - Significant benefit but not critical

Examples:
- College education (alternatives exist)
- Home purchase (can rent longer)
- Major career development

**Funding:** Fund at 80-90% if resources limited

---

### 🟢 Aspirational (Priority 3)
**Nice to achieve** - Enhances life but optional

Examples:
- Luxury vacation
- Hobby expenses
- Early retirement (vs. standard age)

**Funding:** Fund with surplus after essential/important

---

### How to Prioritize

**Example Scenario:**
- Income: $8,000/month
- Expenses: $5,000/month
- Available for goals: $3,000/month

**Allocation:**
1. Emergency fund: $1,000 (essential, building)
2. Retirement: $1,500 (essential)
3. College: $500 (important, partially funded)
4. Vacation fund: $0 (aspirational, deferred)

**As emergency fund completes:**
Reallocate its $1,000 to college and retirement.

---

## Advanced Features

### Multi-Goal Optimization

AI optimizes across all goals simultaneously:

**Example:**
- **Retirement goal**: 30 years, aggressive (70% stocks)
- **College goal**: 10 years, moderate (50% stocks)
- **Home purchase**: 3 years, conservative (20% stocks)

**AI creates:**
- Separate allocation for each goal
- Different risk profiles
- Coordinated rebalancing
- Tax-efficient placement

### Goal Dependencies

Link related goals:

```
Goal 1: "Max out 401k" ($23,000/year)
  ↓ Enables ↓
Goal 2: "Employer match" (+$11,500/year)
```

**AI ensures:** Goal 1 funded before counting Goal 2 benefit.

### Scenario Analysis

Test "what-if" questions:

**Scenarios:**
1. **Optimistic**: Markets return 10% (vs. 8% baseline)
2. **Pessimistic**: Markets return 6%
3. **Delayed retirement**: Work to 67 (vs. 65)
4. **Reduced spending**: $70K/year (vs. $80K)

**Compare side-by-side:**
```
Scenario          | Success Probability
------------------|-------------------
Baseline          | 85%
Optimistic markets| 94%
Pessimistic       | 72%
Work to 67        | 93%
Reduce spending   | 91%
```

### Goal Funding Strategies

**Sequential:**
1. Complete emergency fund (100%)
2. Then retirement (100%)
3. Then college (100%)

**Parallel:**
- Emergency: 50% funded
- Retirement: 50% funded
- College: 50% funded
- All grow together

**Hybrid (Recommended):**
1. Emergency to 100% (priority 1)
2. Then split: Retirement 70%, College 30%
3. Adjust based on timeline

**AI recommends** optimal strategy based on:
- Time horizons
- Risk tolerances
- Priority levels

---

## Best Practices

### 1. Start Simple
Begin with 1-2 goals:
- Retirement (everyone needs this)
- Emergency fund (financial stability)

**Add goals gradually** as you understand the system.

### 2. Be Realistic
Use achievable targets:
- ✅ Retire at 65 with $70K/year (85% probability)
- ❌ Retire at 50 with $150K/year (10% probability)

**Better to achieve 90% of realistic than 10% of aspirational.**

### 3. Review Quarterly
Every 3 months:
- Check progress
- Update contributions
- Adjust as life changes (marriage, kids, promotion)

### 4. Automate Contributions
Set up automatic transfers:
- 401k: Payroll deduction
- IRA: Monthly auto-invest
- 529: Automatic monthly contribution

**"Set it and forget it"** - Remove willpower from equation.

### 5. Celebrate Milestones
- 25% funded: Quarter way there!
- 50% funded: Halfway point!
- 75% funded: Home stretch!
- 100% funded: Success! 🎉

**Motivation matters** for long-term goals.

---

## Troubleshooting

### "My goal requires too much savings"
**Options:**
1. Extend timeline (work 2 more years)
2. Reduce target (spend less in retirement)
3. Increase risk (higher returns, more volatility)
4. Delay other goals (prioritize this one)

### "I have too many goals"
**Solution:**
1. List all goals
2. Assign priority (essential/important/aspirational)
3. Fund essentials first
4. Defer aspirational goals

**Focus** is better than spreading too thin.

### "Success probability dropped"
**Common causes:**
1. Market downturn (temporary)
2. Missed contributions
3. Goal target increased
4. Timeline shortened

**Check:**
- Is it a temporary market issue? (Don't panic)
- Can you increase contributions?
- Can you extend timeline?

---

## Related Tutorials

- [Portfolio Optimization](portfolio-optimization.md) - Optimal allocations
- [Monte Carlo Simulations](monte-carlo.md) - Success probabilities
- [Budget Management](budget-management.md) - Find more to save
- [Tax Optimization](tax-optimization.md) - Tax-efficient strategies

---

## Next Steps

1. ✅ Create your first goal
2. [Run Monte Carlo simulation](monte-carlo.md)
3. [Optimize your portfolio](portfolio-optimization.md)
4. [Track your budget](budget-management.md)

---

**Questions?** → [FAQ](../reference/faq.md)

**Need help?** → support@wealthnavigator.ai

**Back to tutorials** → [Tutorial Index](../README.md#feature-tutorials)
