# Sticky Notes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a full-screen sticky notes overlay with freely draggable, inline-editable yellow notes to TouchTask.

**Architecture:** All code inline in App.jsx and App.css, following the existing monolithic pattern. Sticky notes use pointer events for dragging (not HTML5 DnD), localStorage persistence via the standard load/save pattern, and the existing ConfirmDialog for delete confirmation.

**Tech Stack:** React (useState, useEffect, useCallback, useRef), lucide-react (Sticker, Plus icons), CSS (3D box-shadow, fixed positioning)

**Design doc:** `docs/plans/2026-02-21-sticky-notes-design.md`

---

### Task 1: Storage layer — load/save functions and storage key

**Files:**
- Modify: `frontend/src/App.jsx:62-73` (STORAGE_KEYS object)
- Modify: `frontend/src/App.jsx` (after line ~483, add load/save functions)

**Step 1: Add storage key**

In the `STORAGE_KEYS` object at line 62, add after `WHITEBOARDS`:

```js
STICKY_NOTES: 'touchtask_sticky_notes',
```

**Step 2: Add load/save functions**

After the `saveWhiteboards` function (around line 483), add:

```js
const loadStickyNotes = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STICKY_NOTES)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('Error loading sticky notes:', e)
    return []
  }
}

const saveStickyNotes = (data) => {
  localStorage.setItem(STORAGE_KEYS.STICKY_NOTES, JSON.stringify(data))
}
```

**Step 3: Verify no syntax errors**

Run: `cd frontend && npx eslint src/App.jsx --quiet`
Expected: No errors

**Step 4: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat(sticky-notes): add storage key and load/save functions"
```

---

### Task 2: State and CRUD handlers

**Files:**
- Modify: `frontend/src/App.jsx:2` (import line — add Sticker, Plus)
- Modify: `frontend/src/App.jsx:~526` (state declarations area)
- Modify: `frontend/src/App.jsx:~1338` (after reminder handlers, add sticky note handlers)

**Step 1: Update import**

On line 2, add `Sticker` and `Plus` to the lucide-react import:

```js
import { BarChart3, Bell, BellOff, Eye, EyeOff, Menu, Pen, Pencil, Plus, Recycle, Sticker, StickyNote, Timer, Columns4, CalendarCheck, LayoutList, Eraser, Undo2, Redo2, Trash2 } from 'lucide-react'
```

**Step 2: Add state declarations**

After the section visibility state block (around line 586), add:

```js
// Sticky notes state
const [stickyNotes, setStickyNotes] = useState([])
const [showStickyNotes, setShowStickyNotes] = useState(false)
const [editingNoteId, setEditingNoteId] = useState(null)
const [draggingNoteId, setDraggingNoteId] = useState(null)
const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
const [topNoteId, setTopNoteId] = useState(null)
const [deletingNoteId, setDeletingNoteId] = useState(null)
```

**Step 3: Add initialization in the existing useEffect**

Find the useEffect that loads initial data (where `setReminders(loadReminders())` is called). Add:

```js
setStickyNotes(loadStickyNotes())
```

**Step 4: Add CRUD handlers**

After the reminder handlers section (around line 1338), add a new section:

```js
// ============================================
// STICKY NOTES HANDLERS
// ============================================

const addStickyNote = (x, y) => {
  const newNote = {
    id: generateId(),
    title: '',
    body: '',
    x,
    y,
    createdAt: new Date().toISOString()
  }
  const updated = [...stickyNotes, newNote]
  setStickyNotes(updated)
  saveStickyNotes(updated)
  setEditingNoteId(newNote.id)
  setTopNoteId(newNote.id)
  return newNote
}

const updateStickyNote = (id, changes) => {
  const updated = stickyNotes.map(n => n.id === id ? { ...n, ...changes } : n)
  setStickyNotes(updated)
  saveStickyNotes(updated)
}

const deleteStickyNote = (id) => {
  const updated = stickyNotes.filter(n => n.id !== id)
  setStickyNotes(updated)
  saveStickyNotes(updated)
  if (editingNoteId === id) setEditingNoteId(null)
  setDeletingNoteId(null)
}
```

**Step 5: Verify**

Run: `cd frontend && npx eslint src/App.jsx --quiet`
Expected: No errors (some unused variable warnings are OK — they'll be used in later tasks)

**Step 6: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat(sticky-notes): add state, imports, and CRUD handlers"
```

---

### Task 3: Toggle button in Project Tracking header

**Files:**
- Modify: `frontend/src/App.jsx:2105-2127` (section-meta-buttons area)

**Step 1: Add the Sticker toggle and + button**

