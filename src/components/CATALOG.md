# Component Catalog

This is the central catalog of all components available in the CRMLite Frontend architecture.

## Global Components (`src/components/global/`)

Global components are highly reusable, domain-agnostic UI primitives.

### Avatar
- **AppAvatar**: Standard user or entity avatar displaying initials or an image.

### Badge
- **StatusBadge**: Displays status colors based on a specific theme status token.
- **Chip**: A small interactive element, typically used for tagging or filtering.

### Button
- **AppButton**: Core button component with `primary`, `secondary`, and `outlined` variants.

### Card
- **AppCard**: Base container with standard padding, border radius, and shadow.

### Divider
- **AppDivider**: A simple horizontal rule that respects the theme border color.

### EmptyState
- **EmptyState**: Standardized view for empty lists or missing data.

### Header
- **ScreenHeader**: Large title header used at the top of main screens.
- **CompactHeader**: Smaller header for sub-screens or modals.

### Input
- **AppInput**: Text input field with built-in error handling and helper text.

### List
- **ListItem**: Generic row component for lists.
- **SectionList**: Reusable list wrapper for sectioned data.

### Loader
- **FullPageLoader**: Centered loading spinner to cover the screen during async tasks.

### Modal
- **ConfirmDialog**: A standard dialog for destructive actions or confirmations.

### SearchBar
- **AppSearchBar**: Input specifically tuned for search queries, with a clear button.

### Tabs
- **AppTabs**: Standard top-tab navigation interface.

### Toast
- **Toast**: A non-intrusive notification overlay.

---

## Shared Domain Components (`src/components/shared/`)

Shared components are built from global components and are specific to a business domain.

### Leads (`leads/`)
- `LeadCard`: Summary view of a single lead.
- `LeadDetailHeader`: Top section of the Lead Detail screen.
- `LeadMetrics`: Stat boxes for lead engagement.
- `LeadListItem`: Compact lead row.
- `LeadFieldsGrid`: Editable grid of lead data.

### Tickets (`tickets/`)
- `TicketCard`: Summary view of a support ticket.
- `TicketStatusBadge`: Colored badge for ticket status.
- `TicketCommentList`: Displays a list of comments.
- `TicketTimeline`: Audit trail of ticket updates.
- `TicketListItem`: Compact ticket row.

### Chat (`chat/`)
- `ChatBubble`: Renders an individual message.
- `ChatListItem`: Renders a chat thread in a list.
- `MessageInput`: Text input and send button.
- `TypingIndicator`: Animated dot indicator for typing status.

### Booking (`booking/`)
- `AppointmentCard`: View an upcoming appointment.
- `TimeSlotPicker`: Grid of available time slots.
- `BookingForm`: Form for creating a booking.
- `CalendarView`: Month calendar component.

### Dashboard (`dashboard/`)
- `KPICard`: Displays a key performance indicator.
- `RevenueChart`: Data visualization for revenue.
- `ActivityItem`: Row for recent activity feed.
- `PipelineStage`: Column/Stage for the deal pipeline.

### Contacts (`contacts/`)
- `ContactCard`: Detailed view of a contact.
- `ContactListItem`: Row for contact list.
- `ContactHeader`: Top header of a contact profile.
