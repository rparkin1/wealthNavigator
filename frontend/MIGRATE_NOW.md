# Migrate to New UI - Quick Start

**⏱️ Time to migrate: 15-30 minutes**






---

## Option 1: Automated Migration (Fastest) ⚡

### Step 1: Run the script

```bash
cd frontend
./migrate-ui.sh
```

The script will:
- ✅ Create automatic backup
- ✅ Update import statements
- ✅ Run linter and type checker
- ⚠️ Flag manual changes needed

### Step 2: Manual updates

The script cannot auto-complete everything. You'll need to manually update:

#### File: `src/components/goals/GoalsManager.tsx`

**Find this section (around line 250):**

```typescript
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
```

**Replace with:**

```typescript
{/* Add state at top of component */}
const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

{/* Replace the GoalForm section with: */}
{selectedGoalId ? (
  <GoalDetailView
    goalId={selectedGoalId}
    onBack={() => setSelectedGoalId(null)}
  />
) : (
  <>
    <GoalDashboardRedesign
      goals={goals}
      onEditGoal={handleEditGoal}
      onDeleteGoal={handleDeleteGoal}
      onSelectGoal={(id) => setSelectedGoalId(id)}
      onNewGoal={() => setShowForm(true)}
    />

    {showForm && !editingGoal && (
      <GoalCreationWizard
        onComplete={async (goalData: WizardFormData) => {
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
        onCancel={() => setShowForm(false)}
      />
    )}
  </>
)}
```

### Step 3: Test

```bash
npm run dev
```

Open http://localhost:5173 and test:
- ✅ Create new goal (should see wizard)
- ✅ View goal details (click on a goal card)
- ✅ Portfolio view works

---

## Option 2: Manual Migration (More Control) 🛠️

### Step 1: Update Goals Section

#### File: `src/components/goals/GoalsManager.tsx`

**Line 9 - Update imports:**

```diff
- import { GoalDashboard } from './GoalDashboard';
- import { GoalForm } from './GoalForm';
+ import { GoalDashboardRedesign } from './GoalDashboardRedesign';
+ import { GoalCreationWizard } from './wizard';
+ import { GoalDetailView } from './detail';
+ import type { WizardFormData } from './wizard/types';
```

**Add state:**

```typescript
const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
```

**Replace render section:**

```typescript
{selectedGoalId ? (
  <GoalDetailView
    goalId={selectedGoalId}
    onBack={() => setSelectedGoalId(null)}
  />
) : (
  <>
    <GoalDashboardRedesign
      goals={goals}
      onSelectGoal={(id) => setSelectedGoalId(id)}
      onNewGoal={handleNewGoal}
      // ... other props
    />

    {showForm && (
      <GoalCreationWizard
        onComplete={handleGoalCreated}
        onCancel={() => setShowForm(false)}
      />
    )}
  </>
)}
```

### Step 2: Update Portfolio Section

#### File: `src/App.tsx`

**Update lazy import:**

```diff
- const PortfolioView = lazy(() =>
-   import('./components/portfolio/PortfolioView').then(m => ({ default: m.PortfolioView }))
- );
+ const PortfolioAnalysisView = lazy(() =>
+   import('./components/portfolio/analysis/PortfolioAnalysisView').then(m => ({ default: m.PortfolioAnalysisView }))
+ );
```

**Update component usage:**

```diff
- <PortfolioView userId={userId} />
+ <PortfolioAnalysisView
+   currentAllocation={currentAllocation}
+   targetAllocation={targetAllocation}
+   holdings={holdings}
+   onRebalance={handleRebalance}
+ />
```

### Step 3: Update Thread Sidebar (Optional)

#### File: `src/App.tsx`

```diff
- import { ThreadSidebar } from './components/threads/ThreadSidebar';
+ import { ThreadSidebarRedesign } from './components/threads/ThreadSidebarRedesign';

- <ThreadSidebar />
+ <ThreadSidebarRedesign />
```

### Step 4: Test

```bash
cd frontend
npm run dev
```

---

## Option 3: Gradual Migration (Safest) 🐢

Use feature flags to switch between old and new:

