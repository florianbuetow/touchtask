# Sticky Notes Feature Design

## Overview

Add a full-screen sticky notes overlay to TouchTask. Yellow sticky notes (#FFF2B1) float over a dimmed backdrop, freely draggable, with inline editing. Toggle via a Sticker icon in the Project Tracking header.

## Data Model

```js
// New storage key
STORAGE_KEYS.STICKY_NOTES: 'touchtask_sticky_notes'

// Each note
{
  id: string,        // generateId()
  title: string,     // first line — bold, underlined, centered
  body: string,      // remaining text — left-justified
  x: number,         // viewport pixel position
  y: number,
  createdAt: string  // ISO timestamp
}
```

State: `stickyNotes` array, loaded from localStorage on mount, saved on every change. Positions clamped into viewport on load for small screens.

## Toggle Button

- Import `Sticker` from `lucide-react`
- Add as 4th button in `section-meta-buttons` (same `focus-toggle` class)
- New state: `showStickyNotes` (default false)
- Adjacent `+` button visible only when overlay is active — creates a new note at random center offset

## Overlay

- Full-viewport fixed div, rendered as sibling to main layout (not nested inside)
- `position: fixed; inset: 0; z-index: 1000`
- Backdrop: `background: rgba(0, 0, 0, 0.3)`
- Clicking backdrop creates a new note at click position
- Escape key or toggle button dismisses overlay
- Only renders when `showStickyNotes` is true

## Note Visual Design (300x300px)

- Background: `#FFF2B1`
- 3D paper effect via multi-layer `box-shadow` (light inner highlight top-left, darker shadow bottom-right)
- `border-radius: 2px`
- Random slight rotation (+-1-2deg per note) for natural look
- `cursor: grab` / `cursor: grabbing` while dragging

### Content layout (16px padding inset)

- **Title:** Bold, underlined, centered. Underline extends wider than text via extra spaces.
- **Spacer:** One empty line.
- **Body:** Left-justified, normal weight.
- **Font auto-scaling:** Start at base size (~16px), measure overflow via ref, shrink until fits. Minimum 10px.

### Delete button

- Small X, top-right corner
- Semi-transparent, opaque on hover
- Opens existing `ConfirmDialog` with "Delete sticky note?"

### Z-ordering

- Clicked/dragged note moves to top of stack (highest z-index among siblings)

## Interaction: Dragging

- Pointer events (`onPointerDown/Move/Up`) — not HTML5 DnD
- On pointer down: record offset, capture pointer
- On pointer move: update x/y (throttled to animation frames)
- On pointer up: release capture, save position to localStorage
- Notes are `position: absolute` within the fixed overlay, positioned via `left`/`top`
- `e.stopPropagation()` on all note events to prevent backdrop click-to-create and click-through

## Interaction: Editing

- State: `editingNoteId` at overlay level
- Double-click enters edit mode for that note
- Title becomes `<input>` (centered, bold, underlined)
- Body becomes `<textarea>` (left-justified, autoFocus)
- **Enter** on textarea: exit edit mode, save
- **Ctrl+Enter** on textarea: insert newline
- **Enter** on title input: move focus to body textarea
- Click outside note: exit edit mode, save
- Font auto-resize recalculates after exiting edit mode

## Creating Notes

- **Via + button:** Empty note at viewport center + random +-50px offset, immediately enters edit mode
- **Via backdrop click:** Empty note at click coordinates, immediately enters edit mode

## Code Organization

All code added inline to `App.jsx` and `App.css`, consistent with existing codebase patterns. Estimated ~200-250 lines of JSX/logic, ~100 lines of CSS.
