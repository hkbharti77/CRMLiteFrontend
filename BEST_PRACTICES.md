# CRMLite Frontend - Best Practices & Team Standards

**Last Updated:** 2026-06-13  
**Status:** Live Standards Document  
**Scope:** Development guidelines for the entire team

---

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [Naming Conventions](#naming-conventions)
3. [TypeScript Standards](#typescript-standards)
4. [Design System Usage](#design-system-usage)
5. [Performance Guidelines](#performance-guidelines)
6. [Testing Standards](#testing-standards)
7. [Error Handling](#error-handling)
8. [Accessibility](#accessibility)
9. [State Management](#state-management)
10. [Code Review Checklist](#code-review-checklist)

---

## Component Architecture

### Component Types & Rules

#### ✅ GLOBAL COMPONENTS

**When to Create:**
- Component used in **2+ screens** across different modules
- UI pattern repeated across codebase
- Fundamental building block (button, input, card)

**Location:** `src/components/global/{ComponentName}/`

**File Structure:**
```
Button/
├── Button.tsx           # Main component
├── Button.types.ts      # Props interface
├── styles.ts            # StyleSheet
├── hooks.ts             # Custom hooks (if needed)
├── index.ts             # Barrel export
├── README.md            # Documentation
└── __tests__/
    └── Button.test.tsx
```

**Export Pattern:**
```typescript
// ✅ DO: Export both named and default
export const AppButton: React.FC<AppButtonProps> = (props) => { /* ... */ };
export default AppButton;

// ✅ In index.ts: Barrel export
export { AppButton, type AppButtonProps } from './AppButton';
```

---

#### ✅ SHARED MODULE COMPONENTS

**When to Create:**
- Component used in **multiple screens within same module**
- Feature-specific UI (lead cards, ticket items)
- Domain logic incorporated

**Location:** `src/components/shared/{moduleName}/{ComponentName}.tsx`

**Module Folders:**
- `leads/` — Lead-related components
- `tickets/` — Ticket-related components
- `chat/` — Chat-related components
- `bookings/` — Booking-related components
- `dashboard/` — Dashboard-related components

**Example:**
```typescript
// src/components/shared/leads/LeadCard.tsx
interface LeadCardProps {
  lead: Lead;
  onPress: (lead: Lead) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onPress }) => {
  // Component implementation
};
```

---

#### ✅ MODULE-SPECIFIC COMPONENTS

**When to Create:**
- Component used **only in one screen**
- Single-use UI pattern
- No value in extracting

**Location:** Keep inline in screen OR `src/modules/{screenName}/components/`

**Example:**
```typescript
// Inside LeadDetailScreen.tsx or separate file
const LeadHistoryTimeline: React.FC<Props> = (props) => {
  // Used only by LeadDetailScreen
};
```

---

### Component Composition Rules

**DO:**
```typescript
// ✅ CORRECT: Compose multiple components
const LeadCard = ({ lead }: Props) => (
  <AppCard>
    <View>
      <Text>{lead.name}</Text>
      <StatusBadge status={lead.status} />
    </View>
  </AppCard>
);
```

**DON'T:**
```typescript
// ❌ WRONG: Reimplement what exists
const LeadCard = ({ lead }: Props) => (
  <View style={{ padding: 16, backgroundColor: '#fff', borderRadius: 8 }}>
    <Text>{lead.name}</Text>
    <View style={{ backgroundColor: '#10B981', padding: 4, borderRadius: 4 }}>
      <Text>{lead.status}</Text>
    </View>
  </View>
);
```

---

## Naming Conventions

### Component Naming

```typescript
// ✅ DO: PascalCase for components
export const AppButton = () => { /* ... */ };
export const LeadCard = () => { /* ... */ };
export const ScreenHeader = () => { /* ... */ };

// ❌ DON'T: lowercase
export const appButton = () => { /* ... */ };
export const leadCard = () => { /* ... */ };

// ❌ DON'T: camelCase for components
export const myButton = () => { /* ... */ };
```

### File Naming

```typescript
// ✅ DO: Match component name
Button/
├── Button.tsx            // Matches export: AppButton
├── Button.types.ts
├── styles.ts

// ✅ DO: Descriptive names
LeadDetailHeader.tsx      // Clear purpose
ChatBubble.tsx           // Clear purpose
FormInput.tsx            // Clear purpose

// ❌ DON'T: Non-descriptive names
Component.tsx            // What component?
Item.tsx                 // Which item?
Helper.tsx              // What helper?
```

### Props Interface Naming

```typescript
// ✅ DO: ComponentName + "Props"
interface AppButtonProps {
  title: string;
  onPress: () => void;
}

interface LeadCardProps {
  lead: Lead;
  onPress: () => void;
}

// ❌ DON'T: Different patterns
interface Props { /* ... */ }
interface AppButtonInterface { /* ... */ }
interface IAppButton { /* ... */ }
```

### Function Naming

```typescript
// ✅ DO: Descriptive verb + noun
const handlePress = () => { /* ... */ };
const calculateTotal = (items: Item[]) => { /* ... */ };
const formatDate = (date: Date) => { /* ... */ };

// ❌ DON'T: Vague names
const onClick = () => { /* ... */ };
const calc = () => { /* ... */ };
const fmt = () => { /* ... */ };
```

### Callback Props Naming

```typescript
// ✅ DO: "on" + action
interface ButtonProps {
  onPress: () => void;
  onLongPress?: () => void;
  onChange: (value: string) => void;
  onError: (error: Error) => void;
}

// ❌ DON'T: Different patterns
interface Props {
  click: () => void;
  change: (value: string) => void;
  handlePress: () => void;  // Props should start with "on"
}
```

---

## TypeScript Standards

### Strict TypeScript Settings

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

### Type Definitions

**DO:**
```typescript
// ✅ CORRECT: Explicit types
interface User {
  id: string;
  name: string;
  email: string;
}

const getUser = (id: string): Promise<User> => {
  // Implementation
};

const Component: React.FC<ComponentProps> = (props) => {
  // Implementation
};
```

**DON'T:**
```typescript
// ❌ WRONG: Using any
const getUser = (id: any): any => { /* ... */ };

// ❌ WRONG: Implicit types
const Component = (props) => { /* ... */ };

// ❌ WRONG: No return type
const calculate = (a: number, b: number) => a + b;
```

### Props Interface Pattern

```typescript
// ✅ CORRECT: Structured props interface
interface LeadCardProps {
  // Required props
  lead: Lead;
  onPress: (lead: Lead) => void;
  
  // Optional props with defaults
  variant?: 'compact' | 'full';
  onDelete?: (leadId: string) => void;
  
  // Style props
  style?: StyleProp<ViewStyle>;
  
  // Accessibility
  testID?: string;
  accessibilityLabel?: string;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onPress,
  variant = 'compact',
  onDelete,
  style,
  testID,
  accessibilityLabel,
}) => {
  // Implementation
};
```

### Generics

```typescript
// ✅ CORRECT: Typed generics
interface ListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onItemPress?: (item: T) => void;
}

const List = <T,>({
  data,
  renderItem,
  onItemPress,
}: ListProps<T>): React.ReactElement => {
  return (
    <View>
      {data.map((item, index) => (
        <Pressable key={index} onPress={() => onItemPress?.(item)}>
          {renderItem(item, index)}
        </Pressable>
      ))}
    </View>
  );
};
```

---

## Design System Usage

### Color Usage Rules

**DO:**
```typescript
// ✅ CORRECT: Use theme colors
const Component = () => {
  const theme = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.primary }}>
      <Text style={{ color: theme.colors.text.primary }}>
        Primary text
      </Text>
    </View>
  );
};
```

**DON'T:**
```typescript
// ❌ WRONG: Hardcoded colors
const Component = () => (
  <View style={{ backgroundColor: '#0F766E' }}>
    <Text style={{ color: '#111827' }}>
      Primary text
    </Text>
  </View>
);

// ❌ WRONG: Random hex values
const bad = StyleSheet.create({
  container: {
    backgroundColor: '#efefef',  // Should use theme
    color: '#333',               // Should use theme
  },
});
```

### Spacing Usage Rules

**DO:**
```typescript
// ✅ CORRECT: Use spacing scale
const styles = (theme: Theme) => StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,      // 16px
    paddingVertical: theme.spacing.md,        // 12px
    marginBottom: theme.spacing.xl,           // 24px
  },
});
```

**DON'T:**
```typescript
// ❌ WRONG: Arbitrary numbers
const bad = StyleSheet.create({
  container: {
    paddingHorizontal: 15,    // Use theme.spacing.lg
    paddingVertical: 11,      // Use theme.spacing.md
    marginBottom: 23,         // Use theme.spacing.xl
  },
});

// ❌ WRONG: Mixing scales
const worse = StyleSheet.create({
  container: {
    padding: 16,         // OK
    margin: 20,          // Not aligned with scale
    gap: 7,              // Not aligned with scale
  },
});
```

### Typography Usage Rules

**DO:**
```typescript
// ✅ CORRECT: Use typography scale
const styles = (theme: Theme) => StyleSheet.create({
  headline: {
    fontSize: theme.typography.headline.large.size,
    fontWeight: theme.typography.headline.large.weight,
  },
  
  bodyText: {
    fontSize: theme.typography.body.medium.size,
    fontWeight: theme.typography.body.medium.weight,
  },
});
```

**DON'T:**
```typescript
// ❌ WRONG: Hardcoded font sizes
const bad = StyleSheet.create({
  headline: {
    fontSize: 28,        // Use theme
    fontWeight: '700',   // Use theme
  },
  bodyText: {
    fontSize: 14,        // Use theme
    fontWeight: '400',   // Use theme
  },
});
```

---

## Performance Guidelines

### Memoization

**DO:**
```typescript
// ✅ CORRECT: Memoize expensive components
const HeavyComponent = React.memo(({ data }: Props) => {
  return <View>{/* Complex rendering */}</View>;
});

// ✅ CORRECT: Memoize callbacks
const handlePress = useCallback(() => {
  // Expensive operation
}, [dependency]);
```

**DON'T:**
```typescript
// ❌ WRONG: Recreate functions on every render
const Component = ({ onPress }: Props) => {
  // This creates new function every render!
  const handlePress = () => {
    onPress();
  };
  
  return <Button onPress={handlePress} />;
};
```

### List Rendering

**DO:**
```typescript
// ✅ CORRECT: Use FlatList with keyExtractor
<FlatList
  data={items}
  renderItem={({ item }) => <ListItem item={item} />}
  keyExtractor={(item) => item.id}
/>
```

**DON'T:**
```typescript
// ❌ WRONG: Map with array indices
{items.map((item, index) => (
  <ListItem key={index} item={item} />  // Bad key!
))}

// ❌ WRONG: ScrollView for large lists
<ScrollView>
  {items.map(item => (
    <ListItem key={item.id} item={item} />  // Won't virtualize
  ))}
</ScrollView>
```

### Computed Values

**DO:**
```typescript
// ✅ CORRECT: UseMemo for computed values
const total = useMemo(() => {
  return items.reduce((sum, item) => sum + item.value, 0);
}, [items]);
```

**DON'T:**
```typescript
// ❌ WRONG: Recalculate on every render
const total = items.reduce((sum, item) => sum + item.value, 0);
```

---

## Testing Standards

### Test File Naming

```typescript
// ✅ DO: Test files same location as component
AppButton.tsx
AppButton.test.tsx

// ❌ DON'T: Separate test folders
AppButton.tsx
tests/AppButton.test.tsx
```

### Test Structure

```typescript
// ✅ CORRECT: Organized test structure
describe('AppButton', () => {
  // Setup
  const defaultProps: AppButtonProps = {
    title: 'Press me',
    onPress: jest.fn(),
  };

  // Group related tests
  describe('rendering', () => {
    it('renders with title', () => {
      const { getByText } = render(
        <AppButton {...defaultProps} />
      );
      expect(getByText('Press me')).toBeTruthy();
    });

    it('renders with variant styles', () => {
      // Test variant styles
    });
  });

  // Group interactions
  describe('interactions', () => {
    it('calls onPress when pressed', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <AppButton {...defaultProps} onPress={onPress} testID="btn" />
      );
      fireEvent.press(getByTestId('btn'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  // Group states
  describe('states', () => {
    it('disables button when loading', () => {
      // Test disabled state
    });
  });
});
```

### Minimum Test Coverage

**Global Components:** 70%+ coverage
**Shared Components:** 60%+ coverage
**Screen Components:** 40%+ coverage

```bash
# Run coverage report
npm test -- --coverage

# Coverage targets
Lines:       60%
Statements:  60%
Functions:   50%
Branches:    40%
```

---

## Error Handling

### Error Boundaries

**DO:**
```typescript
// ✅ CORRECT: Use error boundaries
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorScreen />;
    }

    return this.props.children;
  }
}
```

**DON'T:**
```typescript
// ❌ WRONG: Let errors crash app
const Component = ({ data }: Props) => {
  // If data is undefined, this crashes!
  return <Text>{data.name}</Text>;
};
```

### API Error Handling

**DO:**
```typescript
// ✅ CORRECT: Handle API errors
const fetchLeads = async () => {
  try {
    const response = await api.get('/leads');
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 401) {
        // Handle unauthorized
      } else if (error.response?.status === 500) {
        // Handle server error
      }
    }
    throw error;  // Re-throw for higher-level handling
  }
};
```

**DON'T:**
```typescript
// ❌ WRONG: Silently ignore errors
const fetchLeads = async () => {
  try {
    const response = await api.get('/leads');
    return response.data;
  } catch (error) {
    // Error silently ignored!
    return [];
  }
};

// ❌ WRONG: Generic error messages
.catch(error => {
  alert('Error occurred');  // Not helpful!
});
```

---

## Accessibility

### Accessibility Props

**DO:**
```typescript
// ✅ CORRECT: Include accessibility
<Pressable
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Save form"
  accessibilityHint="Double tap to submit the form"
  testID="save-button"
>
  <Text>Save</Text>
</Pressable>
```

**DON'T:**
```typescript
// ❌ WRONG: Missing accessibility
<Pressable onPress={handleSave}>
  <Text>Save</Text>
</Pressable>
```

### Color Contrast

**DO:**
```typescript
// ✅ CORRECT: Sufficient contrast
// Text: #111827 on #FFFFFF = 14.0:1 ratio ✓
// Text: #6B7280 on #FFFFFF = 7.5:1 ratio ✓

const styles = StyleSheet.create({
  text: {
    color: theme.colors.text.primary,          // Good contrast
    backgroundColor: theme.colors.surface,
  },
});
```

**DON'T:**
```typescript
// ❌ WRONG: Insufficient contrast
const bad = StyleSheet.create({
  text: {
    color: '#cccccc',           // Too light on white
    backgroundColor: '#ffffff',
  },
});
```

### Touch Targets

**DO:**
```typescript
// ✅ CORRECT: Minimum 44x44 touch targets
const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 44,
    padding: 12,  // Ensures minimum size
  },
});
```

**DON'T:**
```typescript
// ❌ WRONG: Too small touch targets
const bad = StyleSheet.create({
  button: {
    width: 30,    // Too small for thumb
    height: 30,
    padding: 4,
  },
});
```

---

## State Management

### Zustand Store Usage

**DO:**
```typescript
// ✅ CORRECT: Organized store
import { create } from 'zustand';

export const useLeadStore = create<LeadState>((set) => ({
  // State
  leads: [],
  selectedLead: null,

  // Actions
  setLeads: (leads: Lead[]) => set({ leads }),
  selectLead: (lead: Lead) => set({ selectedLead: lead }),

  // Computed (if needed)
  leadCount: () => get().leads.length,
}));

// Usage in component
const Component = () => {
  const leads = useLeadStore((state) => state.leads);
  const setLeads = useLeadStore((state) => state.setLeads);
};
```

**DON'T:**
```typescript
// ❌ WRONG: Store everything in component state
const Component = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  // ... 10 more states
};
```

### Local vs Global State

**Use Zustand For:**
- ✓ Cross-screen data (user, auth)
- ✓ Complex shared state (leads, tickets)
- ✓ Persistent data
- ✓ Frequent updates

**Use Local State For:**
- ✓ Form input values
- ✓ UI toggles (modal open/close)
- ✓ Temporary UI state
- ✓ Single-screen data

---

## Code Review Checklist

### Before Committing

- [ ] **Code Quality**
  - [ ] No console.log() left in code
  - [ ] No commented-out code
  - [ ] Consistent formatting
  - [ ] No unused imports

- [ ] **TypeScript**
  - [ ] No `any` types
  - [ ] All props typed
  - [ ] No implicit `any`
  - [ ] Return types explicit

- [ ] **Naming**
  - [ ] Components PascalCase
  - [ ] Functions camelCase
  - [ ] Constants UPPER_SNAKE_CASE
  - [ ] Props interfaces use ComponentProps pattern

- [ ] **Testing**
  - [ ] New components have tests
  - [ ] Tests pass locally
  - [ ] Coverage maintained
  - [ ] Edge cases covered

- [ ] **Performance**
  - [ ] No unnecessary re-renders
  - [ ] useCallback for callbacks
  - [ ] useMemo for computed values
  - [ ] No N+1 queries

- [ ] **Design System**
  - [ ] Using theme colors
  - [ ] Using theme spacing
  - [ ] No hardcoded values
  - [ ] Dark mode works

- [ ] **Accessibility**
  - [ ] Interactive elements have labels
  - [ ] testID on elements
  - [ ] Color contrast sufficient
  - [ ] Touch targets 44x44+

- [ ] **Documentation**
  - [ ] JSDoc comments on public APIs
  - [ ] Complex logic documented
  - [ ] README.md updated if needed
  - [ ] Examples provided

### During Code Review

**Questions to Ask:**

1. **Architecture**
   - [ ] Is this component in the right location?
   - [ ] Could this be reused elsewhere?
   - [ ] Does it follow guidelines?

2. **Type Safety**
   - [ ] Are all inputs typed?
   - [ ] Are error cases handled?
   - [ ] Is the API clear?

3. **Performance**
   - [ ] Could this cause re-renders?
   - [ ] Are effects dependencies correct?
   - [ ] Is state management appropriate?

4. **Testing**
   - [ ] Are edge cases tested?
   - [ ] Are errors handled?
   - [ ] Is coverage sufficient?

5. **Accessibility**
   - [ ] Is this accessible to screen readers?
   - [ ] Are colors sufficient contrast?
   - [ ] Are touch targets large enough?

---

## Git Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

```
feat:    New feature
fix:     Bug fix
refactor: Code refactoring
style:   Code style (formatting, semi-colons, etc.)
docs:    Documentation
test:    Test updates
chore:   Build, dependencies
perf:    Performance improvements
```

### Examples

```
✓ feat(components): add AppButton component
✓ fix(dashboard): remove duplicate state update
✓ refactor(leads): extract LeadCard component
✓ docs(migration): add week 1 instructions
✗ Updated button component
✗ Fixed stuff
✗ changes
```

---

## Code Comments

### Good Comments

**DO:**
```typescript
// ✅ GOOD: Explains WHY, not WHAT
// We use useState instead of zustand here because this is temporary
// form state that doesn't need to persist across screens
const [formData, setFormData] = useState(initialState);

// ✅ GOOD: Documents non-obvious logic
// Filter leads by last contact date; exclude soft-deleted leads
const activeLead = leads.filter(
  lead => lead.isDeleted === false && lead.lastContact > cutoffDate
);
```

### Bad Comments

**DON'T:**
```typescript
// ❌ BAD: Obvious from code
// Set formData state
setFormData(data);

// ❌ BAD: Outdated comment
// TODO: Fix this when backend is ready (commit from 2024)
const workaround = data.filter(x => x);

// ❌ BAD: Commented code
// const oldWay = leads.map(...);
// setLeads(oldWay);
```

---

## Quick Reference

### File Locations

```
Global Component:
src/components/global/Button/Button.tsx

Shared Component:
src/components/shared/leads/LeadCard.tsx

Module Component:
src/modules/dashboard/Dashboard.tsx

Screen:
src/screens/DashboardScreen.tsx

Store:
src/store/useLeadStore.ts

Service:
src/services/api.ts

Utility:
src/utils/formatters.ts

Hook:
src/hooks/useDebounce.ts
```

### Component Template

```typescript
// ✅ Correct structure
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';

interface ComponentProps {
  title: string;
  onPress: () => void;
}

export const MyComponent: React.FC<ComponentProps> = ({
  title,
  onPress,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {/* JSX */}
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
    },
  });

export default MyComponent;
```

### Import Pattern

```typescript
// ✅ Organized imports
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@react-navigation/native';

// Types
import type { Lead } from '@types/lead';

// Components
import { AppButton, AppCard } from '@components/global';
import { LeadCard } from '@components/shared/leads';

// Hooks
import { useAsync } from '@hooks/useAsync';

// Services
import { leadService } from '@services/api';

// Utils
import { formatDate } from '@utils/formatters';

// Stores
import { useLeadStore } from '@store/useLeadStore';
```

---

## Training & Onboarding

### For New Team Members

1. **Day 1: Read Documentation**
   - [ ] ARCHITECTURE_AUDIT.md
   - [ ] DESIGN_SYSTEM.md
   - [ ] COMPONENT_GUIDELINES.md
   - [ ] BEST_PRACTICES.md (this document)

2. **Day 2: Explore Codebase**
   - [ ] Review `src/components/global/` structure
   - [ ] Review `src/components/shared/` structure
   - [ ] Examine existing components
   - [ ] Read theme.ts

3. **Day 3: Create First Component**
   - [ ] Follow COMPONENT_GUIDELINES.md
   - [ ] Get code review from senior dev
   - [ ] Iterate based on feedback

4. **Ongoing:**
   - [ ] Weekly design system reviews
   - [ ] Participate in code reviews
   - [ ] Ask questions when unsure

---

## Continuous Improvement

### Monthly Review

- [ ] Review new components
- [ ] Check for hardcoded values
- [ ] Verify design system usage
- [ ] Gather team feedback
- [ ] Update guidelines as needed

### Quarterly Goals

- [ ] Maintain 60%+ test coverage
- [ ] Keep design system up-to-date
- [ ] Train new team members
- [ ] Address technical debt
- [ ] Performance optimization

---

## Final Notes

These guidelines are **living documents**. As the team grows and the codebase evolves, update these standards accordingly.

**Remember:**
- Code is read 10x more than it's written
- Consistency matters more than personal preference
- Documentation is part of the code
- Accessibility benefits everyone
- Performance enables features

---

**Questions?** Create an issue or ask the team lead.

**Ready to code?** Follow these standards and build amazing components! 🚀