After the existing Columns4 button (line 2126) and before the closing `</div>` of `section-meta-buttons`, add:

```jsx
<button
  className={`focus-toggle ${showStickyNotes ? 'active' : ''}`}
  onClick={() => setShowStickyNotes(!showStickyNotes)}
  title={showStickyNotes ? 'Hide sticky notes' : 'Show sticky notes'}
>
  <Sticker size={14} />
</button>
{showStickyNotes && (
  <button
    className="focus-toggle active"
    onClick={() => {
      const x = window.innerWidth / 2 - 150 + (Math.random() - 0.5) * 100
      const y = window.innerHeight / 2 - 150 + (Math.random() - 0.5) * 100
      addStickyNote(x, y)
    }}
    title="Add sticky note"
  >
    <Plus size={14} />
  </button>
)}
```

**Step 2: Verify**

Run: `cd frontend && npx eslint src/App.jsx --quiet`
Expected: No errors

**Step 3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat(sticky-notes): add toggle and add buttons to header"
```

---

### Task 4: Overlay and StickyNote component

**Files:**
- Modify: `frontend/src/App.jsx` (after AlertDialog component, around line 4300 — add StickyNote component)
- Modify: `frontend/src/App.jsx:~2590-2598` (before closing `</>`, add overlay JSX)

**Step 1: Add the StickyNote function component**

After the `AlertDialog` component (around line 4310), add:

```jsx
// ============================================
// STICKY NOTE COMPONENT
// ============================================

