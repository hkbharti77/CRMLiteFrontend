# CRMLite Frontend - Component Refactoring Migration Guide

**Last Updated:** 2026-06-13  
**Duration:** 4 Weeks  
**Total Hours:** 80 hours  
**Status:** Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [Week 1: Foundation & Core Components](#week-1-foundation--core-components)
4. [Week 2: Global Library Completion](#week-2-global-library-completion)
5. [Week 3: Screen Refactoring](#week-3-screen-refactoring)
6. [Week 4: Documentation & Polish](#week-4-documentation--polish)
7. [Verification & Testing](#verification--testing)
8. [Common Migration Issues](#common-migration-issues)
9. [Rollback Plan](#rollback-plan)

---

## Overview

### Migration Goals

```
Before (Current State)        →    After (Target State)
────────────────────────────────────────────────────────
1 global component            →    15+ global components
0% code reusability           →    85% code reusability
25% code duplication          →    <5% code duplication
40% theme token usage         →    100% theme token usage
No design system              →    Complete design system
Scattered component logic     →    Organized component library
```

### Success Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Global Components | 1 | 15+ | ✓ |
| Code Duplication | 25% | <5% | ✓ |
| Theme Token Usage | 40% | 100% | ✓ |
| Development Speed | 4/10 | 8/10 | ✓ |
| Design Consistency | 5/10 | 9/10 | ✓ |
| Test Coverage | 10% | 60%+ | ✓ |

### Timeline Summary

```
Week 1 (20 hours)  → Foundation & Core Components
Week 2 (25 hours)  → Global Library Completion + Shared Components
Week 3 (20 hours)  → Screen Refactoring & Migration
Week 4 (15 hours)  → Documentation, Testing & Polish
────────────────────────────────────────────────
Total: 80 hours over 4 weeks
```

---

## Pre-Migration Checklist

### Team Preparation

- [ ] **Read Documentation**
  - [ ] ARCHITECTURE_AUDIT.md (understand the plan)
  - [ ] DESIGN_SYSTEM.md (learn design tokens)
  - [ ] COMPONENT_GUIDELINES.md (learn component standards)

- [ ] **Create Git Branch**
  ```bash
  git checkout -b refactor/component-architecture
  git push -u origin refactor/component-architecture
  ```

- [ ] **Backup Current State**
  ```bash
  git tag backup-before-refactor
  git push origin backup-before-refactor
  ```

- [ ] **Setup Development Environment**
  - [ ] Install dev dependencies: `npm install` or `yarn install`
  - [ ] Verify build works: `npm run build` or `expo build`
  - [ ] Verify tests run: `npm test`

### Repository Preparation

- [ ] Create folder structure (empty directories)
  ```
  src/
  ├── components/
  │   ├── global/
  │   │   ├── Button/
  │   │   ├── Input/
  │   │   ├── Card/
  │   │   └── ...
  │   └── shared/
  │       ├── leads/
  │       ├── tickets/
  │       └── ...
  └── ...
  ```

- [ ] Create documentation files
  - [ ] ARCHITECTURE_AUDIT.md ✓
  - [ ] COMPONENT_GUIDELINES.md ✓
  - [ ] DESIGN_SYSTEM.md ✓
  - [ ] MIGRATION_GUIDE.md ✓
  - [ ] BEST_PRACTICES.md (pending)

- [ ] Setup TypeScript path aliases (if not done)
  ```json
  {
    "compilerOptions": {
      "baseUrl": ".",
      "paths": {
        "@components/*": ["src/components/*"],
        "@screens/*": ["src/screens/*"],
        "@store/*": ["src/store/*"],
        "@utils/*": ["src/utils/*"]
      }
    }
  }
  ```

---

## Week 1: Foundation & Core Components

**Duration:** 20 hours  
**Deliverables:** Foundation layer ready for component building

### Day 1: Tokens Extraction (4 hours)

**Hours 1-2: Extract Color Tokens**

1. **Create file:** `src/theme/colors.ts`
   ```typescript
   export const colors = {
     primary: '#0F766E',
     secondary: '#1E3A8A',
     success: '#10B981',
     warning: '#F59E0B',
     error: '#EF4444',
     // ... complete color palette
   };
   ```

2. **Create file:** `src/theme/tokens.ts`
   ```typescript
   export const tokens = {
     colors: { /* ... */ },
     spacing: { /* ... */ },
     borderRadius: { /* ... */ },
     typography: { /* ... */ },
   };
   ```

3. **Update:** `src/theme.ts` to import from tokens
   ```typescript
   import { tokens } from './tokens';
   // Use tokens in theme creation
   ```

**Verification:**
- [ ] `tokens.ts` file created and exports all tokens
- [ ] `theme.ts` imports from `tokens.ts`
- [ ] App still builds and runs
- [ ] Colors still display correctly

---

**Hours 3-4: Extract Spacing & Other Tokens**

1. **Add spacing tokens** to `src/theme/tokens.ts`
2. **Add border radius tokens**
3. **Add typography tokens**
4. **Add shadow definitions**

**Verification:**
- [ ] All tokens centralized in `tokens.ts`
- [ ] No hardcoded values in `theme.ts`
- [ ] Build succeeds
- [ ] App renders without errors

---

### Day 2-3: Core Global Components (12 hours)

**Hours 5-8: Create Button Components (4 hours)**

**File 1:** `src/components/global/Button/AppButton.tsx`
- Standard button with variants (primary, secondary, outlined)
- Sizes (small, medium, large)
- States (disabled, loading)
- Icon support

**File 2:** `src/components/global/Button/IconButton.tsx`
- Icon-only button
- Sizes
- No text

**File 3:** `src/components/global/Button/Fab.tsx`
- Floating action button
- Position support

**File 4:** `src/components/global/Button/styles.ts`
- All button styling

**File 5:** `src/components/global/Button/index.ts`
- Barrel export

**Checklist:**
- [ ] All button files created
- [ ] TypeScript props interfaces defined
- [ ] All variants implemented
- [ ] Styles use theme tokens
- [ ] JSDoc comments added
- [ ] README.md created
- [ ] Component renders correctly

---

**Hours 9-12: Create Card & Input Components (4 hours)**

**File 1:** `src/components/global/Card/AppCard.tsx`
**File 2:** `src/components/global/Card/StatCard.tsx` (optional)
**File 3:** `src/components/global/Input/AppInput.tsx`
**File 4:** `src/components/global/Input/AppTextArea.tsx`

**Checklist:**
- [ ] Card component styles use theme tokens
- [ ] Input component supports all input types
- [ ] Error states displayed
- [ ] Helper text support
- [ ] All files created with TypeScript
- [ ] Exported from components/global/index.ts

---

**Hours 13-16: Create Badge & EmptyState Components (4 hours)**

**File 1:** `src/components/global/Badge/StatusBadge.tsx`
- All status types (active, pending, inactive, etc.)
- Size variants
- Color variants

**File 2:** `src/components/global/EmptyState/EmptyState.tsx`
- Icon support
- Title + description
- Optional action button

**File 3:** `src/components/global/Loader/FullPageLoader.tsx`
- Loading spinner
- Optional message
- Overlay

**Checklist:**
- [ ] StatusBadge component removes hardcoded status logic
- [ ] EmptyState replaces duplicated empty screens
- [ ] FullPageLoader works on all screens
- [ ] All components typed with interfaces

---

**Hours 17-20: Refactor Existing ConfirmDialog (4 hours)**

1. **Move** `src/components/ConfirmDialog.tsx` → `src/components/global/Modal/`
2. **Update** to follow component guidelines
3. **Add** TypeScript interfaces
4. **Add** JSDoc comments
5. **Update** all imports across screens

**Checklist:**
- [ ] ConfirmDialog moved to global/Modal/
- [ ] All imports updated
- [ ] Component still works (test in app)
- [ ] Follows new guidelines
- [ ] README.md added

---

### Day 4-5: Test Foundation Components (4 hours)

**Hours 21-24: Setup Testing & Create Tests (4 hours)**

1. **Setup test environment** (if not done)
   ```bash
   npm install --save-dev @testing-library/react-native @testing-library/jest-native
   ```

2. **Create test file:** `src/components/global/Button/__tests__/AppButton.test.tsx`
   - Test rendering
   - Test props
   - Test callbacks
   - Test disabled state

3. **Create test file:** `src/components/global/Badge/__tests__/StatusBadge.test.tsx`

4. **Run tests**
   ```bash
   npm test
   ```

**Checklist:**
- [ ] Test files created
- [ ] Basic tests pass
- [ ] Component renders without errors
- [ ] Props are applied correctly

---

### Week 1 Summary

**Completed:**
- ✓ Tokens extracted to separate files
- ✓ 5 core global components created (Button, Card, Input, Badge, EmptyState, Loader)
- ✓ ConfirmDialog refactored and moved
- ✓ Basic tests written
- ✓ All components follow guidelines
- ✓ No breaking changes to screens yet

**Component Count:** 6 global components created

**Files Created:** ~15 files (components + tests + styles)

**Code Quality:** TypeScript, JSDoc, tests, proper theming

**Next:** Week 2 will create remaining global components and start shared modules

---

## Week 2: Global Library Completion

**Duration:** 25 hours  
**Deliverables:** Complete global component library + shared module components

### Day 1-2: Create Remaining Global Components (8 hours)

**Hours 25-32: Header, Avatar, SearchBar, Tabs (4 hours)**

Create 4 component groups:

1. **Headers** (2 hours)
   - `src/components/global/Header/ScreenHeader.tsx`
   - `src/components/global/Header/CompactHeader.tsx`
   - Back button support, title, actions

2. **Avatar** (1 hour)
   - `src/components/global/Avatar/AppAvatar.tsx`
   - Image + initials fallback
   - Sizes: small, medium, large

3. **SearchBar** (1 hour)
   - `src/components/global/SearchBar/AppSearchBar.tsx`
   - Icon support
   - Clear button

4. **Tabs** (0.5 hours)
   - `src/components/global/Tabs/AppTabs.tsx`

**Verification:**
- [ ] All 4 components created
- [ ] Components use theme tokens
- [ ] TypeScript types defined
- [ ] Basic tests written

---

**Hours 33-40: Toast/Divider/List/Chip (4 hours)**

Create 4 more components:

1. **Toast/Snackbar** (1.5 hours)
   - `src/components/global/Toast/Toast.tsx`
   - `src/components/global/Toast/useToast.ts` hook
   - Success, error, warning, info variants

2. **Divider** (0.5 hours)
   - `src/components/global/Divider/AppDivider.tsx`

3. **List** (1 hour)
   - `src/components/global/List/ListItem.tsx`
   - `src/components/global/List/SectionList.tsx`

4. **Chip** (1 hour)
   - `src/components/global/Badge/Chip.tsx`
   - Removable chips
   - Icon support

---

**Checklist (Hours 25-40):**
- [ ] 8 new global components created
- [ ] All follow component guidelines
- [ ] All use theme tokens (no hardcoded values)
- [ ] TypeScript types complete
- [ ] Tests written
- [ ] Exported from global/index.ts
- [ ] README.md for each

**Global Component Count After Week 2:** 14+ components

---

### Day 3-4: Create Shared Lead Components (8 hours)

**Hours 41-48: Lead Module Components (8 hours)**

Create components in `src/components/shared/leads/`:

1. **LeadCard.tsx** (1.5 hours)
   - Lead profile summary
   - Status, value, last contact
   - Pressable, navigation handler

2. **LeadStatusBadge.tsx** (1 hour)
   - Visual status indicator
   - Uses StatusBadge internally

3. **LeadDetailHeader.tsx** (1 hour)
   - Lead name, avatar
   - Edit/share actions

4. **LeadMetrics.tsx** (1.5 hours)
   - Engagement stats
   - Value display
   - Interaction count

5. **LeadListItem.tsx** (1 hour)
   - Compact lead preview
   - Used in list views

6. **LeadFieldsGrid.tsx** (1 hour)
   - Multi-field display
   - Edit capability

7. **styles.ts** (0.5 hours)
   - All lead component styles

8. **index.ts** (0.5 hours)
   - Barrel export

**Verification:**
- [ ] All lead components created
- [ ] Components use theme tokens
- [ ] Components use global components (AppCard, StatusBadge, etc.)
- [ ] TypeScript complete
- [ ] Tests written

---

### Day 5: Create Shared Ticket & Chat Components (9 hours)

**Hours 49-57: Ticket Module Components (4.5 hours)**

Create in `src/components/shared/tickets/`:

1. **TicketCard.tsx** (1 hour)
   - Ticket summary, priority
   - Assignee, status
2. **TicketStatusBadge.tsx** (0.5 hours)
3. **TicketCommentList.tsx** (1 hour)
4. **TicketTimeline.tsx** (1 hour)
5. **TicketListItem.tsx** (1 hour)

**Hours 58-63: Chat Module Components (4.5 hours)**

Create in `src/components/shared/chat/`:

1. **ChatBubble.tsx** (1.5 hours)
2. **ChatListItem.tsx** (1 hour)
3. **MessageInput.tsx** (1 hour)
4. **TypingIndicator.tsx** (1 hour)

**Verification:**
- [ ] Ticket components created
- [ ] Chat components created
- [ ] All use global components
- [ ] All use theme tokens
- [ ] TypeScript types complete

---

**Hours 64-80: Create Dashboard, Booking, Pipeline, Contact Components (12 hours)**

Remaining shared components (time-boxed):

1. **Dashboard Module** (2 hours)
   - KPICard, RevenueChart, ActivityItem, PipelineStage

2. **Booking Module** (3 hours)
   - AppointmentCard, TimeSlotPicker, BookingForm, CalendarView

3. **Pipeline Module** (2 hours)
   - DealCard, StageColumn, DragHandle

4. **Contact Module** (2 hours)
   - ContactCard, ContactListItem, ContactHeader

5. **Shared Services** (3 hours)
   - Shared hooks, utilities, types used by components

---

### Week 2 Summary

**Completed:**
- ✓ 14+ global components completed and tested
- ✓ 40+ shared module components created
- ✓ Complete global component library
- ✓ All components follow guidelines
- ✓ 100% TypeScript coverage

**Component Count:** 54+ total (14 global + 40 shared)

**Next:** Week 3 - Refactor screens to use new components

---

## Week 3: Screen Refactoring

**Duration:** 20 hours  
**Deliverables:** All screens refactored to use component library

### Overview: Screen Refactoring Strategy

```
Screen                 Time    Status    Key Components
─────────────────────────────────────────────────────────
DashboardScreen        3h      Refactor  KPICard, Chart, ActivityItem
LeadsScreen           2h       Refactor  LeadCard, StatusBadge, EmptyState
LeadDetailScreen      2h       Refactor  LeadDetailHeader, LeadFields
TicketScreen          2h       Refactor  TicketCard, Timeline, EmptyState
PipelineScreen        2h       Refactor  StageColumn, DealCard
BookingScreen         2h       Refactor  AppointmentCard, TimeSlotPicker
ChatListScreen        1h       Refactor  ChatListItem
ChatRoomScreen        1h       Refactor  ChatBubble, MessageInput
SettingsScreen        1h       Refactor  SettingItem, ProfileSection
Other Screens         1h       Minor fix  Consistency pass
─────────────────────────────────────────────────────────
Total: 17 hours
```

### Day 1-2: Priority Screens (6 hours)

**Hours 81-90: DashboardScreen Refactoring (6 hours)**

1. **Remove embedded components** (1 hour)
   - Find all inline component code
   - Extract to shared/dashboard/

2. **Replace with library components** (2 hours)
   - CompactHeader → use ScreenHeader
   - KPIGrid → use KPICard (new)
   - ActivityFeed → use ActivityItem (new)
   - StatusBadge → use StatusBadge (global)

3. **Update styling** (1 hour)
   - Remove hardcoded colors
   - Use theme tokens
   - Remove hardcoded spacing

4. **Test** (2 hours)
   - Verify component renders
   - Test all interactions
   - Screenshot comparison

**Before:**
```typescript
// Lines 1-300: DashboardScreen with 15+ embedded components
const DashboardScreen = () => {
  // 300+ lines of JSX and inline components
};
```

**After:**
```typescript
// Lines 1-80: DashboardScreen uses component library
import { ScreenHeader, KPICard, ActivityItem } from '@components/shared/dashboard';

const DashboardScreen = () => {
  return (
    <View>
      <ScreenHeader title="Dashboard" />
      <KPICard metric={data.metric} />
      <ActivityItem activity={data.activity} />
    </View>
  );
};
```

---

**Hours 91-95: LeadsScreen Refactoring (3 hours)**

1. **Extract duplicate StatusBadge logic**
2. **Replace with LeadCard components**
3. **Use EmptyState component**
4. **Update styling to use theme**

---

**Hours 96-100: LeadDetailScreen Refactoring (3 hours)**

1. **Extract LeadDetailHeader**
2. **Extract LeadFieldsGrid**
3. **Use LeadMetrics component**
4. **Clean up inline styles**

---

### Day 3: Mid-Priority Screens (6 hours)

**Hours 101-110: TicketScreen & PipelineScreen (6 hours)**

1. **TicketScreen (3 hours)**
   - Replace TicketCard pattern
   - Use TicketTimeline
   - Use EmptyState

2. **PipelineScreen (3 hours)**
   - Extract StageColumn
   - Use DealCard
   - Remove hardcoded stage styling

---

### Day 4-5: Remaining Screens (8 hours)

**Hours 111-125: BookingScreen, ChatScreens, Other Screens (8 hours)**

1. **BookingScreen (2 hours)**
   - Use AppointmentCard
   - Use TimeSlotPicker

2. **ChatListScreen (1 hour)**
   - Use ChatListItem
   - Use EmptyState

3. **ChatRoomScreen (1 hour)**
   - Use ChatBubble
   - Use MessageInput

4. **SettingsScreen (1 hour)**
   - Use SettingItem
   - Consistency pass

5. **Other Screens (2 hours)**
   - LoginScreen → FormInput components
   - OtpVerificationScreen → Use AppInput
   - ContactProfileScreen → Use AppAvatar
   - BusinessServicesScreen → General cleanup

---

### Week 3 Verification Checklist

**All Screens:**
- [ ] No hardcoded colors (#fff, #000, etc.)
- [ ] All padding/margin uses theme.spacing.*
- [ ] All border-radius uses theme.borderRadius.*
- [ ] All font sizes use theme.typography.*
- [ ] All shadows use theme.shadows.*
- [ ] Uses global components
- [ ] Uses shared module components
- [ ] Tests pass
- [ ] App builds successfully
- [ ] No TypeScript errors
- [ ] App renders correctly

---

### Week 3 Summary

**Completed:**
- ✓ All 15 screens refactored
- ✓ No embedded component logic
- ✓ 100% theme token usage
- ✓ All components library used
- ✓ Consistent styling across app
- ✓ Build succeeds with no errors

**Code Reduction:**
- Screens average 50% smaller
- Duplicate code eliminated
- Cleaner, more maintainable code

**Next:** Week 4 - Documentation, testing, polish

---

## Week 4: Documentation & Polish

**Duration:** 15 hours  
**Deliverables:** Complete documentation and production-ready code

### Day 1: Testing & QA (5 hours)

**Hours 126-135: Comprehensive Testing (5 hours)**

1. **Manual Testing** (2 hours)
   - Navigate all screens
   - Test all interactions
   - Check dark/light mode
   - Test on different devices

2. **Automated Testing** (2 hours)
   - Run test suite
   - Aim for 60%+ coverage
   - Fix failing tests

3. **Performance Testing** (1 hour)
   - Check render performance
   - Check memory usage
   - Optimize if needed

**Checklist:**
- [ ] All screens render without errors
- [ ] All interactions work
- [ ] Dark mode works
- [ ] Light mode works
- [ ] Tests pass (60%+)
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Performance is acceptable

---

### Day 2: Documentation (5 hours)

**Hours 136-150: Complete Documentation (5 hours)**

1. **Create BEST_PRACTICES.md** (2 hours)
   - Component creation examples
   - DO/DON'T patterns
   - Common pitfalls
   - Team standards

2. **Update README.md** (1 hour)
   - Add component library section
   - Add migration notes
   - Add development guide

3. **Create component catalog** (1 hour)
   - List all global components
   - List all shared components
   - Quick reference guide

4. **Create individual component READMEs** (1 hour)
   - If not done in previous weeks
   - Usage examples
   - Props reference

---

### Day 3-5: Code Review & Polish (5 hours)

**Hours 151-165: Final Review (5 hours)**

1. **Code Review** (2 hours)
   - Review all new components
   - Check adherence to guidelines
   - Check for hardcoded values
   - Check TypeScript completeness

2. **Final Cleanup** (1 hour)
   - Remove console logs
   - Remove commented code
   - Format code consistently

3. **Create Pull Request** (1 hour)
   - Write clear description
   - Reference issues if applicable
   - Request reviewers

4. **Final Testing** (1 hour)
   - Test one more time
   - Verify no regressions
   - Test with real API

---

### Week 4 Summary

**Completed:**
- ✓ Comprehensive testing completed
- ✓ All documentation finalized
- ✓ Code review passed
- ✓ Final cleanup done
- ✓ Ready for production

**Before & After Comparison:**

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Global Components | 1 | 14+ | +1300% |
| Shared Components | 0 | 40+ | +∞ |
| Code Duplication | 25% | <5% | -80% |
| Theme Usage | 40% | 100% | +150% |
| Screen Size Avg | 400 lines | 100 lines | -75% |
| Test Coverage | 10% | 60%+ | +500% |
| Dev Speed | 4/10 | 8/10 | +100% |
| Design Consistency | 5/10 | 9/10 | +80% |

**Deliverables:**
- ✓ 54+ components
- ✓ 100% TypeScript
- ✓ Complete documentation
- ✓ Test coverage 60%+
- ✓ Zero breaking changes
- ✓ Clean git history

---

## Verification & Testing

### Build Verification

```bash
# Verify TypeScript compilation
npm run type-check

# Verify code formatting
npm run format

# Verify linting
npm run lint

# Build for production
npm run build

# Run tests
npm test
```

### Quality Checks

- [ ] No TypeScript errors
- [ ] All tests pass
- [ ] Build succeeds
- [ ] No console errors
- [ ] No unused imports
- [ ] Consistent code formatting
- [ ] No hardcoded values
- [ ] All components documented

### Performance Checks

- [ ] App startup time acceptable
- [ ] Screen transitions smooth
- [ ] Memory usage stable
- [ ] No memory leaks
- [ ] List rendering performant
- [ ] Images loaded efficiently

### Accessibility Checks

- [ ] All interactive elements have testID
- [ ] All interactive elements have accessibilityLabel
- [ ] Color contrast WCAG AA compliant
- [ ] Touch targets 44x44px minimum
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

---

## Common Migration Issues

### ❌ Issue: "Component X not found" Error

**Problem:**
```
import { AppButton } from '@components/Button';
// Error: Cannot find module
```

**Solution:**
```bash
# Verify file exists
ls -la src/components/global/Button/AppButton.tsx

# Update import path
import { AppButton } from '@components/global/Button';

# Or use barrel export
import { AppButton } from '@components/global';
```

---

### ❌ Issue: Styling Not Applied

**Problem:**
```typescript
const Component = () => {
  // Theme colors not applying
  return <View style={{ backgroundColor: theme.colors.primary }} />;
};
```

**Solution:**
```typescript
// Make sure useTheme is imported
import { useTheme } from '@react-navigation/native';

const Component = () => {
  const theme = useTheme();  // Call hook
  return <View style={{ backgroundColor: theme.colors.primary }} />;
};
```

---

### ❌ Issue: Props Not Recognized

**Problem:**
```typescript
// Component renders but props ignored
<AppButton title="Click" onPress={() => {}} size="small" />
// size prop ignored
```

**Solution:**
```typescript
// Verify props are in interface
interface AppButtonProps {
  title: string;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';  // Add size prop
}

// Use props in component
const createStyles = (size: string) => {
  const sizeMap = {
    small: { padding: 8 },
    medium: { padding: 12 },
    large: { padding: 16 },
  };
  return sizeMap[size];
};
```

---

### ❌ Issue: Dark Mode Not Working

**Problem:**
```typescript
// Colors don't change in dark mode
const styles = StyleSheet.create({
  text: {
    color: '#111827',  // Hardcoded - doesn't adapt
  },
});
```

**Solution:**
```typescript
// Use theme colors that adapt automatically
const Component = () => {
  const theme = useTheme();
  
  return (
    <Text style={{ color: theme.colors.text.primary }}>
      This adapts to dark mode
    </Text>
  );
};
```

---

### ❌ Issue: Tests Failing

**Problem:**
```bash
npm test
# ✗ Component tests failing
```

**Solution:**
1. Check that components render
2. Verify imports in test
3. Mock theme provider if needed
4. Update snapshots if intentional

```typescript
// Test template
import { render } from '@testing-library/react-native';
import { AppButton } from '../AppButton';

describe('AppButton', () => {
  it('renders without crashing', () => {
    const { getByText } = render(
      <AppButton title="Test" onPress={() => {}} />
    );
    expect(getByText('Test')).toBeTruthy();
  });
});
```

---

### ❌ Issue: Import Conflicts

**Problem:**
```typescript
// Naming conflicts
import { View } from 'react-native';  // RN View
import { View } from './components';  // Custom View
// Error: Duplicate identifier 'View'
```

**Solution:**
```typescript
// Use aliases
import { View } from 'react-native';
import { AppCard as CardView } from '@components/global';

// Or import types separately
import type { ViewProps } from 'react-native';
import { View } from './components';
```

---

## Rollback Plan

### If Something Goes Wrong

**Option 1: Reset to Backup Tag**
```bash
# See backup tag
git tag | grep backup

# Reset to before refactor
git reset --hard backup-before-refactor

# Verify
git status
npm start
```

**Option 2: Revert Last Commit**
```bash
git revert HEAD
git push origin refactor/component-architecture
```

**Option 3: Create New Branch from Backup**
```bash
git checkout -b rollback/emergency backup-before-refactor
git push -u origin rollback/emergency
```

### What NOT to Do

- ❌ Don't force push to main/master
- ❌ Don't delete tag without backup
- ❌ Don't use `git reset --hard` without understanding
- ❌ Don't ignore test failures

---

## Final Checklist

### Before Merging to Main

- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] All screens render
- [ ] Dark/light mode works
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Accessibility verified
- [ ] Documentation complete
- [ ] Code reviewed
- [ ] Git history clean
- [ ] PR description clear

### After Merge to Main

- [ ] Monitor error tracking
- [ ] Watch for performance issues
- [ ] Verify in production (if applicable)
- [ ] Gather team feedback
- [ ] Document lessons learned
- [ ] Plan next phase (if applicable)

---

## Success Criteria

### You've Successfully Completed Migration When:

1. **Code Quality** ✓
   - Zero hardcoded values
   - 100% theme token usage
   - TypeScript strict mode pass
   - Tests passing 60%+

2. **Component Library** ✓
   - 14+ global components
   - 40+ shared components
   - All documented
   - All tested

3. **Development Experience** ✓
   - Screens 50% smaller on average
   - Duplicate code eliminated
   - Team follows guidelines
   - Development faster

4. **Design System** ✓
   - Consistent styling
   - Light/dark mode working
   - Accessibility compliant
   - Responsive design

5. **Documentation** ✓
   - Complete documentation
   - Examples provided
   - Guidelines clear
   - Team trained

---

## Next Steps After Migration

1. **Continuous Improvement**
   - Monitor for hardcoded values
   - Add new components as needed
   - Update documentation

2. **Team Training**
   - Review guidelines
   - Practice creating components
   - Code review sessions

3. **Automation**
   - Add linting rules for hardcoded values
   - Add pre-commit hooks
   - Add component storybook

4. **Future Enhancements**
   - Animation library
   - Advanced theming
   - Component variants
   - Design tokens export

---

## Questions or Issues?

Refer to:
- ARCHITECTURE_AUDIT.md — Overall strategy
- DESIGN_SYSTEM.md — Design tokens reference
- COMPONENT_GUIDELINES.md — Component standards
- BEST_PRACTICES.md — Team standards

**Total Time to Complete Migration: 80 hours (4 weeks)**

Good luck with your refactoring! 🚀
