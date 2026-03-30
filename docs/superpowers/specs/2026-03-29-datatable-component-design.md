# DataTable Component Design

**Date:** 2026-03-29
**Status:** Approved

## Problem

The Trip Planner frontend has 12 inline HTML tables spread across 8 pages. They share no common component, leading to:

- **Visual inconsistency** — two style families: CSS-variable pages vs hardcoded-hex TripDetailPage tables
- **Duplicated markup** — container, header, body, empty-state, hover logic repeated per table
- **No sorting** — none of the tables support column sorting
- **No editable cells** — QualificationsPage implements inline editing ad-hoc
- **Maintenance cost** — styling or behavior changes require touching every page

## Solution

A single generic `DataTable<T>` component at `frontend/src/components/DataTable.tsx` with:

- Declarative column config (array of column objects)
- Opt-in sorting, editable cells, footer, clickable rows
- Unified styling via CSS variables matching the warm TripDetailPage palette
- Same export/pattern conventions as the existing `Dropdown` component

## Scope

### In scope (12 tables)

| # | Page | Key Features |
|---|------|-------------|
| 1 | ParticipantsPage | Clickable rows, search, status badges |
| 2 | StaffPage | Qualification checkmarks, action buttons |
| 3 | TasksPage | Checkbox column, priority/status badges |
| 4 | BookingsPage | Read-only, status badges, links |
| 5 | IncidentsPage | Severity/status badges, actions |
| 6 | QualificationsPage | Nested accordion, editable cells, row coloring |
| 7 | ParticipantDetailPage | Simple 3-column booking history |
| 8 | TripDetailPage — Claims | Dropdown in cells, conditional actions |
| 9 | TripDetailPage — Bookings | 10 columns, 3 inline dropdowns, actions |
| 10 | TripDetailPage — Staff | Conflict indicators, edit/delete actions |
| 11 | TripDetailPage — Tasks | Read-only with priority/status badges |
| 12 | ClaimDetailPage | Footer totals, plan type badges, toggles |

### Out of scope

- **SchedulePage** — calendar/schedule view, not a data table
- **Card grids** — TripsPage, VehiclesPage, AccommodationPage, DashboardPage use card layouts
- **Pagination** — not needed with current data volumes; can be added later

## API Design

### Types

```typescript
export type ColumnType = 'text' | 'date' | 'currency' | 'boolean' | 'badge' | 'custom'

export type Column<T> = {
  key: keyof T | string
  header: string
  type?: ColumnType                // default: 'text'
  sortable?: boolean               // opt-in per column
  align?: 'left' | 'center' | 'right'  // default: 'left'
  hidden?: boolean                 // conditionally hide
  render?: (row: T, rowIndex: number) => ReactNode
  editable?: {
    render: (row: T, onChange: (value: any) => void) => ReactNode
  }
  sortFn?: (a: T, b: T) => number // custom sort comparator
  className?: string               // extra cell classes
}

export type SortState = {
  key: string
  direction: 'asc' | 'desc'
}

export type DataTableProps<T> = {
  data: T[]
  columns: Column<T>[]
  keyField: keyof T

  // Sorting
  sortable?: boolean
  defaultSort?: SortState
  sort?: SortState                 // controlled sort
  onSortChange?: (sort: SortState) => void

  // Rows
  onRowClick?: (row: T) => void
  rowClassName?: (row: T) => string
  emptyMessage?: string            // default: 'No data'

  // Footer
  footer?: ReactNode

  // Loading
  loading?: boolean

  // Editable
  editingRow?: string | number | null

  // Styling
  className?: string               // wrapper override
  compact?: boolean                // tighter padding
}
```

### Usage Examples

**Simple read-only table:**
```tsx
<DataTable
  data={bookings}
  keyField="id"
  columns={[
    { key: 'participantName', header: 'Participant', sortable: true },
    { key: 'tripName', header: 'Trip' },
    { key: 'status', header: 'Status', type: 'badge' },
    { key: 'bookingDate', header: 'Date', type: 'date', sortable: true },
    { key: 'wheelchairRequired', header: 'Accessible', type: 'boolean', align: 'center' },
  ]}
  sortable
  emptyMessage="No bookings yet"
/>
```

**Table with custom renders, actions, and clickable rows:**
```tsx
<DataTable
  data={participants}
  keyField="id"
  onRowClick={(p) => navigate(`/participants/${p.id}`)}
  columns={[
    { key: 'fullName', header: 'Name', sortable: true },
    { key: 'ndisNumber', header: 'NDIS Number' },
    { key: 'status', header: 'Status', render: (p) => (
      <span className={getStatusColor(p.status)}>{p.status}</span>
    )},
    { key: 'actions', header: '', render: (p) => (
      <button onClick={(e) => { e.stopPropagation(); archive(p.id) }}>
        Archive
      </button>
    )},
  ]}
  sortable
/>
```