### Add environment variable

```bash
# .env
VITE_USE_NEW_UI=true
```

### Wrap components

```typescript
const useNewUI = import.meta.env.VITE_USE_NEW_UI === 'true';

return (
  <>
    {useNewUI ? (
      <GoalDashboardRedesign {...props} />
    ) : (
      <GoalDashboard {...props} />
    )}
  </>
);
```

**Benefits:**
- ✅ Easy rollback
- ✅ A/B testing possible
- ✅ Less risky

**Switch back anytime:**
```bash
# .env
VITE_USE_NEW_UI=false
```

---

## Verify Migration Worked

### ✅ Checklist

After migrating, you should see:

**Goals Section:**
- [ ] New goal wizard (no emojis, professional icons)
- [ ] Redesigned goal cards (clean, modern)
- [ ] Goal detail view with tabs
- [ ] What-if analysis with sliders
- [ ] Monte Carlo fan chart

**Portfolio Section:**
- [ ] Allocation comparison charts
- [ ] Efficient frontier visualization
- [ ] Holdings table with filters
- [ ] Rebalancing plan modal

**Navigation:**
- [ ] Redesigned thread sidebar (if migrated)
- [ ] Consistent spacing and colors

### ❌ Troubleshooting

**Issue: "Module not found"**
```bash
# Check imports are correct
npm run typecheck
```

**Issue: "Component not rendering"**
```bash
# Check props match
# See docs/COMPLETE_UI_MIGRATION_GUIDE.md
```

**Issue: "Styles broken"**
```bash
# Rebuild Tailwind
npm run build:css
```

**Issue: "TypeScript errors"**
```bash
# Install types
npm install
```

---

## Rollback (If Needed)

### Quick rollback:

```bash
# Find your backup branch
git branch | grep backup

# Switch to it
git checkout backup-before-migration-YYYYMMDD
```

### Or revert specific files:

```bash
# Revert GoalsManager
git checkout HEAD~1 -- src/components/goals/GoalsManager.tsx

# Revert App.tsx
git checkout HEAD~1 -- src/App.tsx
```

---

## Performance Check

After migration, run:

```bash
# Build for production
npm run build

# Check bundle size
npm run build -- --report
```

**Expected:**
- Bundle size similar or smaller
- Load time < 1s
- No console errors

---

## Next Steps

After successful migration:

1. **Test thoroughly**
   - All goal operations
   - Portfolio features
   - Mobile responsiveness

2. **Update remaining sections** (optional)
   - Retirement dashboard
   - Tax dashboard
   - Budget manager

3. **Remove old components**
   ```bash
   # After 100% sure everything works
   rm src/components/goals/GoalForm.tsx
   rm src/components/goals/GoalDashboard.tsx
   rm src/components/goals/GoalCard.tsx
   ```

4. **Commit changes**
   ```bash
   git add .
   git commit -m "Migrate to new UI design system"
   git push
   ```

---

## Need Help?

📚 **Full Documentation:**
- `docs/COMPLETE_UI_MIGRATION_GUIDE.md` - Comprehensive guide
- `docs/NEW_UI_INTEGRATION_GUIDE.md` - Integration details
- `QUICK_INTEGRATION_PATCH.md` - Quick patches

💬 **Common Questions:**

**Q: Do I need to migrate everything at once?**
A: No! Start with Goals, then Portfolio, then others.

**Q: Will my data be affected?**
A: No, only UI changes. Data format unchanged.

**Q: Can I keep some old components?**
A: Yes! Mix and match as needed.

**Q: What if I break something?**
A: Rollback to backup branch instantly.

---

## Time Estimates

| Component | Time | Difficulty |
|-----------|------|------------|
| Goals Section | 10 min | Easy |
| Portfolio Section | 5 min | Easy |
| Thread Sidebar | 5 min | Easy |
| Testing | 10 min | Easy |
| **Total** | **30 min** | **Easy** |

---

## Success! 🎉

**You now have:**
✅ Professional design system
✅ Better accessibility
✅ Improved UX
✅ Responsive layouts
✅ Faster performance

**Welcome to the new WealthNavigator UI!**
