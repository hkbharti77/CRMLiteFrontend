# Dependency & Dead Code Audit Report

> **Date**: June 2026  
> **Auditor**: Senior Frontend Architect (AI-Assisted)  
> **Scope**: `d:\xyzzz\MinorProject\CRMLiteFrontend\src`  

---

## 1. Component Usage Matrix

| Component | File Path | Usage Count | Imported By |
| --------- | --------- | ----------- | ----------- |
| AppButton | `src/components/global/Button/AppButton.tsx` | 15+ | TicketScreen, LeadDetailScreen, LeadDetailHeader, ContactHeader, BookingForm, ConfirmDialog, EmptyState |
| AppAvatar | `src/components/global/Avatar/AppAvatar.tsx` | 10 | SettingsScreen, ChatRoomScreen, TicketCommentList, TicketCard, LeadListItem, LeadDetailHeader, ContactListItem, ContactHeader, ContactCard, ChatListItem |
| AppCard | `src/components/global/Card/AppCard.tsx` | 9 | LeadDetailScreen, TicketCard, LeadMetrics, LeadCard, RevenueChart, KPICard, ContactCard, CalendarView, AppointmentCard |
| AppSearchBar | `src/components/global/SearchBar/AppSearchBar.tsx` | 4 | TicketScreen, SettingsScreen, LeadsScreen, ChatListScreen |
| EmptyState | `src/components/global/EmptyState/EmptyState.tsx` | 5 | TicketScreen, LeadsScreen, DashboardScreen, ChatListScreen |
| Chip | `src/components/global/Badge/Chip.tsx` | 3 | TicketScreen, PipelineScreen, LeadsScreen |
| AppDivider | `src/components/global/Divider/AppDivider.tsx` | 3 | LeadDetailScreen, LeadFieldsGrid, SectionList |
| StatusBadge | `src/components/global/Badge/StatusBadge.tsx` | 5 | SystemHealthView, LeadDetailScreen, TicketStatusBadge, LeadListItem, LeadCard |
| AppInput | `src/components/global/Input/AppInput.tsx` | 4 | BookingForm |
| ConfirmDialog | `src/components/global/Modal/ConfirmDialog.tsx` | 1 | AiKnowledgeBaseView |
| LeadCard | `src/components/shared/leads/LeadCard.tsx` | 2 | PipelineScreen, LeadsScreen |
| LeadMetrics | `src/components/shared/leads/LeadMetrics.tsx` | 1 | LeadDetailScreen |
| LeadDetailHeader | `src/components/shared/leads/LeadDetailHeader.tsx` | 1 | LeadDetailScreen |
| ContactCard | `src/components/shared/contacts/ContactCard.tsx` | 1 | PipelineScreen |
| AppointmentCard | `src/components/shared/booking/AppointmentCard.tsx` | 2 | BookingScreen, DashboardScreen |
| CalendarView | `src/components/shared/booking/CalendarView.tsx` | 1 | BookingScreen |
| TimeSlotPicker | `src/components/shared/booking/TimeSlotPicker.tsx` | 1 | BookingScreen |
| BookingForm | `src/components/shared/booking/BookingForm.tsx` | 1 | BookingScreen |
| ChatBubble | `src/components/shared/chat/ChatBubble.tsx` | 1 | ChatRoomScreen |
| ChatListItem | `src/components/shared/chat/ChatListItem.tsx` | 1 | ChatListScreen |
| MessageInput | `src/components/shared/chat/MessageInput.tsx` | 1 | ChatRoomScreen |
| TypingIndicator | `src/components/shared/chat/TypingIndicator.tsx` | 1 | ChatRoomScreen |
| KPICard | `src/components/shared/dashboard/KPICard.tsx` | 4 | DashboardScreen |
| RevenueChart | `src/components/shared/dashboard/RevenueChart.tsx` | 1 | DashboardScreen |
| PipelineStage | `src/components/shared/dashboard/PipelineStage.tsx` | 4 | DashboardScreen |
| ActivityItem | `src/components/shared/dashboard/ActivityItem.tsx` | 1 | DashboardScreen |
| TicketTimeline | `src/components/shared/tickets/TicketTimeline.tsx` | 1 | TicketScreen |
| TicketListItem | `src/components/shared/tickets/TicketListItem.tsx` | 1 | TicketScreen |
| TicketStatusBadge | `src/components/shared/tickets/TicketStatusBadge.tsx` | 2 | TicketListItem, TicketCard |

---

## 2. Global Component Validation

| Component | Usage Count | Status |
| --------- | ----------- | ------ |
| AppButton | 15+ | Keep Global |
| AppAvatar | 10 | Keep Global |
| AppCard | 9 | Keep Global |
| StatusBadge | 5 | Keep Global |
| EmptyState | 5 | Keep Global |
| AppSearchBar | 4 | Keep Global |
| AppInput | 4 (all in 1 file) | Move to Module (`shared/booking`) |
| AppDivider | 3 | Keep Global |
| Chip | 3 | Rename & Keep Global |
| ConfirmDialog | 1 | Move to Module (`screens/settings`) |
| AppTabs | 0 | **Delete** |
| FullPageLoader | 0 | **Delete** |
| ListItem | 0 | **Delete** |
| SectionList | 0 | **Delete** |
| CompactHeader | 0 | **Delete** |
| ScreenHeader | 0 | **Delete** |
| Toast | 0 | **Delete** |