**Editable table (QualificationsPage pattern):**
```tsx
<DataTable
  data={qualifications}
  keyField="id"
  editingRow={editingId}
  rowClassName={(q) =>
    q.isExpired ? 'bg-[#ffdad6]/10' :
    q.isExpiring ? 'bg-[#fef3c7]/10' : ''
  }
  columns={[
    { key: 'name', header: 'Qualification' },
    {
      key: 'expiryDate',
      header: 'Expiry Date',
      type: 'date',
      editable: {
        render: (q, onChange) => (
          <input type="date" value={q.expiryDate} onChange={e => onChange(e.target.value)} />
        )
      }
    },
    { key: 'status', header: 'Status', render: (q) => <StatusBadge status={q.status} /> },
    { key: 'actions', header: '', render: (q) => <EditSaveCancel row={q} /> },
  ]}
/>
```

**Table with footer (ClaimDetailPage pattern):**
```tsx
<DataTable
  data={lineItems}
  keyField="id"
  columns={claimColumns}
  footer={
    <tr>
      <td colSpan={6} className="p-3 text-right font-semibold">Total</td>
      <td className="p-3 font-bold">{formatCurrency(total)}</td>
      <td colSpan={2} />
    </tr>
  }
/>
```

## Built-in Column Type Behaviors

| Type | Rendering | Default Sort |
|------|-----------|-------------|
| `text` | Raw value, `toString()` | Alphabetical (locale-aware) |
| `date` | `formatDateAu()` from `@/lib/utils` | Chronological |
| `currency` | AUD format: `$1,234.56` | Numeric |
| `boolean` | Checkmark icon when truthy, empty when falsy | Boolean (true first) |
| `badge` | `<span>` with `getStatusColor()` | Alphabetical |
| `custom` | Must provide `render` function | No default (use `sortFn`) |

When a column has a `render` function, the built-in type rendering is bypassed entirely. The `type` is still used for default sorting if `sortable: true` and no `sortFn` is provided.

## Sorting Behavior

- **Sort indicator:** Arrow icons in header cells for sortable columns (up/down/neutral)
- **Click cycle:** neutral -> asc -> desc -> neutral
- **Uncontrolled by default:** internal `useState` manages sort state
- **Controlled mode:** when `sort` and `onSortChange` are provided, the component defers to the consumer
- **Stable sort:** equal elements preserve their original order

## Styling

### CSS Variables (add to theme)

```css
--color-table-bg: var(--color-card);
--color-table-header: var(--color-accent);
--color-table-border: var(--color-border);
--color-table-hover: color-mix(in srgb, var(--color-accent) 50%, transparent);
--color-table-text: var(--color-foreground);
--color-table-text-muted: var(--color-muted-foreground);
```

### Structure

```html
<div class="bg-[var(--color-table-bg)] rounded-2xl border border-[var(--color-table-border)] overflow-x-auto">
  <table class="w-full text-sm">
    <thead class="bg-[var(--color-table-header)]">
      <tr>
        <th class="text-left p-3 text-xs font-medium text-[var(--color-table-text-muted)]">...</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-[var(--color-table-border)]">
      <tr class="hover:bg-[var(--color-table-hover)] transition-colors cursor-pointer?">
        <td class="p-3">...</td>
      </tr>
    </tbody>
    <tfoot><!-- optional footer --></tfoot>
  </table>
</div>
```

### Loading State

A subtle overlay with spinner, matching Dropdown's loading pattern.

### Empty State

Centered message spanning all columns: `<td colSpan={columns.length}>No data</td>`

## Migration Strategy

Migrate tables in order of complexity (simple first) to validate the component API before tackling complex cases:

1. **Phase 1 — Component creation + simple tables**
   - Create `DataTable.tsx`
   - Add CSS variables to theme
   - Migrate: ParticipantDetailPage, BookingsPage

2. **Phase 2 — Medium complexity**
   - Migrate: ParticipantsPage, StaffPage, TasksPage, IncidentsPage
   - Migrate: TripDetailPage Tasks tab

3. **Phase 3 — Complex tables**
   - Migrate: TripDetailPage Claims, Bookings, Staff tabs
   - Migrate: ClaimDetailPage (footer)
   - Migrate: QualificationsPage (editable cells, row coloring, nested)

Each migration should be a self-contained change that doesn't alter behavior — only the underlying markup changes. Visual output should be identical.

## File Structure

```
frontend/src/components/
  DataTable.tsx    # Component + types (exported)
  Dropdown.tsx     # Existing — pattern reference
```

No separate types file — types are co-located and exported from the component file, matching the Dropdown pattern.