function StickyNoteCard({ note, isEditing, isTop, onStartEdit, onStopEdit, onUpdate, onDelete, onBringToFront, onDragStart, onDragMove, onDragEnd, isDragging }) {
  const titleRef = useRef(null)
  const bodyRef = useRef(null)
  const contentRef = useRef(null)
  const [fontSize, setFontSize] = useState(16)

  // Generate stable random rotation from note id
  const rotation = useMemo(() => {
    let hash = 0
    for (let i = 0; i < note.id.length; i++) {
      hash = ((hash << 5) - hash) + note.id.charCodeAt(i)
      hash |= 0
    }
    return (hash % 5) - 2 // -2 to 2 degrees
  }, [note.id])

  // Auto-size font to fit content
  useEffect(() => {
    if (isEditing || !contentRef.current) return
    const el = contentRef.current
    let size = 18
    el.style.fontSize = size + 'px'
    while (el.scrollHeight > el.clientHeight && size > 10) {
      size -= 1
      el.style.fontSize = size + 'px'
    }
    setFontSize(size)
  }, [note.title, note.body, isEditing])

  // Focus body textarea when entering edit mode
  useEffect(() => {
    if (isEditing && bodyRef.current) {
      bodyRef.current.focus()
    }
  }, [isEditing])

  const handlePointerDown = (e) => {
    if (isEditing) return
    e.stopPropagation()
    onBringToFront(note.id)
    onDragStart(note.id, e.clientX - note.x, e.clientY - note.y)
    e.target.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (!isDragging) return
    e.stopPropagation()
    onDragMove(e.clientX, e.clientY)
  }

  const handlePointerUp = (e) => {
    if (!isDragging) return
    e.stopPropagation()
    onDragEnd()
  }

  const handleDoubleClick = (e) => {
    e.stopPropagation()
    onStartEdit(note.id)
  }

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      bodyRef.current?.focus()
    }
  }

  const handleBodyKeyDown = (e) => {
    if (e.key === 'Enter' && !e.ctrlKey) {
      e.preventDefault()
      onStopEdit()
    }
    // Ctrl+Enter = newline (default textarea behavior, just don't intercept)
  }

  return (
    <div
      className={`sticky-note ${isDragging ? 'dragging' : ''}`}
      style={{
        left: note.x,
        top: note.y,
        zIndex: isTop ? 10 : 1,
        transform: `rotate(${rotation}deg)`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      onClick={(e) => { e.stopPropagation(); onBringToFront(note.id) }}
    >
      <button
        className="sticky-note-delete"
        onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
        title="Delete note"
      >
        &times;
      </button>

      {isEditing ? (
        <div className="sticky-note-content editing">
          <input
            ref={titleRef}
            className="sticky-note-title-input"
            value={note.title}
            onChange={(e) => onUpdate(note.id, { title: e.target.value })}
            onKeyDown={handleTitleKeyDown}
            placeholder="Title"
          />
          <div className="sticky-note-spacer" />
          <textarea
            ref={bodyRef}
            className="sticky-note-body-input"
            value={note.body}
            onChange={(e) => onUpdate(note.id, { body: e.target.value })}
            onKeyDown={handleBodyKeyDown}
            placeholder="Type here..."
          />
        </div>
      ) : (
        <div className="sticky-note-content" ref={contentRef} style={{ fontSize }}>
          {note.title && (
            <div className="sticky-note-title">
              &nbsp;&nbsp;{note.title}&nbsp;&nbsp;
            </div>
          )}
          {note.title && <div className="sticky-note-spacer" />}
          {note.body && (
            <div className="sticky-note-body">{note.body}</div>
          )}
          {!note.title && !note.body && (
            <div className="sticky-note-placeholder">Double-click to edit</div>
          )}
        </div>
      )}
    </div>
  )
}
```

**NOTE:** Add `useMemo` to the React import on line 1:

```js
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
```

**Step 2: Add the overlay JSX**

In the main App return, before the closing `</>` (line 2598) and after the AlertDialog, add:

```jsx
{/* Sticky Notes Overlay */}
{showStickyNotes && (
  <div
    className="sticky-notes-overlay"
    onClick={(e) => {
      if (editingNoteId) {
        setEditingNoteId(null)
        return
      }
      const x = e.clientX - 150
      const y = e.clientY - 150
      addStickyNote(x, y)
    }}
    onKeyDown={(e) => {
      if (e.key === 'Escape') {
        if (editingNoteId) {
          setEditingNoteId(null)
        } else {
          setShowStickyNotes(false)
        }
      }
    }}
    tabIndex={-1}
    ref={useCallback((el) => { if (el) el.focus() }, [])}
  >
    {stickyNotes.map(note => (
      <StickyNoteCard
        key={note.id}
        note={note}
        isEditing={editingNoteId === note.id}
        isTop={topNoteId === note.id}
        isDragging={draggingNoteId === note.id}
        onStartEdit={(id) => setEditingNoteId(id)}
        onStopEdit={() => setEditingNoteId(null)}
        onUpdate={updateStickyNote}
        onDelete={(id) => setDeletingNoteId(id)}
        onBringToFront={(id) => setTopNoteId(id)}
        onDragStart={(id, ox, oy) => {
          setDraggingNoteId(id)
          setDragOffset({ x: ox, y: oy })
        }}
        onDragMove={(cx, cy) => {
          if (draggingNoteId) {
            updateStickyNote(draggingNoteId, {
              x: cx - dragOffset.x,
              y: cy - dragOffset.y
            })
          }
        }}
        onDragEnd={() => setDraggingNoteId(null)}
      />
    ))}
  </div>
)}

{/* Delete Sticky Note Confirmation */}
<ConfirmDialog
  isOpen={deletingNoteId !== null}
  onClose={() => setDeletingNoteId(null)}
  onConfirm={() => deleteStickyNote(deletingNoteId)}
  title="Delete Sticky Note"
  message="Are you sure you want to delete this sticky note?"
/>
```

**Step 3: Verify**

Run: `cd frontend && npx eslint src/App.jsx --quiet`
Expected: No errors

**Step 4: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat(sticky-notes): add StickyNoteCard component and overlay"
```

---

### Task 5: CSS — overlay, note card, 3D styling, delete button

**Files:**
- Modify: `frontend/src/App.css` (append at end of file, after line 2253)

**Step 1: Add all sticky note CSS**

Append to end of `App.css`:

```css
/* ============================================
   STICKY NOTES
   ============================================ */

.sticky-notes-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 1000;
    outline: none;
}

.sticky-note {
    position: absolute;
    width: 300px;
    height: 300px;
    background: #FFF2B1;
    border-radius: 2px;
    cursor: grab;
    user-select: none;
    box-shadow:
        /* 3D paper edge — bottom/right thickness */
        2px 2px 0 0 #e6d98a,
        3px 3px 0 0 #d4c878,
        /* Lift shadow */
        6px 6px 16px rgba(0, 0, 0, 0.18),
        /* Subtle inner highlight top-left */
        inset 1px 1px 0 rgba(255, 255, 255, 0.5);
    transition: box-shadow 0.15s ease;
    touch-action: none;
}

.sticky-note.dragging {
    cursor: grabbing;
    box-shadow:
        2px 2px 0 0 #e6d98a,
        3px 3px 0 0 #d4c878,
        10px 10px 24px rgba(0, 0, 0, 0.25),
        inset 1px 1px 0 rgba(255, 255, 255, 0.5);
}

.sticky-note-delete {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 22px;
    height: 22px;
    border: none;
    background: transparent;
    color: #a08a40;
    font-size: 16px;
    line-height: 22px;
    text-align: center;
    cursor: pointer;
    border-radius: 50%;
    opacity: 0.4;
    transition: opacity 0.15s ease, background 0.15s ease;
    z-index: 2;
}

.sticky-note-delete:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.08);
}

.sticky-note-content {
    padding: 16px;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.sticky-note-content.editing {
    overflow: visible;
}

.sticky-note-title {
    font-weight: 700;
    text-align: center;
    text-decoration: underline;
    text-underline-offset: 3px;
    word-break: break-word;
    flex-shrink: 0;
    color: #3d3500;
}

.sticky-note-spacer {
    height: 1.2em;
    flex-shrink: 0;
}

.sticky-note-body {
    text-align: left;
    word-break: break-word;
    white-space: pre-wrap;
    flex: 1;
    overflow: hidden;
    color: #3d3500;
}

.sticky-note-placeholder {
    color: #a08a40;
    font-style: italic;
    text-align: center;
    margin-top: 50%;
}

/* Edit mode inputs */
.sticky-note-title-input {
    width: 100%;
    border: none;
    background: transparent;
    font-weight: 700;
    text-align: center;
    text-decoration: underline;
    text-underline-offset: 3px;
    font-family: inherit;
    font-size: inherit;
    color: #3d3500;
    outline: none;
    padding: 0;
}

.sticky-note-title-input::placeholder {
    color: #a08a40;
    font-weight: 400;
}

.sticky-note-body-input {
    width: 100%;
    flex: 1;
    border: none;
    background: transparent;
    font-family: inherit;
    font-size: inherit;
    color: #3d3500;
    outline: none;
    resize: none;
    padding: 0;
    white-space: pre-wrap;
}

.sticky-note-body-input::placeholder {
    color: #a08a40;
}
```

**Step 2: Verify the app renders**

Run: `cd frontend && npx eslint src/App.jsx --quiet`
Expected: No errors

**Step 3: Commit**

```bash
git add frontend/src/App.css
git commit -m "feat(sticky-notes): add CSS for overlay, note card, and 3D styling"
```

---

### Task 6: Include sticky notes in save/load/reset/demo data flows

**Files:**
- Modify: `frontend/src/App.jsx` — find the save/load/reset/demo handlers

**Step 1: Find and update the data export (save) handler**

Search for where `STORAGE_KEYS.REMINDERS` or similar keys appear in the save/export logic. Add `STICKY_NOTES: stickyNotes` to the exported data object.

**Step 2: Find and update the data import (load) handler**

In the load/import handler, add:

```js
if (parsed.STICKY_NOTES) {
  setStickyNotes(parsed.STICKY_NOTES)
  saveStickyNotes(parsed.STICKY_NOTES)
}
```

**Step 3: Find and update the reset handler**

In the reset handler, add:

```js
setStickyNotes([])
saveStickyNotes([])
```

Also add `localStorage.removeItem(STORAGE_KEYS.STICKY_NOTES)` if the reset uses removeItem.

**Step 4: Verify**

Run: `cd frontend && npx eslint src/App.jsx --quiet`
Expected: No errors

**Step 5: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat(sticky-notes): integrate with save/load/reset data flows"
```

---

### Task 7: Manual testing and polish

**Step 1: Start dev server**

Run: `just run`

**Step 2: Test checklist**

Verify each behavior in the browser:

1. Sticker toggle button appears in Project Tracking header
2. Clicking it shows the dimmed overlay
3. `+` button appears when overlay is active
4. Clicking `+` creates a note near center, enters edit mode
5. Clicking overlay backdrop creates a note at click position, enters edit mode
6. Double-click a note to enter edit mode
7. Type a title, press Enter to move to body
8. Type body text, press Enter to exit edit
9. Ctrl+Enter inserts a newline in body
10. Drag a note around — smooth, no click-through
11. Click a note — it comes to front (z-index)
12. Click X on a note — confirmation dialog appears
13. Confirm delete — note is removed
14. Escape key (not editing) — overlay closes
15. Escape key (while editing) — exits edit mode
16. Notes persist after page reload
17. Text auto-sizes to fill the note when long content is added
18. 3D shadow effect looks correct
19. Notes have slight random rotation

**Step 3: Fix any issues found**

Address any visual or behavioral issues.

**Step 4: Commit fixes**

```bash
git add frontend/src/App.jsx frontend/src/App.css
git commit -m "fix(sticky-notes): polish from manual testing"
```

---

### Task 8: Production build

**Step 1: Build**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors

**Step 2: Lint check**

Run: `cd frontend && npm run lint`
Expected: No errors

**Step 3: Commit build output if needed**

```bash
git add dist/
git commit -m "Update production build output"
```