---

## 3. Shared Component Validation

| Component | Usage Count | Recommendation |
| --------- | ----------- | -------------- |
| LeadCard | 2 | Keep Shared |
| AppointmentCard | 2 | Keep Shared |
| TicketStatusBadge | 2 | Keep Shared |
| LeadMetrics | 1 | Merge into `LeadDetailScreen` |
| LeadDetailHeader | 1 | Merge into `LeadDetailScreen` |
| ContactCard | 1 | Merge into `PipelineScreen` |
| CalendarView | 1 | Merge into `BookingScreen` |
| TimeSlotPicker | 1 | Merge into `BookingScreen` |
| BookingForm | 1 | Merge into `BookingScreen` |
| ChatBubble | 1 | Merge into `ChatRoomScreen` |
| ChatListItem | 1 | Merge into `ChatListScreen` |
| MessageInput | 1 | Merge into `ChatRoomScreen` |
| TypingIndicator | 1 | Merge into `ChatRoomScreen` |
| RevenueChart | 1 | Merge into `DashboardScreen` |
| ActivityItem | 1 | Merge into `DashboardScreen` |
| TicketTimeline | 1 | Merge into `TicketScreen` |
| TicketListItem | 1 | Merge into `TicketScreen` |
| TicketCard | 0 | **Delete** |
| TicketCommentList | 0 | **Delete** |
| LeadFieldsGrid | 0 | **Delete** |
| LeadListItem | 0 | **Delete** |
| ContactHeader | 0 | **Delete** |
| ContactListItem | 0 | **Delete** |

---

## 4. Unused Components

| Component | File Path | Safe To Delete |
| --------- | --------- | -------------- |
| AppTabs | `src/components/global/Tabs/AppTabs.tsx` | Yes |
| FullPageLoader | `src/components/global/Loader/FullPageLoader.tsx` | Yes |
| ListItem | `src/components/global/List/ListItem.tsx` | Yes |
| SectionList | `src/components/global/List/SectionList.tsx` | Yes |
| CompactHeader | `src/components/global/Header/CompactHeader.tsx` | Yes |
| ScreenHeader | `src/components/global/Header/ScreenHeader.tsx` | Yes |
| Toast | `src/components/global/Toast/Toast.tsx` | Yes |
| TicketCard | `src/components/shared/tickets/TicketCard.tsx` | Yes |
| TicketCommentList | `src/components/shared/tickets/TicketCommentList.tsx` | Yes |
| LeadFieldsGrid | `src/components/shared/leads/LeadFieldsGrid.tsx` | Yes |
| LeadListItem | `src/components/shared/leads/LeadListItem.tsx` | Yes |
| ContactHeader | `src/components/shared/contacts/ContactHeader.tsx` | Yes |
| ContactListItem | `src/components/shared/contacts/ContactListItem.tsx` | Yes |

---

## 5. Unused Screens

| Screen | Route Registered | Navigated To | Recommendation |
| ------ | ---------------- | ------------ | -------------- |
| `LeadsScreen.tsx` | No | No | **Delete** (Functionality subsumed by `PipelineScreen`) |
| `OtpVerificationScreenPremium.tsx` | No | No | **Delete** or swap with standard `OtpVerificationScreen` in `LoginScreen` |

*(Note: `BusinessServicesScreen.tsx` is not registered in the navigator, but it IS rendered as a sub-component view inside `SettingsScreen.tsx`)*

---

## 6. Unused Imports

| File | Unused Import | Line Number |
| ---- | ------------- | ----------- |
| `src/components/global/index.ts` | `export * from './Loader/FullPageLoader';` | 6 |
| `src/components/global/index.ts` | `export * from './Header/ScreenHeader';` | 8 |
| `src/components/global/index.ts` | `export * from './Header/CompactHeader';` | 9 |
| `src/components/global/index.ts` | `export * from './Tabs/AppTabs';` | 12 |
| `src/components/global/index.ts` | `export * from './Toast/Toast';` | 13 |
| `src/components/global/index.ts` | `export * from './List/ListItem';` | 15 |
| `src/components/global/index.ts` | `export * from './List/SectionList';` | 16 |
| `src/components/shared/leads/index.ts` | `export * from './LeadFieldsGrid';` | 5 |
| `src/components/shared/leads/index.ts` | `export * from './LeadListItem';` | 4 |
| `src/components/shared/contacts/index.ts` | `export * from './ContactHeader';` | 3 |
| `src/components/shared/contacts/index.ts` | `export * from './ContactListItem';` | 2 |
| `src/components/shared/tickets/index.ts` | `export * from './TicketCard';` | 1 |
| `src/components/shared/tickets/index.ts` | `export * from './TicketCommentList';` | 3 |

