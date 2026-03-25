import { useState, useRef, useEffect } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export type DropdownItem = {
  value: string
  label: string
  icon?: ReactNode
  description?: string
  disabled?: boolean
}

type DropdownProps = {
  variant: 'pill' | 'form' | 'menu'
  items: DropdownItem[]

  // Value control — pill and form variants
  value?: string
  onChange?: (value: string) => void
  // Menu variant: fires on item selection, no tracked value
  onSelect?: (value: string) => void
  // Form variant: forward field.onBlur from RHF Controller
  onBlur?: () => void

  // Trigger appearance
  label?: string            // button text (menu), placeholder text (form)
  icon?: ReactNode          // leading icon on trigger (menu variant)
  colorClass?: string       // Tailwind color classes for pill trigger background
  disabled?: boolean        // caller controls — not auto-applied on empty items
  loading?: boolean

  // Panel alignment — default varies by variant: pill='right', form='left', menu='right'
  align?: 'left' | 'right'
}

export function Dropdown({
  variant,
  items,
  value,
  onChange,
  onSelect,
  onBlur,
  label,
  icon,
  colorClass = '',
  disabled = false,
  loading = false,
  align,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Per-variant default alignment
  const resolvedAlign = align ?? (variant === 'form' ? 'left' : 'right')

  // Click-outside: close and fire onBlur
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setFocusedIndex(-1)
        onBlur?.()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onBlur])

  const handleSelect = (item: DropdownItem) => {
    if (item.disabled) return
    if (variant === 'menu') {
      onSelect?.(item.value)
    } else {
      onChange?.(item.value)
      onBlur?.()
    }
    setOpen(false)
    setFocusedIndex(-1)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || loading) return

    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        setOpen(true)
        // Start focus on first non-disabled item
        const first = items.findIndex(i => !i.disabled)
        setFocusedIndex(first >= 0 ? first : 0)
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      setFocusedIndex(-1)
      onBlur?.()
      triggerRef.current?.focus()
      return
    }
    if (e.key === 'Tab') {
      // Do NOT preventDefault — let Tab move focus naturally
      setOpen(false)
      setFocusedIndex(-1)
      onBlur?.()
      return
    }

    // Arrow keys skip disabled items
    const enabledIndices = items
      .map((item, i) => (item.disabled ? -1 : i))
      .filter(i => i !== -1)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const pos = enabledIndices.indexOf(focusedIndex)
      const next = enabledIndices[(pos + 1) % enabledIndices.length]
      setFocusedIndex(next ?? 0)
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const pos = enabledIndices.indexOf(focusedIndex)
      const prev = enabledIndices[(pos - 1 + enabledIndices.length) % enabledIndices.length]
      setFocusedIndex(prev ?? 0)
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (focusedIndex === -1) {
        const first = items.findIndex(i => !i.disabled)
        if (first >= 0) setFocusedIndex(first)
        return
      }
      const focused = items[focusedIndex]
      if (focused && !focused.disabled) handleSelect(focused)
    }
  }

  const selectedLabel = items.find(i => i.value === value)?.label

  // Chevron / loading spinner
  const chevron =
    loading && variant !== 'menu' ? (
      <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
    ) : (
      <ChevronDown
        className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
      />
    )

  // Floating panel
  const panelAlignClass = resolvedAlign === 'left' ? 'left-0' : 'right-0'
  const panelWidthClass =
    variant === 'form' ? 'w-full' : variant === 'pill' ? 'min-w-[10rem]' : 'w-56'

  const panel = open && (
    <div
      role="listbox"
      className={`absolute top-full mt-2 bg-white rounded-2xl shadow-[0_24px_40px_-12px_rgba(27,28,26,0.14)] overflow-hidden z-50 ${panelAlignClass} ${panelWidthClass}`}
    >
      {items.length === 0 ? (
        <p className="px-4 py-3 text-sm text-[#43493a] opacity-50">No options available</p>
      ) : (
        items.map((item, idx) => (
          <div key={item.value}>
            {/* Divider between menu items that carry a description */}
            {variant === 'menu' && idx > 0 && item.description && (
              <div className="h-px bg-[rgba(195,201,181,0.25)] mx-4" />
            )}
            <button
              role="option"
              aria-selected={variant !== 'menu' ? item.value === value : undefined}
              aria-disabled={item.disabled ? 'true' : undefined}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => !item.disabled && setFocusedIndex(idx)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-[#1b1c1a] text-left transition-colors ${
                item.disabled
                  ? 'opacity-40 cursor-not-allowed'
                  : focusedIndex === idx
                  ? 'bg-[#f5f3ef]'
                  : 'hover:bg-[#f5f3ef]'
              }`}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              <div className="min-w-0">
                <p className={item.description ? 'font-semibold' : ''}>{item.label}</p>
                {item.description && (
                  <p className="text-[11px] text-[#43493a]">{item.description}</p>
                )}
              </div>
            </button>
          </div>
        ))
      )}
    </div>
  )

  // ── pill variant ──────────────────────────────────────────────────────────
  if (variant === 'pill') {
    return (
      <div className="relative inline-flex items-center" ref={containerRef}>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled || loading}
          onClick={() => setOpen(v => !v)}
          onKeyDown={handleKeyDown}
          className={`text-xs pl-2.5 pr-6 py-1 rounded-full font-medium cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[#396200]/25 hover:shadow-[0_0_0_2px_rgba(57,98,0,0.18)] disabled:opacity-60 disabled:pointer-events-none ${colorClass}`}
        >
          {selectedLabel ?? label ?? '—'}
        </button>
        <span className="absolute right-1.5 pointer-events-none opacity-60">
          {chevron}
        </span>
        {panel}
      </div>
    )
  }

  // ── form variant ──────────────────────────────────────────────────────────
  if (variant === 'form') {
    return (
      <div className="relative w-full" ref={containerRef}>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled || loading}
          onClick={() => setOpen(v => !v)}
          onKeyDown={handleKeyDown}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#396200]/25 hover:shadow-[0_0_0_2px_rgba(57,98,0,0.18)] transition-all disabled:opacity-60 disabled:pointer-events-none bg-[var(--color-input)] text-[var(--color-foreground)]"
        >
          <span className={selectedLabel ? '' : 'opacity-50 text-[var(--color-muted-foreground)]'}>
            {selectedLabel ?? label ?? 'Select…'}
          </span>
          {chevron}
        </button>
        {panel}
      </div>
    )
  }

  // ── menu variant ──────────────────────────────────────────────────────────
  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled || loading}
        onClick={() => setOpen(v => !v)}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-2 px-5 py-2.5 text-sm bg-gradient-to-br from-[#396200] to-[#4d7c0f] text-white rounded-full font-bold shadow-lg shadow-[#396200]/20 hover:opacity-90 disabled:opacity-50 transition-all"
      >
        {icon}
        {label}
        {chevron}
      </button>
      {panel}
    </div>
  )
}
