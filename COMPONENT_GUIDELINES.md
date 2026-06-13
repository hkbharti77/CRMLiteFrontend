# CRMLite Frontend - Component Creation Guidelines

**Last Updated:** 2026-06-13  
**Status:** Ready for Implementation  
**Scope:** Global, Shared, and Module-Specific Components

---

## Table of Contents

1. [Component Hierarchy](#component-hierarchy)
2. [Component Creation Checklist](#component-creation-checklist)
3. [File Structure Template](#file-structure-template)
4. [Required Props Pattern](#required-props-pattern)
5. [Styling Conventions](#styling-conventions)
6. [TypeScript Requirements](#typescript-requirements)
7. [Export Patterns](#export-patterns)
8. [Testing Requirements](#testing-requirements)
9. [Documentation Template](#documentation-template)
10. [Common Pitfalls](#common-pitfalls)

---

## Component Hierarchy

### Three Component Categories

```
┌─────────────────────────────────────────────────────────────┐
│                   GLOBAL COMPONENTS                         │
│  Reusable across entire application (15+ components)        │
│  Location: src/components/global/                           │
│  Imports: Used in any screen, shared, or module component   │
│  Example: AppButton, StatusBadge, EmptyState               │
└─────────────────────────────────────────────────────────────┘
                             ↑
              ┌──────────────┴──────────────┐
              ↓                             ↓
   ┌──────────────────────┐      ┌──────────────────────┐
   │ SHARED COMPONENTS    │      │ MODULE COMPONENTS    │
   │ Feature-specific UI  │      │ Single-use only      │
   │ Location: shared/    │      │ Location: modules/   │
   │ Example: LeadCard    │      │ Example: Dashboard   │
   │ Used by: Multiple    │      │ Settings Header      │
   │ screens in a module  │      │ Used by: One screen  │
   └──────────────────────┘      └──────────────────────┘
```

---

## Component Creation Checklist

### Before Creating a Component

- [ ] **Reusability Check** — Will this component be used in 2+ places?
  - Yes → Create as Global or Shared
  - No → Keep inline or create as Module-specific

- [ ] **Scope Assessment** — What scope does this component belong to?
  - Entire app → Global
  - Single module (leads, tickets, chat) → Shared
  - Single screen → Module-specific (inline)

- [ ] **Theme Integration** — Can this use design tokens?
  - [ ] Colors from `theme.colors.*`
  - [ ] Spacing from `theme.spacing.*`
  - [ ] Typography from `theme.typography.*`
  - [ ] Shadows from `theme.shadows.*`
  - [ ] Radius from `theme.borderRadius.*`

- [ ] **Variant Analysis** — Does this need variants?
  - [ ] Size variants (small, medium, large)
  - [ ] Color variants (primary, secondary, danger)
  - [ ] State variants (normal, loading, disabled, error)
  - [ ] Style variants (filled, outlined, ghost, text)

- [ ] **Accessibility** — Will this meet accessibility requirements?
  - [ ] Accessible labels (aria-label or label text)
  - [ ] Touch target size (min 44x44 on mobile)
  - [ ] Color contrast (WCAG AA minimum)
  - [ ] Keyboard navigation (if interactive)

- [ ] **TypeScript** — Is the component properly typed?
  - [ ] All props typed with interfaces
  - [ ] Return type explicitly defined
  - [ ] Children type specified (if applicable)
  - [ ] No `any` types used

- [ ] **Documentation** — Is the component documented?
  - [ ] JSDoc comments on component
  - [ ] Prop descriptions
  - [ ] Usage example
  - [ ] Variant examples

---

## File Structure Template

### Global Component Template

```
src/components/global/ComponentName/
├── ComponentName.tsx                  # Main component
├── ComponentName.types.ts             # TypeScript interfaces (if large)
├── styles.ts                          # StyleSheet definitions
├── hooks.ts                           # Custom hooks (if needed)
├── README.md                          # Component documentation
└── __tests__/                         # Tests (optional)
    ├── ComponentName.test.tsx
    └── ComponentName.snapshot.tsx
```

### Shared Component Template

```
src/components/shared/moduleName/
├── ComponentName.tsx
├── ComponentName.types.ts             # If types are shared
├── styles.ts
├── README.md                          # Usage documentation
└── __tests__/                         # Optional
    └── ComponentName.test.tsx
```

### Module-Specific Template

Keep inline in screen file or create thin wrapper:

```typescript
// Inside screen file or src/modules/featureName/components/
const LocalComponent: React.FC<Props> = ({ /* props */ }) => {
  // Component logic
};
```

---

## Required Props Pattern

### All Components Must Export Props Interface

```typescript
// ✅ CORRECT: Explicit props interface
interface AppButtonProps {
  // Required props
  title: string;
  onPress: () => void;
  
  // Optional props with defaults
  variant?: 'primary' | 'secondary' | 'outlined';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  
  // Style overrides
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  
  // Content overrides
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  
  // Accessibility
  accessibilityLabel?: string;
  testID?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  accessibilityLabel,
  testID,
}) => {
  // Implementation
};
```

### Props Guidelines

**DO:**
- ✅ Use explicit prop interfaces (type checking)
- ✅ Provide defaults for optional props
- ✅ Include `style` override prop for flexibility
- ✅ Include `testID` for testing
- ✅ Include `accessibilityLabel` for a11y
- ✅ Group related props together
- ✅ Use union types for variants (`'primary' | 'secondary'`)

**DON'T:**
- ❌ Spread props without typing
- ❌ Use `...restProps` without documenting what's passed
- ❌ Create components with 20+ props (break into smaller components)
- ❌ Use `any` type for props
- ❌ Accept conflicting props without resolution logic
- ❌ Make required props that could have sensible defaults

---

## Styling Conventions

### Use Theme Tokens

```typescript
// ✅ CORRECT: Using theme tokens
import { useTheme } from '@react-navigation/native';

const styles = StyleSheet.create({
  container: {
    padding: 16,                      // Use spacing tokens
    backgroundColor: '#FFFFFF',       // Use theme colors
    borderRadius: 8,                  // Use borderRadius tokens
  },
});

const Component = () => {
  const theme = useTheme();
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: theme.colors.primary }
    ]} />
  );
};
```

### StyleSheet Organization

```typescript
// ✅ CORRECT: Organized StyleSheet
import { StyleSheet } from 'react-native';

interface StylesProps {
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export const createStyles = (theme: Theme, props?: StylesProps) =>
  StyleSheet.create({
    // Container styles
    container: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    
    // Variant styles
    containerPrimary: {
      backgroundColor: theme.colors.primary,
    },
    containerSecondary: {
      backgroundColor: theme.colors.secondary,
    },
    
    // State styles
    containerDisabled: {
      opacity: 0.5,
    },
    
    // Text styles
    text: {
      fontSize: 14,
      fontWeight: '600',
    },
    
    // Icon styles
    icon: {
      marginRight: 8,
    },
  });
```

### Theme Token Usage Matrix

| Property | Token Source | Example |
|----------|--------------|---------|
| `backgroundColor` | `theme.colors.*` | `theme.colors.primary` |
| `color` (text) | `theme.colors.text.*` | `theme.colors.text.primary` |
| `padding` | `theme.spacing.*` | `theme.spacing.md` |
| `margin` | `theme.spacing.*` | `theme.spacing.lg` |
| `borderRadius` | `theme.borderRadius.*` | `theme.borderRadius.md` |
| `shadowColor` | `theme.shadows.*` | `theme.shadows.md` |
| `fontSize` | `theme.typography.*.size` | `theme.typography.body.medium.size` |
| `fontWeight` | `theme.typography.*.weight` | `theme.typography.body.medium.weight` |

---

## TypeScript Requirements

### Component Typing Rules

```typescript
// ✅ CORRECT: Full typing
import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';

interface MyComponentProps {
  title: string;
  onPress: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  onPress,
  children,
  style,
}) => {
  return (
    <View style={style}>
      {/* Component content */}
    </View>
  );
};
```

### Do NOT

```typescript
// ❌ WRONG: No prop typing
const MyComponent = (props) => { /* ... */ };

// ❌ WRONG: Using 'any'
const MyComponent = (props: any): any => { /* ... */ };

// ❌ WRONG: Incomplete typing
const MyComponent: React.FC = ({ title }: any) => { /* ... */ };

// ❌ WRONG: Spreading without typing
const MyComponent: React.FC<Props> = (props) => (
  <View {...props} />  // Loses type safety!
);
```

### Generic Components

```typescript
// ✅ CORRECT: Generic component typing
interface ListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onItemPress?: (item: T) => void;
}

export const List = <T,>({
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

## Export Patterns

### Barrel Exports for Organization

```typescript
// src/components/global/index.ts
export { AppButton, type AppButtonProps } from './Button/AppButton';
export { AppInput, type AppInputProps } from './Input/AppInput';
export { AppCard, type AppCardProps } from './Card/AppCard';
export { StatusBadge, type StatusBadgeProps } from './Badge/StatusBadge';
export { EmptyState, type EmptyStateProps } from './EmptyState/EmptyState';
// ... more exports

// Usage: Cleaner imports
import { AppButton, AppInput, AppCard } from 'src/components/global';
```

### Named + Default Exports

```typescript
// ✅ CORRECT: Support both import styles
export const AppButton: React.FC<AppButtonProps> = (props) => { /* ... */ };
export default AppButton;  // Allow both import styles

// Supports both:
// import { AppButton } from 'src/components/global/Button';
// import AppButton from 'src/components/global/Button';
```

---

## Testing Requirements

### Minimum Test Coverage

For Global and Shared components:
- ✅ Component renders without crashing
- ✅ Props are applied correctly
- ✅ Callbacks are triggered appropriately
- ✅ Different variants display correctly
- ✅ Disabled state works
- ✅ Accessibility props are present

### Test Template

```typescript
// src/components/global/Button/__tests__/AppButton.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AppButton, AppButtonProps } from '../AppButton';

describe('AppButton', () => {
  const defaultProps: AppButtonProps = {
    title: 'Press me',
    onPress: jest.fn(),
  };

  it('renders without crashing', () => {
    render(<AppButton {...defaultProps} />);
    expect(screen.getByText('Press me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <AppButton {...defaultProps} onPress={onPress} testID="button" />
    );
    
    fireEvent.press(getByTestId('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disables button when loading', () => {
    const { getByTestId } = render(
      <AppButton {...defaultProps} loading={true} testID="button" />
    );
    
    expect(getByTestId('button')).toHaveStyle({ opacity: 0.5 });
  });

  it('applies variant styles correctly', () => {
    const { getByTestId } = render(
      <AppButton {...defaultProps} variant="secondary" testID="button" />
    );
    
    // Assert variant-specific styles are applied
  });

  it('has accessibility label', () => {
    render(
      <AppButton
        {...defaultProps}
        accessibilityLabel="Submit form"
        testID="button"
      />
    );
    
    expect(screen.getByA11yLabel('Submit form')).toBeTruthy();
  });
});
```

---

## Documentation Template

### Component README.md

```markdown
# ComponentName

Brief description of what this component does.

## Usage

\`\`\`typescript
import { ComponentName } from 'src/components/global';

export const Example = () => (
  <ComponentName
    prop1="value"
    prop2="value"
    onPress={() => console.log('pressed')}
  />
);
\`\`\`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `prop1` | `string` | Yes | — | Description |
| `prop2` | `string` | No | `'default'` | Description |
| `onPress` | `() => void` | Yes | — | Callback when pressed |

## Variants

### Size Variants

- **small** — Compact variant for small spaces
- **medium** — Default variant (recommended)
- **large** — Prominent variant for important actions

### Color Variants

- **primary** — Primary brand color
- **secondary** — Secondary brand color
- **danger** — Destructive/warning actions

## Accessibility

- Supports `accessibilityLabel` for screen readers
- Minimum touch target: 44x44px
- Color contrast: WCAG AA compliant
- Keyboard navigable

## Examples

### Primary Button

\`\`\`typescript
<ComponentName variant="primary" title="Save" onPress={handleSave} />
\`\`\`

### Loading State

\`\`\`typescript
<ComponentName loading={true} disabled={true} />
\`\`\`

### Custom Styling

\`\`\`typescript
<ComponentName style={{ borderRadius: 20 }} />
\`\`\`

## Related Components

- [OtherComponent](../OtherComponent)
- [ParentComponent](../ParentComponent)
```

---

## Common Pitfalls

### ❌ Problem: Hardcoded Values

```typescript
// ❌ WRONG
const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0F766E',      // Hardcoded color
    padding: 16,                      // Hardcoded padding
    borderRadius: 8,                  // Hardcoded radius
  },
});
```

**✅ Solution: Use Theme Tokens**

```typescript
// ✅ CORRECT
const styles = (theme: Theme) => StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
});
```

---

### ❌ Problem: Too Many Props

```typescript
// ❌ WRONG: 15+ props in single component
interface ButtonProps {
  title: string;
  onPress: () => void;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  fontWeight: 'bold' | 'normal';
  padding: number;
  margin: number;
  borderRadius: number;
  // ... 7 more props
}
```

**✅ Solution: Use Variants**

```typescript
// ✅ CORRECT: Use variants instead
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
}
```

---

### ❌ Problem: No Prop Typing

```typescript
// ❌ WRONG
export const Component = (props) => {
  return <View>{props.children}</View>;
};
```

**✅ Solution: Explicit Types**

```typescript
// ✅ CORRECT
interface ComponentProps {
  children: React.ReactNode;
}

export const Component: React.FC<ComponentProps> = ({ children }) => {
  return <View>{children}</View>;
};
```

---

### ❌ Problem: Inconsistent Naming

```typescript
// ❌ WRONG: Inconsistent naming patterns
export const button = () => { /* ... */ };       // lowercase
export const InputField = () => { /* ... */ };   // PascalCase
export const card_component = () => { /* ... */ }; // snake_case
```

**✅ Solution: Consistent PascalCase**

```typescript
// ✅ CORRECT: All PascalCase
export const AppButton = () => { /* ... */ };
export const AppInput = () => { /* ... */ };
export const AppCard = () => { /* ... */ };
```

---

### ❌ Problem: Missing Accessibility

```typescript
// ❌ WRONG: No accessibility
<Pressable onPress={handlePress}>
  <Text>Click me</Text>
</Pressable>
```

**✅ Solution: Add Accessibility Props**

```typescript
// ✅ CORRECT: Accessible
<Pressable
  onPress={handlePress}
  accessible={true}
  accessibilityLabel="Submit form"
  accessibilityRole="button"
  accessibilityHint="Double tap to submit"
>
  <Text>Click me</Text>
</Pressable>
```

---

### ❌ Problem: Not Handling Dark Mode

```typescript
// ❌ WRONG: Hardcoded colors only
const styles = StyleSheet.create({
  text: {
    color: '#111827',  // Only works in light mode
  },
});
```

**✅ Solution: Use Theme Colors**

```typescript
// ✅ CORRECT: Respects light/dark mode
const Component = () => {
  const theme = useTheme();
  
  return (
    <Text style={{ color: theme.colors.text.primary }}>
      This text adapts to light/dark mode
    </Text>
  );
};
```

---

### ❌ Problem: Circular Dependencies

```typescript
// ❌ WRONG: Component A imports B, B imports A
// src/components/global/Button/AppButton.tsx
import { AppCard } from '../Card/AppCard';

// src/components/global/Card/AppCard.tsx
import { AppButton } from '../Button/AppButton';
```

**✅ Solution: Use Shared Parent or Types File**

```typescript
// ✅ CORRECT: Shared types file
// src/components/global/types.ts
export interface BaseComponentProps {
  style?: StyleProp<ViewStyle>;
}

// Both components import from types.ts, not each other
```

---

### ❌ Problem: Forgetting testID

```typescript
// ❌ WRONG: Can't test the component easily
<Pressable onPress={handlePress}>
  <Text>Submit</Text>
</Pressable>
```

**✅ Solution: Include testID**

```typescript
// ✅ CORRECT: Easy to test
<Pressable onPress={handlePress} testID="submit-button">
  <Text>Submit</Text>
</Pressable>
```

---

## Next Steps

1. **Review this document** with your team
2. **Establish standards** using these guidelines
3. **Create global components** following the template
4. **Add to component library** as they're completed
5. **Document each component** with the provided template
6. **Write tests** to ensure quality

---

## Quick Reference Checklist

Every component should have:

- [ ] Props interface with TypeScript types
- [ ] Default values for optional props
- [ ] JSDoc comments explaining usage
- [ ] Accessibility props (accessibilityLabel, testID)
- [ ] Style override support (style prop)
- [ ] Theme token usage (no hardcoded values)
- [ ] README.md documentation
- [ ] Test file with basic coverage
- [ ] Named + default export
- [ ] Barrel export in index.ts

---

**Questions?** Refer to the ARCHITECTURE_AUDIT.md or DESIGN_SYSTEM.md for more context.
