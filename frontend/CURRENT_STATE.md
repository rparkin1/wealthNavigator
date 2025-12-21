# Current Navigation State

**Date:** 2025-12-20
**Status:** Pre-refactor audit
**Branch:** refactor/navigation-architecture

## View Types

Current View union type includes:
- `home` - Dashboard/landing page
- `chat` - AI conversation interface
- `goals` - Financial goals management
- `portfolio` - Portfolio analysis view
- `portfolio-data` - Portfolio data entry
- `budget` - Budget manager
- `recurring` - Recurring transactions
- `retirement` - Retirement planning
- `education` - Education funding
- `529-calculator` - 529 plan calculator
- `tax` - Tax management
- `estate-planning` - Estate planning
- `hedging` - Hedging strategies
- `insurance` - Insurance optimization
- `sensitivity` - Sensitivity analysis
- `risk` - Risk management
- `reserves` - Reserve monitoring
- `diversification` - Diversification analysis
- `plaid` - Bank connections
- `data-entry` - Data entry hub
- `settings` - User settings
- `what-if` - What-if analysis
- `life-events` - Life events manager
- `scenarios` - Historical scenarios

## Current Navigation Structure

### Sidebar Navigation (Lines 627-904)
Custom-built sidebar with manual layout:

**Section 1: Navigation**
- Home (HomeIcon)
- Data Entry (DocumentTextIcon)
- Chat (ChatBubbleLeftIcon)

**Section 2: Planning**
- Goals (FlagIcon)
- Budget (BanknotesIcon)
- Recurring (ArrowPathIcon)
- Portfolio (ChartBarIcon)
- Retirement (CalendarDaysIcon)
- Education Funding (AcademicCapIcon)
- Tax Management (ReceiptPercentIcon)
- Estate Planning (ScaleIcon)
- Hedging Strategies (ShieldCheckIcon)
- Insurance Optimization (HeartIcon)
- Bank Connections (BuildingLibraryIcon)

**Section 3: Analysis & Scenarios**
- Risk Management (ExclamationTriangleIcon)
- Reserve Monitoring (BanknotesIcon)
- Diversification (FlagIcon)
- Sensitivity Analysis (ChartBarIcon)
- What-If Analysis (SparklesIcon)
- Life Events (CalendarDaysIcon)
- Historical Scenarios (ChartBarIcon)

### Header (Lines 907-955)
- Hamburger menu button (toggles sidebar)
- "Financial Planning" title
- NotificationSystem component
- HelpMenu component
- Settings button (navigates to settings view)

### Main Layout Structure (Lines 627-967)
```
<div className="flex h-screen bg-gray-50">
  <aside> {/* Sidebar */} </aside>
  <div className="flex-1 flex flex-col">
    <header> {/* Top bar */} </header>
    <main> {/* Content */} </main>
  </div>
</div>
```

## State Variables

### Navigation State
- `currentView: View` - Current active view (default: 'home')
- `sidebarOpen: boolean` - Sidebar visibility state (default: true)

### Other State
- `showOnboarding: boolean` - Onboarding wizard visibility
- `showDocumentation: boolean` - Documentation viewer visibility
- `currentDocPath: string` - Current documentation path
- `userId: string` - User ID ('test-user-123')

## Event Handlers

### Navigation Handlers
- `setCurrentView(view: View)` - Changes current view
- `setSidebarOpen(open: boolean)` - Toggles sidebar
- `handleOpenDocumentation(docPath: string)` - Opens documentation
- `handleOpenTutorial(tutorialId: string)` - Opens tutorial
- `handleOnboardingComplete()` - Completes onboarding
- `handleOnboardingSkip()` - Skips onboarding

## Custom Layout Code (To Be Removed)

### Sidebar (Lines 631-903)
- Fixed width: `w-64` (256px)
- Conditional rendering based on view type
- Manual button elements for each navigation item
- Active state styling: `bg-blue-50 text-blue-600`
- Inactive state: `text-gray-700 hover:bg-gray-100`

### Header (Lines 909-954)
- Only shown for specific views (not chat)
- Hamburger menu toggles `sidebarOpen` state
- Fixed components: NotificationSystem, HelpMenu, Settings button

## Mobile Behavior

**Current State:**
- No dedicated mobile navigation
- Sidebar is hidden/shown via hamburger menu
- Same sidebar used for both desktop and mobile
- No bottom navigation bar
- No mobile-specific menu

## Import Dependencies

### Components
- ErrorBoundary
- Breadcrumbs
- NotificationSystem
- HelpMenu
- OnboardingWizard
- InAppDocumentation
- SkipLink

### Hooks
- useOnboarding
- useGoals
- usePortfolioData

### Icons (Heroicons)
- 15+ icons imported for navigation items

### Lazy-loaded Views
- 30+ lazy-loaded component views

## Notable Patterns

1. **Conditional Sidebar Rendering:** Sidebar only shows for specific views
2. **View-based Routing:** Uses state-based routing, not URL routing
3. **Breadcrumbs in Views:** Each view renders its own breadcrumbs
4. **Suspense Boundaries:** Each lazy-loaded view wrapped in Suspense
5. **Error Boundaries:** Views wrapped in ErrorBoundary for isolation

## Migration Challenges

1. **Large File:** App.tsx is 1691 lines - needs careful refactoring
2. **Conditional Logic:** Complex conditional rendering for sidebar/header
3. **State Dependencies:** Views depend on state-based navigation
4. **No Thread Management:** No thread/conversation management currently
5. **Mobile Gap:** Missing mobile-optimized navigation

## Success Criteria

✅ All 24 views remain accessible
✅ State management preserved
✅ Navigation patterns maintained
✅ No functionality lost
✅ Improved mobile experience
✅ Cleaner code structure
✅ Professional UI design
