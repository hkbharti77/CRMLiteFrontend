# CRMLite Frontend - Design System Documentation

**Last Updated:** 2026-06-13  
**Status:** Ready for Implementation  
**Scope:** Complete Design Token Reference

---

## Table of Contents

1. [Design System Overview](#design-system-overview)
2. [Color System](#color-system)
3. [Typography System](#typography-system)
4. [Spacing System](#spacing-system)
5. [Border Radius](#border-radius)
6. [Shadows & Elevation](#shadows--elevation)
7. [Component States](#component-states)
8. [Light & Dark Mode](#light--dark-mode)
9. [Implementation Guide](#implementation-guide)
10. [Token Usage Examples](#token-usage-examples)

---

## Design System Overview

CRMLite uses a comprehensive design system based on **Material Design 3** principles with custom enhancements for the CRM domain.

### Design Principles

1. **Consistency** — All UI components follow unified design language
2. **Accessibility** — WCAG AA compliance with semantic color usage
3. **Scalability** — Organized token system that grows with the app
4. **Flexibility** — Components support variants and customization
5. **Clarity** — Clear visual hierarchy and information structure

### Design System Structure

```
Design Tokens
├── Colors (semantic + component)
├── Typography (type scale)
├── Spacing (distance scale)
├── Border Radius (rounding scale)
├── Shadows (elevation system)
└── Effects (animations, transitions)
```

---

## Color System

### Color Palette Overview

The CRMLite color system consists of:
- **Primary Brand Colors** — Main interaction elements
- **Secondary Colors** — Alternative/secondary actions
- **Semantic Colors** — Success, warning, error, info
- **Neutral Colors** — Text, backgrounds, dividers
- **Status Colors** — Lead, ticket, and booking statuses

### Primary Brand Colors

**Teal Color Family** (Primary Brand Color)

```
┌─────────────────────────────────────────┐
│ #0F766E (Deep Teal)                     │ Primary actions, text links
│ PRIMARY / BRAND COLOR                   │ Hover states on secondary
│ Used for: CTA buttons, highlights       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ #14B8A6 (Bright Teal)                   │ Interactive states
│ HOVER / ACTIVE STATE                    │ Alternative primary action
│ Used for: Hover effects, active states  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ #CCFBF1 (Very Light Teal)               │ Backgrounds
│ BACKGROUND / TINT                       │ Highlighted content areas
│ Used for: Information boxes, badges     │
└─────────────────────────────────────────┘
```

### Secondary Brand Colors

**Blue Color Family** (Secondary Brand Color)

```
┌─────────────────────────────────────────┐
│ #1E3A8A (Deep Blue)                     │ Secondary buttons, links
│ SECONDARY / DARK                        │ Emphasis on secondary content
│ Used for: Secondary CTAs                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ #3B82F6 (Bright Blue)                   │ Interactive elements
│ SECONDARY / MEDIUM                      │ Information highlights
│ Used for: Hover states, active indicators
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ #60A5FA (Light Blue)                    │ Backgrounds
│ SECONDARY / LIGHT                       │ Subtle highlighting
│ Used for: Background tints, light cards │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ #DBEAFE (Very Light Blue)               │ Tinted backgrounds
│ SECONDARY / VERY LIGHT                  │ Accessible highlighting
│ Used for: Information boxes             │
└─────────────────────────────────────────┘
```

### Semantic Colors

**Status & Feedback Colors** — Universal meaning across CRM

```
Success Status
├─ #10B981 (Emerald 500)     — Active leads, completed tickets
├─ #D1FAE5 (Emerald 100)     — Success backgrounds, light states
└─ #047857 (Emerald 800)     — Success text, dark states

Warning Status
├─ #F59E0B (Amber 500)       — Pending leads, in-progress tickets
├─ #FEF3C7 (Amber 100)       — Warning backgrounds, light states
└─ #92400E (Amber 900)       — Warning text, dark states

Error Status
├─ #EF4444 (Red 500)         — Inactive leads, closed tickets
├─ #FEE2E2 (Red 100)         — Error backgrounds, light states
└─ #7F1D1D (Red 900)         — Error text, dark states

Info Status
├─ #3B82F6 (Blue 500)        — Information, special markers
├─ #DBEAFE (Blue 100)        — Info backgrounds, light states
└─ #1E40AF (Blue 900)        — Info text, dark states
```

### Neutral Colors

**Grays** — Text, backgrounds, dividers

```
Surface/White
│ #FFFFFF                    — White background, cards, surface

Primary Background
│ #F9FAFB                    — Main page background

Secondary Background
│ #F3F4F6                    — Section backgrounds, slight contrast

Tertiary Background
│ #E5E7EB                    — Elevated backgrounds, cards

Primary Text
│ #111827                    — Body text, headlines

Secondary Text
│ #6B7280                    — Descriptions, metadata

Tertiary Text (Muted)
│ #9CA3AF                    — Disabled text, hints

Border Color
│ #E5E7EB                    — Dividers, borders

Light Border
│ #F3F4F6                    — Subtle dividers
```

### Status-Specific Colors

**Lead Status Colors**

```
Active      → #10B981 (Green)     — Ready for follow-up
Pending     → #F59E0B (Amber)     — Awaiting response
Inactive    → #9CA3AF (Gray)      — No activity
Qualified   → #3B82F6 (Blue)      — Ready for closing
```

**Ticket Status Colors**

```
Open        → #EF4444 (Red)       — Requires attention
In Progress → #F59E0B (Amber)     — Being worked on
Closed      → #10B981 (Green)     — Resolved
On Hold     → #9CA3AF (Gray)      — Temporarily paused
```

**Booking Status Colors**

```
Scheduled   → #3B82F6 (Blue)      — Confirmed appointment
Pending     → #F59E0B (Amber)     — Awaiting confirmation
Completed   → #10B981 (Green)     — Finished
Cancelled   → #EF4444 (Red)       — Not happening
```

### Using Colors in Code

```typescript
// ✅ CORRECT: Import and use theme colors
import { useTheme } from '@react-navigation/native';

const Component = () => {
  const theme = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.primary }}>
      <Text style={{ color: theme.colors.text.primary }}>Active</Text>
      <Text style={{ color: theme.colors.text.secondary }}>Secondary text</Text>
    </View>
  );
};

// ✅ CORRECT: Use semantic status colors
const StatusBadge = ({ status }: { status: 'active' | 'pending' | 'inactive' }) => {
  const statusColors = {
    active: '#10B981',
    pending: '#F59E0B',
    inactive: '#9CA3AF',
  };
  
  return (
    <View style={{ backgroundColor: statusColors[status] }}>
      <Text>{status}</Text>
    </View>
  );
};
```

---

## Typography System

### Type Scale

CRMLite uses a **12-level typography scale** based on Material Design 3 specifications.

### Font Family

```
Default Font Stack
├─ Platform: 'System' (native iOS/Android font)
├─ Web: 'Segoe UI', 'Roboto', 'Oxygen', sans-serif
└─ Fallback: System UI sans-serif
```

### Typography Scale Breakdown

#### Display Sizes (Headings for emphasis)

```
Display Large
├─ Size: 48px (Desktop), 36px (Mobile)
├─ Weight: 700 (Bold)
├─ Line Height: 56px
├─ Letter Spacing: 0px
├─ Use: Page titles, major headers
└─ Example: "Dashboard", "Leads Management"

Display Medium
├─ Size: 40px (Desktop), 32px (Mobile)
├─ Weight: 700 (Bold)
├─ Line Height: 48px
├─ Letter Spacing: 0px
├─ Use: Section titles, dialog headers
└─ Example: "Q3 Sales Report"

Display Small
├─ Size: 32px (Desktop), 28px (Mobile)
├─ Weight: 700 (Bold)
├─ Line Height: 40px
├─ Letter Spacing: 0px
├─ Use: Subsection titles
└─ Example: "Active Leads"
```

#### Headline Sizes (Primary content headings)

```
Headline Large
├─ Size: 28px
├─ Weight: 700 (Bold)
├─ Line Height: 36px
├─ Use: Card titles, major section headers
└─ Example: "Lead Information"

Headline Medium
├─ Size: 24px
├─ Weight: 700 (Bold)
├─ Line Height: 32px
├─ Use: Section headers, modal titles
└─ Example: "Create New Lead"

Headline Small
├─ Size: 20px
├─ Weight: 600 (Semi-Bold)
├─ Line Height: 28px
├─ Use: Subsection headers
└─ Example: "Contact Details"
```

#### Title Sizes (Section headers)

```
Title Large
├─ Size: 18px
├─ Weight: 600 (Semi-Bold)
├─ Line Height: 24px
├─ Use: List item titles, tab headers
└─ Example: Lead name in list

Title Medium
├─ Size: 16px
├─ Weight: 600 (Semi-Bold)
├─ Line Height: 24px
├─ Use: Card titles, component headers
└─ Example: "Status", "Created Date"

Title Small
├─ Size: 14px
├─ Weight: 600 (Semi-Bold)
├─ Line Height: 20px
├─ Use: Emphasized text, labels
└─ Example: "John Smith"
```

#### Body Text (Main content)

```
Body Large
├─ Size: 16px
├─ Weight: 400 (Regular)
├─ Line Height: 24px
├─ Use: Body text, main content paragraphs
└─ Example: Lead description, comments

Body Medium
├─ Size: 14px
├─ Weight: 400 (Regular)
├─ Line Height: 20px
├─ Use: Regular body text, form text
└─ Example: "No leads found"

Body Small
├─ Size: 13px
├─ Weight: 400 (Regular)
├─ Line Height: 18px
├─ Use: Secondary text, helper text, captions
└─ Example: "Last updated 2 hours ago"
```

#### Label Text (UI labels, buttons, tags)

```
Label Large
├─ Size: 14px
├─ Weight: 600 (Semi-Bold)
├─ Line Height: 20px
├─ Use: Button text, large labels
└─ Example: "Send", "Save", "Delete"

Label Medium
├─ Size: 12px
├─ Weight: 500 (Medium)
├─ Line Height: 16px
├─ Use: Standard labels, tag text
└─ Example: "Active", "Pending"

Label Small
├─ Size: 11px
├─ Weight: 500 (Medium)
├─ Line Height: 16px
├─ Use: Small labels, badges
└─ Example: "NEW", "HOT", "3 replies"
```

### Font Weight Reference

```
100 - Thin              (rarely used)
300 - Light             (light text, secondary)
400 - Regular           (body text, default)
500 - Medium            (labels, semi-emphasis)
600 - Semi-Bold         (headers, emphasis)
700 - Bold              (strong emphasis, headings)
800 - Extra Bold        (very strong emphasis)
900 - Black             (extreme emphasis, rarely used)

Recommended Usage:
├─ 400 (Regular) — Body copy, default text
├─ 500 (Medium) — Labels, small text
├─ 600 (Semi-Bold) — Headers, emphasis
└─ 700 (Bold) — Headlines, titles
```

### Using Typography in Code

```typescript
// ✅ CORRECT: Use theme typography
const styles = (theme: Theme) => StyleSheet.create({
  title: {
    fontSize: theme.typography.headline.large.size,
    fontWeight: theme.typography.headline.large.weight,
    lineHeight: theme.typography.headline.large.lineHeight,
  },
  
  bodyText: {
    fontSize: theme.typography.body.medium.size,
    fontWeight: theme.typography.body.medium.weight,
  },
  
  label: {
    fontSize: theme.typography.label.medium.size,
    fontWeight: theme.typography.label.medium.weight,
  },
});

// Usage
<Text style={styles.title}>My Title</Text>
<Text style={styles.bodyText}>Body text here</Text>
<Text style={styles.label}>Label</Text>
```

---

## Spacing System

### Spacing Scale

CRMLite uses a **6-level spacing scale** for consistent padding and margins.

```
┌────────────────────────────────────────┐
│ xs  →  4px   │ Minimal padding, tiny gaps
├────────────────────────────────────────┤
│ sm  →  8px   │ Small spacing, list items
├────────────────────────────────────────┤
│ md  → 12px   │ Default padding, sections
├────────────────────────────────────────┤
│ lg  → 16px   │ Card padding, large gaps
├────────────────────────────────────────┤
│ xl  → 24px   │ Section spacing, large margins
├────────────────────────────────────────┤
│ xxl → 32px   │ Page-level spacing
├────────────────────────────────────────┤
│ xxxl→ 40px   │ Screen/container margins
└────────────────────────────────────────┘
```

### Spacing Usage Guidelines

```
Component Padding:
├─ xs (4px)   — Icon spacing, minimal padding
├─ sm (8px)   — Small components, inline spacing
├─ md (12px)  — Standard button padding
└─ lg (16px)  — Card padding, large components

Section Spacing:
├─ md (12px)  — Compact spacing between sections
├─ lg (16px)  — Default section spacing
├─ xl (24px)  — Large section spacing
└─ xxl (32px) — Page-level section spacing

Margins:
├─ sm (8px)   — Small gaps between items
├─ md (12px)  — Standard gaps
├─ lg (16px)  — Larger gaps
└─ xl (24px)  — Large gaps, section separation
```

### Spacing Scale Visual Guide

```typescript
// Visual representation of spacing scale

xs: 4px
████ (very tight)

sm: 8px
████████ (tight)

md: 12px
████████████ (comfortable)

lg: 16px
████████████████ (spacious)

xl: 24px
████████████████████████ (very spacious)

xxl: 32px
████████████████████████████████ (generous)

xxxl: 40px
████████████████████████████████████████ (extra generous)
```

### Using Spacing in Code

```typescript
// ✅ CORRECT: Use spacing tokens
const styles = (theme: Theme) => StyleSheet.create({
  container: {
    padding: theme.spacing.lg,           // 16px padding
    marginVertical: theme.spacing.md,    // 12px vertical margin
  },
  
  section: {
    marginTop: theme.spacing.xl,         // 24px top margin
    paddingHorizontal: theme.spacing.lg, // 16px horizontal
  },
  
  compactItem: {
    padding: theme.spacing.sm,           // 8px padding
    marginBottom: theme.spacing.xs,      // 4px bottom margin
  },
});

// ❌ WRONG: Hardcoded spacing
const badStyles = StyleSheet.create({
  container: {
    padding: 16,              // Should use theme.spacing.lg
    marginVertical: 12,       // Should use theme.spacing.md
  },
});
```

### Spacing Rules

**DO:**
- ✅ Always use spacing tokens
- ✅ Keep spacing consistent within sections
- ✅ Use larger spacing for visual separation
- ✅ Group related items with smaller spacing

**DON'T:**
- ❌ Use hardcoded pixel values
- ❌ Mix different spacing systems
- ❌ Add random margins/padding
- ❌ Assume mobile and desktop spacing should be identical

---

## Border Radius

### Radius Scale

```
┌─────────────────────────────┐
│ none  → 0px    No rounding
├─────────────────────────────┤
│ sm    → 4px    Subtle rounding
├─────────────────────────────┤
│ md    → 8px    Standard rounding
├─────────────────────────────┤
│ lg    → 12px   Larger rounding
├─────────────────────────────┤
│ xl    → 16px   Extra rounding
├─────────────────────────────┤
│ full  → 999px  Fully rounded (pills)
└─────────────────────────────┘
```

### Radius Usage Guidelines

```
Component       Recommended
────────────────────────────
Buttons         md (8px)
Cards           md (8px)
Input Fields    md (8px)
Modals          lg (12px)
Badges          sm (4px)
Chips           full (pills)
Avatars         full (circles)
Images          md (8px)
Alerts          md (8px)
```

### Using Border Radius in Code

```typescript
// ✅ CORRECT: Use radius tokens
const styles = (theme: Theme) => StyleSheet.create({
  button: {
    borderRadius: theme.borderRadius.md,  // 8px
  },
  
  card: {
    borderRadius: theme.borderRadius.md,  // 8px
  },
  
  modal: {
    borderRadius: theme.borderRadius.lg,  // 12px
  },
  
  avatar: {
    borderRadius: theme.borderRadius.full, // 999px (circle)
  },
  
  chip: {
    borderRadius: theme.borderRadius.full, // 999px (pill)
  },
});
```

---

## Shadows & Elevation

### Elevation System

CRMLite uses a **5-level elevation system** for depth perception.

```
┌──────────────────────────────────────┐
│ none │ elevation: 0  │ No shadow
├──────────────────────────────────────┤
│ sm   │ elevation: 1  │ Subtle shadow
├──────────────────────────────────────┤
│ md   │ elevation: 2  │ Default card shadow
├──────────────────────────────────────┤
│ lg   │ elevation: 4  │ Emphasized shadow
├──────────────────────────────────────┤
│ xl   │ elevation: 8  │ Modal/menu shadow
└──────────────────────────────────────┘
```

### Shadow Usage Guidelines

```
Level   Use Case                        Example
─────────────────────────────────────────────────────
none    Flat backgrounds                Page backgrounds
sm      Subtle emphasis                 List items, borders
md      Standard elements               Cards, buttons
lg      Important content               Dialog boxes
xl      Prominent content               Modals, menus, popups
```

### Elevation Examples

**None (Flat)**
```
No visual depth
Used for: Backgrounds, flat UI
```

**Small (Subtle)**
```
Slight shadow, minimal depth
Used for: List items, subtle cards
Appears: 1px elevation
```

**Medium (Default)**
```
Noticeable shadow, clear depth
Used for: Standard cards, standard elements
Appears: 2px elevation
```

**Large (Emphasized)**
```
Prominent shadow, strong depth
Used for: Important cards, emphasized content
Appears: 4px elevation
```

**Extra Large (Maximum)**
```
Very prominent shadow, maximum depth
Used for: Modals, popover menus
Appears: 8px elevation
```

### Using Shadows in Code

```typescript
// ✅ CORRECT: Use shadow tokens
const styles = (theme: Theme) => StyleSheet.create({
  card: {
    ...theme.shadows.md,  // Default card shadow
  },
  
  emphasizedCard: {
    ...theme.shadows.lg,  // Larger shadow for emphasis
  },
  
  modal: {
    ...theme.shadows.xl,  // Maximum shadow
  },
  
  flatContent: {
    ...theme.shadows.none, // No shadow
  },
});

// ❌ WRONG: Hardcoded shadow
const badStyles = StyleSheet.create({
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
});
```

### Shadow Implementation

```typescript
// Platform-specific shadow implementation
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};
```

---

## Component States

### Interactive Component States

All interactive components should support these states:

```
Default/Idle
├─ Normal state
├─ No interaction
└─ Standard appearance

Focused/Hover (on interactive)
├─ User interacting
├─ Visual feedback provided
└─ Color/shadow change

Pressed/Active
├─ Component being activated
├─ Maximum visual feedback
└─ Opacity or color shift

Disabled
├─ Component unavailable
├─ 50% opacity reduction
├─ No interaction allowed
└─ Gray color typically

Loading
├─ Processing state
├─ Spinner indicator
├─ User cannot interact
└─ "Loading..." text optional

Error
├─ Invalid state
├─ Red/error color
├─ Error message shown
└─ Retry option available
```

### State Visual Guidelines

```
Button States:

DEFAULT
┌───────────────────────┐
│ SAVE                  │ Full opacity, primary color
└───────────────────────┘

HOVER/FOCUSED
┌───────────────────────┐
│ SAVE                  │ Slightly darker shade
└───────────────────────┘

PRESSED/ACTIVE
┌───────────────────────┐
│ SAVE                  │ Darker shade + shadow
└───────────────────────┘

DISABLED
┌───────────────────────┐
│ SAVE                  │ 50% opacity + gray
└───────────────────────┘

LOADING
┌───────────────────────┐
│ ⟳ SAVING...           │ Spinner + disabled state
└───────────────────────┘

ERROR
┌───────────────────────┐
│ SAVE                  │ Red color
└───────────────────────┘
```

---

## Light & Dark Mode

### Color Adaptation

All colors should adapt to light/dark mode automatically through the theme system.

```
Light Mode
├─ Background: #F9FAFB (Light gray)
├─ Text: #111827 (Dark gray)
├─ Surface: #FFFFFF (White)
└─ Accents: Bright, saturated colors

Dark Mode
├─ Background: #111827 (Dark gray)
├─ Text: #F9FAFB (Light gray)
├─ Surface: #1F2937 (Slightly lighter dark)
└─ Accents: Slightly desaturated, accessible colors
```

### Using Dark Mode in Code

```typescript
// ✅ CORRECT: Components automatically adapt
const Component = () => {
  const theme = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text.primary }}>
        This text adapts to light/dark mode
      </Text>
    </View>
  );
};

// Components using theme.colors automatically work in both modes
// No need for conditional styling!
```

---

## Implementation Guide

### Step 1: Extract Tokens File

Create `src/theme/tokens.ts`:

```typescript
export const tokens = {
  colors: {
    primary: '#0F766E',
    secondary: '#1E3A8A',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    text: {
      primary: '#111827',
      secondary: '#6B7280',
    },
    // ... more colors
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  
  // ... more tokens
};
```

### Step 2: Update Components

Replace hardcoded values with tokens:

```typescript
// Before
const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0F766E',
    padding: 16,
    borderRadius: 8,
  },
});

// After
const styles = (theme: Theme) => StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
});
```

### Step 3: Update Screens

Replace screen-level hardcoded styles:

```typescript
// Scan DashboardScreen, LeadsScreen, etc.
// Replace all hardcoded colors/spacing with theme tokens
```

---

## Token Usage Examples

### Example 1: Creating a Card Component

```typescript
import { StyleSheet, View, Text } from 'react-native';
import { useTheme } from '@react-navigation/native';

interface CardProps {
  title: string;
  description: string;
}

export const Card: React.FC<CardProps> = ({ title, description }) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      ...theme.shadows.md,
    },
    
    title: {
      fontSize: theme.typography.headline.medium.size,
      fontWeight: theme.typography.headline.medium.weight,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    
    description: {
      fontSize: theme.typography.body.medium.size,
      fontWeight: theme.typography.body.medium.weight,
      color: theme.colors.text.secondary,
    },
  });
```

### Example 2: Creating a Status Badge

```typescript
import { StyleSheet, View, Text } from 'react-native';

interface StatusBadgeProps {
  status: 'active' | 'pending' | 'inactive';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const theme = useTheme();
  
  const statusConfig = {
    active: {
      backgroundColor: '#D1FAE5',      // Light green background
      color: '#047857',                // Dark green text
      label: 'Active',
    },
    pending: {
      backgroundColor: '#FEF3C7',      // Light amber background
      color: '#92400E',                // Dark amber text
      label: 'Pending',
    },
    inactive: {
      backgroundColor: '#F3F4F6',      // Light gray background
      color: '#374151',                // Dark gray text
      label: 'Inactive',
    },
  };
  
  const config = statusConfig[status];
  const styles = StyleSheet.create({
    badge: {
      backgroundColor: config.backgroundColor,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.full,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: config.color,
    },
  });
  
  return (
    <View style={styles.badge}>
      <Text style={styles.label}>{config.label}</Text>
    </View>
  );
};
```

### Example 3: Creating a Header Component

```typescript
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

interface ScreenHeaderProps {
  title: string;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  onBackPress,
  rightAction,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  
  return (
    <View style={styles.container}>
      {onBackPress && (
        <Pressable onPress={onBackPress} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </Pressable>
      )}
      
      <Text style={styles.title}>{title}</Text>
      
      {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    
    backButton: {
      padding: theme.spacing.sm,
      marginRight: theme.spacing.md,
    },
    
    title: {
      flex: 1,
      fontSize: theme.typography.headline.medium.size,
      fontWeight: theme.typography.headline.medium.weight,
      color: theme.colors.text.primary,
    },
    
    rightAction: {
      marginLeft: theme.spacing.md,
    },
  });
```

---

## Quick Reference

### Color Tokens to Use

```
theme.colors.primary       → #0F766E (Main brand)
theme.colors.secondary     → #1E3A8A (Alternative)
theme.colors.success       → #10B981 (Active/Complete)
theme.colors.warning       → #F59E0B (Pending/Attention)
theme.colors.error         → #EF4444 (Error/Inactive)
theme.colors.info          → #3B82F6 (Information)
theme.colors.surface       → #FFFFFF (Cards, backgrounds)
theme.colors.background    → #F9FAFB (Page background)
theme.colors.text.primary  → #111827 (Body text)
theme.colors.text.secondary→ #6B7280 (Secondary text)
```

### Spacing Tokens to Use

```
theme.spacing.xs   → 4px   (Minimal)
theme.spacing.sm   → 8px   (Small)
theme.spacing.md   → 12px  (Medium/Default)
theme.spacing.lg   → 16px  (Large/Standard)
theme.spacing.xl   → 24px  (Extra Large)
theme.spacing.xxl  → 32px  (XXL)
```

### Typography Tokens to Use

```
theme.typography.display.large.size
theme.typography.headline.medium.size
theme.typography.body.medium.size
theme.typography.label.large.weight
```

### Other Tokens to Use

```
theme.borderRadius.md        → 8px
theme.borderRadius.full      → 999px (circles/pills)
theme.shadows.md             → Default card shadow
theme.shadows.lg             → Emphasized shadow
theme.shadows.xl             → Modal shadow
```

---

## Next Steps

1. **Extract tokens.ts** from current theme.ts
2. **Update all global components** to use tokens
3. **Refactor screen styles** to use theme colors
4. **Add to all new components** automatically
5. **Train team** on design system tokens
6. **Audit existing code** for hardcoded values

---

**Need clarification on design tokens?** See COMPONENT_GUIDELINES.md or ARCHITECTURE_AUDIT.md for context.
