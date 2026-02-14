# Habit Tracker Panel Design

## Overview

A bottom-drawer panel anchored to the habits column that lets users track daily habits over a rolling 30-day window with color-coded toggle buttons.

## Layout & Positioning

**Trigger button:** Fixed-position button pinned to the bottom of the viewport, aligned to the right edge of the habits column. Uses a lucide icon (e.g. `CalendarCheck`). Styled consistently with existing section toggle buttons. Stays visible whether the drawer is open or closed.

**Drawer panel:** A `position: fixed` container anchored to the bottom of the viewport, spanning the width of the habits column. Hidden by default. When open, overlays the habits section content (does not push content). No backdrop dimming. Clicking the button again or clicking outside closes it.

**Max height:** `calc(100vh - <habits section top + section header height>)` so it never covers the header or "Today's Habits" title. Content scrolls vertically if needed.

## Data Model

Stored in localStorage under `touchtask_habit_tracker`:

```json
{
  "habits": [
    {
      "id": "uuid",
      "name": "Meditation",
      "description": "10 min morning session",
      "created_at": "2026-02-14T...",
      "entries": {
        "2026-02-14": "green",
        "2026-02-13": "orange",
        "2026-02-12": "red"
      }
    }
  ]
}
```

- `entries` maps date strings (`YYYY-MM-DD`) to states: absent = neutral, `"green"` = done, `"orange"` = partial, `"red"` = not done
- Clicking a day button cycles: neutral -> green -> orange -> red -> neutral
- Only the past 30 days are displayed but older entries are preserved in storage
- Loaded into React state on mount, saved to localStorage on every change

## UI Components

### Habit rows

Each habit is a single row with 30 small square toggle buttons (left-aligned) and the habit title right-aligned at the end.

A shared header row above all habits shows two-letter day abbreviations (Mo, Tu, We, Th, Fr, Sa, Su) for each of the 30 columns. Today's column header uses red text (`var(--accent)`).

Button colors by state:
- Neutral: `var(--paper-dark)`
- Green (done): `var(--success)`
- Orange (partial): `#e67e22`
- Red (not done): `var(--accent)`

Habit title shows the description as a tooltip on hover.

### Drawer header

- Title "Habit Tracker" in `Playfair Display` font matching other section titles
- "+ Add" button consistent with existing add buttons

### Add/Edit modal

Reuses the existing `.modal-overlay` + `.modal` pattern:
- Two fields: name (required) and description (optional)
- Edit mode triggered by double-clicking a habit title: same modal pre-filled, with a delete button in the footer

## Animation

- `transition: transform 200ms ease-out` on the drawer container
- Closed: `transform: translateY(100%)`
- Open: `transform: translateY(0)`

## Responsive Behavior

- Drawer width and left offset dynamically matched to the habits section via `ref` + `getBoundingClientRect()`, updated on open and window resize
- Mobile (single-column layout): drawer goes full-width
- If the column is too narrow for 30 buttons + title, the row scrolls horizontally (`overflow-x: auto`)
- Toggle buttons are ~24-28px square