---

## 7. Unused Functions

| Function | File | Safe To Delete |
| -------- | ---- | -------------- |
| `renderLeadCard` (inside unused screen) | `src/screens/LeadsScreen.tsx` | Yes (delete entire file) |

---

## 8. Unused Zustand Store Actions

| Store | Action | Used By | Usage Count |
| ----- | ------ | ------- | ----------- |
| `useActivityLogStore` | `clearTimeline` | None | **0** |
| `useTicketStore` | `assignTicket` | None | **0** |
| `useTicketStore` | `getTicketById` | None | **0** |

---

## 9. Unused API Methods

Based on the centralized API layer `src/services/api.ts` and component usage:

| API Method | Used By | Usage Count |
| ---------- | ------- | ----------- |
| `ticketApi.assign` | None | **0** |
| `ticketApi.getById` | None | **0** |
| `crmApi.getLeads` | `PipelineScreen`, `LeadsScreen` | 2 |
| `activityApi.getContactTimeline`| `ContactProfileScreen` | 1 |

---

## 10. Asset Usage Audit

*No static assets beyond the default Expo icons (`icon.png`, `splash.png`, `favicon.png`, `adaptive-icon.png`) exist in the `assets/` directory. All in-app icons use vector icon libraries (Lucide / Ionicons / MaterialCommunityIcons).*

---

## 11. Circular Dependency Audit

No explicit file-level circular dependencies detected at the barrel file level. The directory relies heavily on absolute path alias imports (e.g., `@components/global/...`) rather than relative folder traversal, which prevents deep circular chains.

---

## 12. Duplicate Component Audit

| Component A | Component B | Similarity % | Recommendation |
| ----------- | ----------- | ------------ | -------------- |
| `LeadsScreen` | `PipelineScreen` | 85% | **Merge** (Delete LeadsScreen as it's unregistered) |
| `OtpVerificationScreen` | `OtpVerificationScreenPremium` | 90% | **Merge** (Delete one implementation) |

---

## 13. Large Component Audit

| Component | Lines | Recommendation |
| --------- | ----- | -------------- |
| `OtpVerificationScreenPremium.tsx` | ~664 | Split OTP Input cells and animations into separate utility hook and visual component. |
| `ContactProfileScreen.tsx` | ~450 | Extract timeline logic into a custom hook. Extract the 4 tabs into separate sub-components. |
| `OtpVerificationScreen.tsx` | ~465 | Delete (Duplicate). |

---

## 14. Bundle Optimization Report

*   **Heavy Libraries**: `react-native-paper` and `@expo/vector-icons` are heavily used.
*   **Duplicate Imports**: Several screen files import multiple icon sets from `lucide-react-native` and `react-native-paper`.
*   **Lazy Loading**: The Settings screen mounts 10+ complex sub-views (`MetaIntegrationView`, `SecurityDashboard`, etc.) instantly inside view-routers. These should be extracted to stack navigator screens to enable lazy-loading on demand, reducing the initial JavaScript heap size.

---

## 15. Final Cleanup Report

### A. Components To Delete
1. `AppTabs`
2. `FullPageLoader`
3. `ListItem`
4. `SectionList`
5. `CompactHeader`
6. `ScreenHeader`
7. `Toast`
8. `TicketCard`
9. `TicketCommentList`
10. `LeadFieldsGrid`
11. `LeadListItem`
12. `ContactHeader`
13. `ContactListItem`

### B. Imports To Remove
*   All exports for the deleted components in the `index.ts` barrel files across `global/`, `shared/leads/`, `shared/contacts/`, and `shared/tickets/`.

### C. Screens To Delete
1. `LeadsScreen.tsx` (Unregistered duplicate)
2. `OtpVerificationScreenPremium.tsx` (Or `OtpVerificationScreen.tsx` - consolidate to 1)

### D. Functions To Delete
1. `clearTimeline` inside `useActivityLogStore.ts`
2. `assignTicket` inside `useTicketStore.ts`
3. `getTicketById` inside `useTicketStore.ts`

### E. Assets To Delete
*   N/A (No unused custom assets).

### F. Stores To Refactor
*   `useTicketStore.ts` (Remove dead actions).
*   `useActivityLogStore.ts` (Remove dead actions).

### G. APIs Not Used
*   `ticketApi.assign`
*   `ticketApi.getById`

### H. Circular Dependencies
*   Clean.

### I. Bundle Optimizations
*   Convert Settings sub-views into standalone navigator screens.

### J. Estimated Code Reduction
*   **Files Removed**: 15 files
*   **Lines Removed**: ~2,500+ lines of unused TypeScript code
*   **Bundle Reduction**: Reduced component registry overhead and unused module parsing.
*   **Build Performance Gain**: Faster metro bundler warmup time due to 15 fewer files to transpile.
