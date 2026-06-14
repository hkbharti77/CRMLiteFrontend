# CRMLiteFrontend — UI Architecture Audit Report

> **Date**: June 2026  
> **Auditor**: Senior Frontend Architect (AI-Assisted)  
> **Scope**: `d:\xyzzz\MinorProject\CRMLiteFrontend\src`  
> **Framework**: React Native (Expo) + react-native-paper + Zustand

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Component Inventory](#2-component-inventory)
3. [Component Usage Analysis](#3-component-usage-analysis)
4. [Design System Audit](#4-design-system-audit)
5. [State Management Audit](#5-state-management-audit)
6. [API Layer Audit](#6-api-layer-audit)
7. [Navigation Architecture](#7-navigation-architecture)
8. [Code Quality & Anti-Patterns](#8-code-quality--anti-patterns)
9. [Duplication & Redundancy](#9-duplication--redundancy)
10. [Performance Risks](#10-performance-risks)
11. [Refactoring Recommendations](#11-refactoring-recommendations)
12. [Prioritized Action Plan](#12-prioritized-action-plan)

---

## 1. Executive Summary

CRMLiteFrontend is a medium-scale React Native (Expo) CRM application with WhatsApp integration. The codebase exhibits **strong architectural intent** but has accumulated several anti-patterns from iterative feature growth. The most critical findings are:

| Severity | Issue | Count |
|----------|-------|-------|
| 🔴 Critical | Duplicate screen implementations (2× OTP, conflicting theme imports) | 3 |
| 🔴 Critical | API calls made directly inside screen components (bypassing store layer) | 4 screens |
| 🟠 High | Inline hardcoded colors bypassing the design token system | ~40 instances |
| 🟠 High | `EmptyState` receives `icon="inbox"` (string) when prop type is `ReactNode` | 4 usages |
| 🟡 Medium | `BookingScreen` mixes react-native-paper `Chip` with global `Chip` (naming collision) | 1 screen |
| 🟡 Medium | `SecurityDashboard` imports from `../../theme` legacy path instead of `@theme/tokens` | 1 file |
| 🟡 Medium | `BusinessServicesScreen` uses deprecated `Title`, `Paragraph` from react-native-paper | 1 file |
| 🟡 Medium | `ChatListScreen` uses `Math.random()` to assign `channel` prop on render (non-deterministic) | 1 file |
| 🟢 Low | `OtpVerificationScreen.tsx` has a non-functional text input (renders `<View>` as OTP cell, not `<TextInput>`) | 1 file |

**Overall Health Score: 62 / 100** — The foundation is good, but technical debt is concentrated in screen-level code.

---

## 2. Component Inventory

### 2.1 Global Components (`src/components/global/`)

These are — or should be — reusable primitives used across multiple features.

| Component | File Path | Type | Status |
|-----------|-----------|------|--------|
| `AppButton` | `global/Button/AppButton.tsx` | Global Primitive | ✅ Good |
| `AppAvatar` | `global/Avatar/AppAvatar.tsx` | Global Primitive | ✅ Good |
| `AppCard` | `global/Card/AppCard.tsx` | Global Primitive | ✅ Good |
| `AppSearchBar` | `global/SearchBar/AppSearchBar.tsx` | Global Primitive | ✅ Good |
| `Chip` | `global/Badge/Chip.tsx` | Global Primitive | ⚠️ Name-collides with `react-native-paper` Chip |
| `EmptyState` | `global/EmptyState/EmptyState.tsx` | Global Composite | ⚠️ `icon` type mismatch (see §8) |

**Barrel export**: `global/index.ts` — correctly re-exports all global components.

### 2.2 Shared Components (`src/components/shared/`)

Feature-scoped components grouped by domain.

#### Chat Domain
| Component | File Path | Usage Scope |
|-----------|-----------|-------------|
| `ChatBubble` | `shared/chat/ChatBubble.tsx` | `ChatRoomScreen` |
| `ChatListItem` | `shared/chat/ChatListItem.tsx` | `ChatListScreen` |

#### Dashboard Domain
| Component | File Path | Usage Scope |
|-----------|-----------|-------------|
| `KPICard` | `shared/dashboard/KPICard.tsx` | `DashboardScreen` |
| `ActivityFeedItem` | `shared/dashboard/ActivityFeedItem.tsx` | `DashboardScreen` |

#### Leads Domain
| Component | File Path | Usage Scope |
|-----------|-----------|-------------|
| `LeadCard` | `shared/leads/LeadCard.tsx` | `LeadsScreen`, `PipelineScreen` |

#### Contacts Domain
| Component | File Path | Usage Scope |
|-----------|-----------|-------------|
| `ContactCard` | `shared/contacts/ContactCard.tsx` | `PipelineScreen` |

#### Booking Domain
| Component | File Path | Usage Scope |
|-----------|-----------|-------------|
| `AppointmentCard` | `shared/booking/AppointmentCard.tsx` | `BookingScreen` |
| `CalendarView` | `shared/booking/CalendarView.tsx` | `BookingScreen` |
| `TimeSlotPicker` | `shared/booking/TimeSlotPicker.tsx` | `BookingScreen` |

#### Tickets Domain
| Component | File Path | Usage Scope |
|-----------|-----------|-------------|
| `TicketListItem` | `shared/tickets/TicketListItem.tsx` | `TicketScreen` |
| `TicketTimeline` | `shared/tickets/TicketTimeline.tsx` | `TicketScreen` |

### 2.3 Screens (`src/screens/`)

| Screen File | Route Name | Notes |
|-------------|------------|-------|
| `LoginScreen.tsx` | `Login` | Contains full OTP sub-render via `OtpVerificationScreen` component |
| `OtpVerificationScreen.tsx` | (sub-component) | Non-functional OTP inputs (no TextInput) |
| `OtpVerificationScreenPremium.tsx` | (duplicate) | Full standalone alternative — also non-functional inputs |
| `OnboardingScreen.tsx` | `Onboarding` | Standalone — uses raw RN primitives, no design system |
| `DashboardScreen.tsx` | `Dashboard` | Main home screen |
| `ChatListScreen.tsx` | `ChatList` | Uses `Math.random()` on channel prop |
| `ChatRoomScreen.tsx` | `ChatRoom` | Complex — includes CRM sidebar, timeline, file send |
| `LeadsScreen.tsx` | `Leads` | Kanban board; calls API directly |
| `PipelineScreen.tsx` | `Pipeline` | Duplicates `LeadsScreen` fetch logic |
| `ContactProfileScreen.tsx` | `ContactProfile` | Detailed CRM profile |
| `BookingScreen.tsx` | `Booking` | Appointments + Bookings tabs; mixes Chip sources |
| `TicketScreen.tsx` | `Tickets` | Full ticket CRUD |
| `BusinessServicesScreen.tsx` | `BusinessServices` | Uses deprecated Paper components |
| `SettingsScreen.tsx` | `Settings` | View-router for 10+ sub-views |
| `settings/SecurityDashboard.tsx` | (sub-view) | Uses legacy theme import |
| `settings/CustomMessagesView.tsx` | (sub-view) | — |

---

## 3. Component Usage Analysis

### 3.1 `AppButton` Usage Map

Used in: `TicketScreen`, `ContactProfileScreen`, `ChatRoomScreen`, `DashboardScreen`, `EmptyState`  
✅ Correctly used as a design-system primitive.

### 3.2 `AppCard` Usage Map

Used in: `KPICard`, `ChatRoomScreen` (CRM sidebar), `DashboardScreen`  
✅ Good encapsulation.

### 3.3 `EmptyState` — Critical Prop Mismatch

**The `EmptyState` component defines `icon?: React.ReactNode`** but is called with a string in several screens:

```tsx
// TicketScreen.tsx — WRONG
<EmptyState title="No tickets found" description="..." icon="inbox" />

// LeadsScreen.tsx — WRONG
<EmptyState title={`No ${stage.label} leads`} description="..." icon="inbox" />
```

**Correct usage** (as seen in `ChatListScreen`):
```tsx
// ChatListScreen.tsx — CORRECT
<EmptyState
  icon={<MessageSquare size={32} color={theme.colors.primary} />}
  ...
/>
```

**Affected files**: `TicketScreen.tsx`, `LeadsScreen.tsx` (2× inside `renderColumn`)

**Risk**: The `icon` prop renders a `<View>` container and passes the string as `{icon}`. In React Native, strings can only be children of `<Text>`. This will throw a **"Unexpected text node"** runtime error.

### 3.4 `Chip` — Naming Collision

`BookingScreen.tsx` imports two different `Chip` components:

```tsx
// react-native-paper Chip (line 18 of BookingScreen)
import { ..., Chip, ... } from 'react-native-paper';
```

The global `@components/global/Badge/Chip` is never imported in `BookingScreen`, but this creates an implicit trap for future contributors — the Paper `Chip` is used for filter pills while the custom `Chip` from the global library is used everywhere else. This inconsistency makes the codebase harder to navigate.

**Recommendation**: Rename the global `Chip` to `AppChip` or `FilterChip` to prevent shadowing ambiguity.

---

## 4. Design System Audit

### 4.1 Theme Architecture

```
src/
├── theme.ts              ← Primary entry point; exports colors, typography, spacing, shadows, borderRadius
├── theme/
│   ├── tokens.ts         ← Source-of-truth design tokens (spacing, typography, shadows, borderRadius, colors)
│   └── colors.ts         ← Color palette primitives
```

The design token system is **well-structured**. `tokens.ts` provides a complete set of values referenced as `tokens.spacing.md`, `tokens.colors.primary`, etc.

### 4.2 Token Adoption Rate

| Category | Using Tokens | Using Hardcoded Values | Score |
|----------|-------------|----------------------|-------|
| Global Components | High | Rare | 90% |
| Shared Components | Medium | Some | 70% |
| Screens (new) | Medium | Common | 60% |
| Legacy Screens (`OnboardingScreen`, `BusinessServicesScreen`) | None | All | 10% |

### 4.3 Hardcoded Color Inventory (Critical Instances)

| File | Hardcoded Value | Should Use |
|------|----------------|------------|
| `BookingScreen.tsx` | `'#fff'`, `'#888'`, `'#666'`, `'#1565C0'` | `tokens.colors.*` |
| `OnboardingScreen.tsx` | `'#006A4E'`, `'#f0f2f5'`, `'#ddd'`, `'#aaa'` | `theme.colors.primary`, `tokens.*` |
| `SecurityDashboard.tsx` | `'#DCFCE7'`, `'#FEE2E2'`, `'#E2E8F0'`, `'#0284C7'` | `tokens.colors.*` |
| `BusinessServicesScreen.tsx` | `'#f5f5f5'`, `'gray'`, `'white'`, `'red'` | `tokens.colors.*` |
| `ChatBubble.tsx` | `'#F1F5F9'` (receiver bubble) | `tokens.colors.backgroundDark` |
| `PipelineScreen.tsx` | `'#FFC107'`, `'#FF9800'`, `'#9C27B0'`, `'#4CAF50'` | Extend tokens with `pipeline.*` |

### 4.4 Theme Import Inconsistency

`SecurityDashboard.tsx` imports from the **legacy path**:
```tsx
// SecurityDashboard.tsx — LEGACY
import { colors, typography, sharedStyles } from '../../theme';
```

All other files use `@theme/tokens`:
```tsx
// Correct pattern used everywhere else
import { tokens } from '@theme/tokens';
```

The `theme.ts` barrel re-exports `colors` as a flat object for backward-compatibility, but `typography` and `sharedStyles` are old-style export shapes that don't align with the new token system. This creates **two parallel styling systems** that will diverge over time.

---

## 5. State Management Audit

### 5.1 Store Map

| Store | File | What It Manages |
|-------|------|-----------------|
| `useAuthStore` | `store/useAuthStore.ts` | JWT token, user identity, onboarding status |
| `useChatStore` | `store/useChatStore.ts` | Chat list, active chat messages |
| `useLeadStore` | `store/useLeadStore.ts` | Leads array |
| `useAppointmentStore` | `store/useAppointmentStore.ts` | Appointments array |
| `useBookingStore` | `store/useBookingStore.ts` | Bookings array |
| `useTicketStore` | `store/useTicketStore.ts` | Tickets, filters, selected ticket, search query |
| `useWebSocketStore` | `store/useWebSocketStore.ts` | WebSocket connection, real-time messages |

Zustand is used correctly — stores expose fine-grained setters (`setLeads`, `addAppointment`, `updateAppointment`) rather than forcing full-state replacement.

### 5.2 Anti-Pattern: Direct API Calls in Screens

Several screens bypass the store layer and call the API directly, duplicating fetch logic:

```tsx
// LeadsScreen.tsx — ANTI-PATTERN: API fetch not in store
const fetchLeads = async () => {
  const response = await crmApi.getLeads();
  const mappedLeads: Lead[] = response.data.map(...)
  setLeads(mappedLeads);
};
```

This **identical mapping logic** is also copy-pasted in `PipelineScreen.tsx`. If the API response shape changes, it must be updated in two places.

**Affected files**:
- `LeadsScreen.tsx` — `fetchLeads()` directly in component
- `PipelineScreen.tsx` — duplicate `fetchLeads()` 
- `BookingScreen.tsx` — direct `appointmentApi.getAll()` + `bookingApi.getAll()` + `crmApi.getContacts()`
- `ChatListScreen.tsx` — direct `messageApi.getChats()` + polling interval

**Recommendation**: Move all fetch + mapping logic into the respective Zustand stores as actions (e.g., `useLeadStore.fetchLeads()`).

---

## 6. API Layer Audit

### 6.1 API Module Structure

`src/services/api.ts` is a **well-organized** centralized API module with:
- Axios instance with base URL from env
- JWT + Tenant ID injection interceptor
- Trace ID injection for observability
- Auto-logout on 401/403

Exported namespace groups:
- `authApi` — Login/OTP
- `crmApi` — Contacts, Leads, Enquiries, Reminders, Deals
- `whatsappApi` — WhatsApp config + media upload
- `messageApi` — Chat list + history + send
- `onboardingApi` — Onboarding submit/skip
- `appointmentApi` — CRUD + status actions
- `bookingApi` — CRUD + status actions
- `activityApi` — CRM activity timeline
- `userApi` — Profile + security suite
- `categoryApi` — Business category management
- `businessServiceApi` — Service CRUD with media upload
- `flowConfigApi` — Trigger labels
- `ragApi` — Document upload/training
- `ticketApi` — Full ticket CRUD + comments
- `customEmailApi` — Campaign email sending
- `supportFormConfigApi` — Support form config
- `monitoringApi` — Health/metrics

### 6.2 Issues

| Issue | Location | Severity |
|-------|----------|----------|
| `businessServiceApi.create/update` uses raw `fetch()` instead of the `api` Axios instance — bypasses interceptors (no token injection, no trace ID) | `api.ts` L247-308 | 🟠 High |
| `ragApi.uploadDocument` also uses raw `fetch()` for the same reason | `api.ts` L318-353 | 🟠 High |
| `window.location.reload()` in the 401 interceptor — only works on Web, will silently fail on native | `api.ts` L57-59 | 🟡 Medium |
| `userApi.updatePassword` types `password` as `String` (capitalized, boxed type) instead of `string` | `api.ts` L221 | 🟢 Low |

---

## 7. Navigation Architecture

### 7.1 Structure

```
AppNavigator
├── AuthStack
│   ├── Login
│   └── Onboarding
└── MainStack (after auth)
    ├── BottomTabNavigator
    │   ├── Dashboard (DashboardScreen)
    │   ├── Inbox (ChatListScreen)
    │   ├── Pipeline (PipelineScreen)
    │   ├── Leads (LeadsScreen)
    │   └── Tickets (TicketScreen)
    └── Modal/Detail Screens
        ├── ChatRoom
        ├── ContactProfile
        ├── Booking
        ├── Settings
        ├── BusinessServices
        └── LeadDetail
```

### 7.2 Issues

| Issue | Severity |
|-------|----------|
| Both `LeadsScreen` and `PipelineScreen` are in the bottom tab nav and display overlapping data (leads list vs. pipeline board). Users see the same underlying data through two tabs. This is **UX duplication**, not just code duplication. | 🟠 High |
| `navigation` is typed as `any` in every screen — no typed navigation props | 🟡 Medium |
| No deep linking configuration found | 🟢 Low |

---

## 8. Code Quality & Anti-Patterns

### 8.1 Duplicate Screen Implementations

**Two OTP screens exist for the same flow:**

| File | Lines | Notes |
|------|-------|-------|
| `OtpVerificationScreen.tsx` | 465 | Used as sub-component inside `LoginScreen`; OTP "input" renders as a `<View>` with `<Text>` — no actual `<TextInput>`, so it is **not interactive** |
| `OtpVerificationScreenPremium.tsx` | 664 | Standalone screen with working `authApi.verifyOtp()` and store integration; also renders `<View>` as OTP cells — no `<TextInput>` either |

Both files define a component named `export default function OtpVerificationScreen` — this will cause a **module naming conflict** if ever both are imported into the same file.

**Root problem**: Neither implementation renders an actual `<TextInput>`. The OTP inputs are visual `<View>` + `<Text>` cells with no input event binding. This appears to be an unresolved visual prototype.

### 8.2 Deprecated react-native-paper Components

`BusinessServicesScreen.tsx` imports `Title` and `Paragraph` from `react-native-paper`:
```tsx
import { ..., Title, Paragraph, ... } from 'react-native-paper';
```
These were deprecated in v5 and removed in v5+ in favor of `<Text variant="titleMedium">` etc.

### 8.3 Non-Deterministic Render

`ChatListScreen.tsx` assigns `channel` on every FlatList render:
```tsx
channel: Math.random() > 0.5 ? 'whatsapp' : 'web',
```
This will cause `channel` to change every re-render and is functionally incorrect — it should come from the data model.

### 8.4 Missing Error Boundaries

No `ErrorBoundary` component found anywhere in the tree. A single JS error in any screen will crash the entire app in production.

### 8.5 `useEffect` Without Dependencies

```tsx
// ChatListScreen.tsx — fetchChats called in effect but not memoized
const fetchChats = async () => { ... };
useEffect(() => {
  fetchChats();
  const interval = setInterval(() => { fetchChats(); }, 10000);
  return () => clearInterval(interval);
}, []); // fetchChats not in deps
```
`fetchChats` is recreated on every render (not wrapped in `useCallback`), but referenced in a stale closure inside `setInterval`. This is a React hook exhaustive-deps violation.

### 8.6 `any` Type Overuse

Throughout the codebase, `any` is used for:
- `navigation` props in every screen
- API response types (`response.data.map((item: any) => ...)`)
- Store entity types in older screens
- `ref` types (`useRef<any[]>`)

This erases TypeScript's protection for the most critical data flows.

---

## 9. Duplication & Redundancy

### 9.1 Duplicated Lead Fetch + Mapping

```tsx
// Exact same logic in BOTH LeadsScreen.tsx and PipelineScreen.tsx
const fetchLeads = async () => {
  const response = await crmApi.getLeads();
  const mappedLeads: Lead[] = response.data.map((item: any) => ({
    id: item.id,
    contactId: item.contact?.id,
    name: item.contact?.name || 'Unknown',
    lastMessage: item.dealLabel || ...,
    time: item.lastActivity ? ... : 'Just now',
    status: item.status as LeadStatus,
    enquiries: item.enquiries || [],
    ...
  }));
  setLeads(mappedLeads);
};
```

This 25-line block is copy-pasted verbatim in two screens. The only difference is `PipelineScreen` maps two extra fields (`isNew`, `createdAtHuman`). This should be a single `fetchLeads()` action in `useLeadStore`.

### 9.2 Kanban Column Layout

The entire column layout (header with status dot + count badge + FlatList) is duplicated between `LeadsScreen.tsx` and `PipelineScreen.tsx`. Both even share the same `COLUMN_WIDTH`, `STAGES` constant shape, and `renderColumn` function structure.

### 9.3 Loading State Pattern

Every screen independently implements:
```tsx
if (loading) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
```
This pattern appears in 6+ screens with no shared abstraction. A `<LoadingScreen />` global component would eliminate this.

### 9.4 OTP Input Component

Both OTP screen files define their own inner `OtpInput` component (a `React.forwardRef` function). These are structurally identical despite being in separate files.

---

## 10. Performance Risks

| Risk | Location | Impact |
|------|----------|--------|
| `Math.random()` in `FlatList` render function — every scroll/re-render reassigns `channel` | `ChatListScreen.tsx` | Medium |
| `setInterval(fetchChats, 10000)` polling — makes network request every 10s regardless of app state/foreground status | `ChatListScreen.tsx` | Medium |
| Inline function creation in `FlatList.renderItem` — new function on every render prevents `React.memo` optimization | Multiple screens | Low |
| `Animated.divide` used in `OtpVerificationScreenPremium` — fine, but `shakeAnim` is shared across all 6 OTP cells, so the shake stagger is non-linear and may look jittery | `OtpVerificationScreenPremium.tsx` | Low |
| Full timeline data fetched via `activityApi.getContactTimeline()` in `ContactProfileScreen` with no pagination or virtualization | `ContactProfileScreen.tsx` | Medium (for high-activity contacts) |

---

## 11. Refactoring Recommendations

### R1 — Consolidate Lead Fetch into Store [Critical]

Move the API call + mapping into `useLeadStore`:

```ts
// store/useLeadStore.ts — ADD THIS ACTION
fetchLeads: async () => {
  const response = await crmApi.getLeads();
  const mappedLeads: Lead[] = response.data.map((item: any) => ({
    id: item.id,
    contactId: item.contact?.id,
    name: item.contact?.name || 'Unknown',
    lastMessage: item.dealLabel || ...,
    time: ...,
    status: item.status as LeadStatus,
    enquiries: item.enquiries || [],
    dealLabel: item.dealLabel,
    dealValue: item.dealValue,
    paymentStatus: item.paymentStatus,
    currency: item.currency,
    isNew: item.isNew ?? false,
    createdAtHuman: item.createdAtHuman ?? '',
  }));
  set({ leads: mappedLeads });
},
```

Then both `LeadsScreen` and `PipelineScreen` call `useLeadStore(s => s.fetchLeads)`.

### R2 — Fix EmptyState Icon Prop [Critical]

Option A: Make `icon` accept `string | ReactNode`, render a Material icon if string:
```tsx
icon?: string | React.ReactNode;
// in render:
{typeof icon === 'string'
  ? <MaterialCommunityIcon name={icon} size={40} />
  : icon}
```

Option B: Change all call sites to pass a ReactNode (breaking change but cleaner).

### R3 — Rename Global Chip to Avoid Collision [High]

```ts
// global/Badge/AppChip.tsx (rename)
export const AppChip: React.FC<AppChipProps> = ...

// Update barrel export
export { AppChip } from './Badge/AppChip';
```

Update all import sites that use the global `Chip`.

### R4 — Fix SecurityDashboard Theme Import [High]

```tsx
// BEFORE
import { colors, typography, sharedStyles } from '../../theme';

// AFTER
import { tokens } from '@theme/tokens';
import { useTheme } from 'react-native-paper';
// Replace all colors.xxx → tokens.colors.xxx
// Replace all typography.xxx → StyleSheet styles using tokens.typography.xxx
```

### R5 — Fix businessServiceApi and ragApi to Use Axios [High]

```ts
// BEFORE (raw fetch with manual token injection)
const token = await AsyncStorage.getItem('userToken');
const response = await fetch(`${API_BASE_URL}/business-services`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});

// AFTER (use the api axios instance with multipart override)
return api.post('/business-services', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
```

The interceptor already handles token injection — no need to do it manually.

### R6 — Create LoadingScreen Global Component [Medium]

```tsx
// components/global/Loading/LoadingScreen.tsx
export const LoadingScreen: React.FC = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={tokens.colors.primary} />
  </View>
);
```

Replace all 6+ inline loading views with `<LoadingScreen />`.

### R7 — Fix ChatListScreen Polling and Math.random [Medium]

```tsx
// Remove Math.random() — derive from actual data
channel: item.channel ?? 'whatsapp',

// Wrap fetchChats in useCallback to stabilize reference
const fetchChats = useCallback(async () => {
  try {
    const response = await messageApi.getChats();
    setChats(response.data);
  } catch (error) {
    console.error('Error fetching chats:', error);
  }
}, [setChats]);
```

Also consider moving polling to `useChatStore` and making it AppState-aware (pause when backgrounded).

### R8 — Fix OTP Input Components [Critical]

Both OTP screens render display-only `<View>/<Text>` cells but label them as "input". A real `<TextInput>` (hidden or positioned) must be attached:

```tsx
// Option: hidden TextInput with character extraction
<TextInput
  ref={ref}
  style={styles.hiddenInput}
  maxLength={1}
  keyboardType="number-pad"
  value={value}
  onChangeText={onChangeText}
  onKeyPress={({ nativeEvent }) => onKeyPress(nativeEvent.key)}
/>
// Overlay the visual cell on top
```

### R9 — Delete or Consolidate Duplicate Screens [Critical]

- `OtpVerificationScreen.tsx` and `OtpVerificationScreenPremium.tsx` — pick one, delete the other.
- `LeadsScreen.tsx` and `PipelineScreen.tsx` — either merge into one screen with a toggle (PipelineScreen already has this toggle built in), or keep PipelineScreen only and remove LeadsScreen from the tab bar.

### R10 — Type Navigation Props [Low]

```ts
// navigation/types.ts
export type RootStackParamList = {
  Login: undefined;
  Onboarding: undefined;
  Dashboard: undefined;
  ChatRoom: { chatId: string; name: string };
  ContactProfile: { contactId: string };
  LeadDetail: { leadId: string; leadName: string };
  // ...
};

// In screens:
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
type Props = NativeStackScreenProps<RootStackParamList, 'ChatRoom'>;
export default function ChatRoomScreen({ navigation, route }: Props) { ... }
```

---

## 12. Prioritized Action Plan

### Sprint 1 — Critical Fixes (Risk Reduction)

| # | Task | Effort | Severity |
|---|------|--------|----------|
| 1 | Fix `EmptyState` icon prop type mismatch in `TicketScreen` and `LeadsScreen` | 30 min | 🔴 |
| 2 | Fix OTP screens — add real `<TextInput>` to both OTP components | 2h | 🔴 |
| 3 | Consolidate OTP screens — delete `OtpVerificationScreen.tsx`, keep Premium variant | 30 min | 🔴 |
| 4 | Move `fetchLeads` into `useLeadStore` and remove duplicate in `PipelineScreen` | 1h | 🔴 |

### Sprint 2 — High-Priority Refactors

| # | Task | Effort | Severity |
|---|------|--------|----------|
| 5 | Fix `businessServiceApi` + `ragApi` to use Axios interceptors | 1h | 🟠 |
| 6 | Refactor `SecurityDashboard` to use `@theme/tokens` instead of legacy theme import | 2h | 🟠 |
| 7 | Rename global `Chip` → `AppChip` and update all usages | 1h | 🟠 |
| 8 | Evaluate merging `LeadsScreen` into `PipelineScreen` (UX duplication) | 2h | 🟠 |

### Sprint 3 — Medium-Priority Quality

| # | Task | Effort | Severity |
|---|------|--------|----------|
| 9 | Create shared `<LoadingScreen />` component and replace inline loaders | 1h | 🟡 |
| 10 | Fix `ChatListScreen` — remove `Math.random()`, wrap `fetchChats` in `useCallback` | 30 min | 🟡 |
| 11 | Replace deprecated `Title`/`Paragraph` in `BusinessServicesScreen` | 30 min | 🟡 |
| 12 | Move `fetchChats` polling into `useChatStore` with AppState awareness | 2h | 🟡 |
| 13 | Type all `navigation` props using `RootStackParamList` | 3h | 🟡 |
| 14 | Add `ErrorBoundary` wrapper around navigation tree | 1h | 🟡 |

### Sprint 4 — Low-Priority / Tech Debt

| # | Task | Effort | Severity |
|---|------|--------|----------|
| 15 | Replace all hardcoded colors in `OnboardingScreen` with theme tokens | 2h | 🟢 |
| 16 | Replace hardcoded colors in `BookingScreen` | 1h | 🟢 |
| 17 | Extend `tokens.ts` with a `pipeline.*` color palette for stage colors | 30 min | 🟢 |
| 18 | Fix `window.location.reload()` in API interceptor to use navigation reset on native | 1h | 🟢 |
| 19 | Add pagination to `activityApi.getContactTimeline()` in `ContactProfileScreen` | 3h | 🟢 |

---

## Appendix A — File Inventory

```
src/
├── App.tsx
├── navigation/
│   └── AppNavigator.tsx
├── theme.ts
├── theme/
│   ├── tokens.ts
│   └── colors.ts
├── services/
│   └── api.ts
├── store/
│   ├── useAuthStore.ts
│   ├── useChatStore.ts
│   ├── useLeadStore.ts
│   ├── useAppointmentStore.ts
│   ├── useBookingStore.ts
│   ├── useTicketStore.ts
│   └── useWebSocketStore.ts
├── components/
│   ├── global/
│   │   ├── index.ts
│   │   ├── Button/AppButton.tsx
│   │   ├── Avatar/AppAvatar.tsx
│   │   ├── Card/AppCard.tsx
│   │   ├── SearchBar/AppSearchBar.tsx
│   │   ├── Badge/Chip.tsx           ← ⚠️ rename to AppChip
│   │   └── EmptyState/EmptyState.tsx ← ⚠️ icon prop type
│   └── shared/
│       ├── chat/
│       │   ├── ChatBubble.tsx
│       │   └── ChatListItem.tsx
│       ├── dashboard/
│       │   ├── KPICard.tsx
│       │   └── ActivityFeedItem.tsx
│       ├── leads/
│       │   └── LeadCard.tsx
│       ├── contacts/
│       │   └── ContactCard.tsx
│       ├── booking/
│       │   ├── AppointmentCard.tsx
│       │   ├── CalendarView.tsx
│       │   └── TimeSlotPicker.tsx
│       └── tickets/
│           ├── TicketListItem.tsx
│           └── TicketTimeline.tsx
└── screens/
    ├── LoginScreen.tsx
    ├── OtpVerificationScreen.tsx        ← ⚠️ DELETE (non-functional, duplicate)
    ├── OtpVerificationScreenPremium.tsx ← ⚠️ KEEP & FIX
    ├── OnboardingScreen.tsx             ← ⚠️ no design system
    ├── DashboardScreen.tsx
    ├── ChatListScreen.tsx               ← ⚠️ Math.random, polling
    ├── ChatRoomScreen.tsx
    ├── LeadsScreen.tsx                  ← ⚠️ consider removing (duplicate of Pipeline)
    ├── PipelineScreen.tsx
    ├── ContactProfileScreen.tsx
    ├── BookingScreen.tsx                ← ⚠️ Chip collision
    ├── TicketScreen.tsx
    ├── BusinessServicesScreen.tsx       ← ⚠️ deprecated Paper components
    ├── SettingsScreen.tsx
    └── settings/
        ├── SecurityDashboard.tsx        ← ⚠️ legacy theme import
        └── CustomMessagesView.tsx
```

---

*Report generated by AI-assisted architecture audit. All findings are based on static code analysis of the source files in `d:\xyzzz\MinorProject\CRMLiteFrontend\src`.*
