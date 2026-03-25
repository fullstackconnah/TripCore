# Shared Dropdown Component — Design Spec

**Date:** 2026-03-25
**Project:** TripCore Frontend
**Status:** Approved

---

## Goal

Replace all dropdown-like UI patterns across the platform with a single shared `Dropdown` component. This eliminates duplicated open/close logic, click-outside handling, and styling, and ensures visual consistency across action menus, inline status selects, and form selects.

---

## Component

**Location:** `frontend/src/components/Dropdown.tsx`

### Types

```typescript
type DropdownItem = {
  value: string
  label: string
  icon?: React.ReactNode      // leading icon (menu variant)
  description?: string        // subtitle line (menu variant)
}

type DropdownProps = {
  variant: 'pill' | 'form' | 'menu'
  items: DropdownItem[]

  // Value control — pill and form variants
  value?: string
  onChange?: (value: string) => void

  // Trigger appearance
  label?: string              // button text (menu), placeholder text (form)
  icon?: React.ReactNode      // leading icon on trigger (menu variant)
  colorClass?: string         // Tailwind color classes for pill trigger background
  disabled?: boolean
  loading?: boolean

  // Panel alignment relative to trigger
  align?: 'left' | 'right'   // default: 'right'
}
```

---

## Variants

### `pill`
- **Trigger:** Compact `rounded-full` badge. Background driven by `colorClass` (from `getStatusColor()`). Shows selected item's `label`.
- **Use case:** Inline table/list edits — booking status, insurance status, assignment role.
- **Behaviour:** `onChange` fires immediately on item selection. No placeholder needed.

### `form`
- **Trigger:** Full-width, shows selected label or `label` prop as placeholder. Trailing chevron. No border at rest; hover/focus shows subtle ring matching existing `inputClass` focus style.
- **Use case:** Create/edit form fields — event template, status, lead coordinator, activity type.
- **Behaviour:** `onChange` fires on selection. Integrates with react-hook-form via `<Controller value={field.value} onChange={field.onChange} />`.

### `menu`
- **Trigger:** Green gradient button (`from-[#396200] to-[#4d7c0f]`) with optional leading `icon`, `label` text, and rotating chevron. Matches existing Export button exactly.
- **Use case:** Action menus — Export Trip Package.
- **Behaviour:** Uses `onSelect` callback (no controlled value). Items support `icon`, `label`, and optional `description` subtitle.

---

## Shared Behaviour (All Variants)

- **Open/close:** `useState(false)` toggle on trigger click.
- **Click-outside:** `useRef` + `mousedown` listener on `document`. Cleans up on close.
- **Chevron:** Rotates 180° when open (`transition-transform duration-200`).
- **Panel:** `absolute top-full mt-2`, `rounded-2xl`, `shadow-[0_24px_40px_-12px_rgba(27,28,26,0.14)]`, `z-50`, `overflow-hidden`, `bg-white`.
- **Alignment:** `right-0` (default) or `left-0` via `align` prop.
- **Dividers:** `<div className="h-px bg-[rgba(195,201,181,0.25)] mx-4" />` between items when items have descriptions (menu variant).

---

## Rollout — Files to Update

| File | What Changes |
|------|-------------|
| `frontend/src/components/Dropdown.tsx` | **Create** — shared component |
| `frontend/src/components/ItineraryTab.tsx` | Replace Export button + menu → `variant="menu"` |
| `frontend/src/pages/TripDetailPage.tsx` | Replace booking status + insurance `<select>` → `variant="pill"` |
| `frontend/src/pages/SchedulePage.tsx` | Replace role, sleepover type, driver `<select>` → `variant="pill"` / `"form"` |
| `frontend/src/pages/TripCreatePage.tsx` | Replace event template, status, lead coordinator `<select>` → `variant="form"` with `<Controller>` |
| `frontend/src/components/AddActivityModal.tsx` | Replace library + status `<select>` → `variant="form"` |
| Edit modals in `TripsPage.tsx` + `TripDetailPage.tsx` | Replace `<select>` fields → `variant="form"` |

**Out of scope:** Search inputs with icon overlays (not dropdowns).

---

## React Hook Form Integration

Form-variant dropdowns are not native inputs, so they cannot use `register()`. Use `<Controller>` instead:

```tsx
<Controller
  control={control}
  name="status"
  render={({ field }) => (
    <Dropdown
      variant="form"
      items={statusItems}
      value={field.value}
      onChange={field.onChange}
      label="Select status"
    />
  )}
/>
```

---

## What Is Not Changing

- Search inputs with icon overlays (participants search, trips filter bar)
- Collapsible section toggles in `SchedulePage.tsx` (expand/collapse rows)
- Any `<input type="text">` or `<textarea>` fields
