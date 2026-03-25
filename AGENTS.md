# TouchTask Development Guide

This guide covers the patterns and conventions used in TouchTask. Follow these when adding features, panes, or UI elements.

## Architecture

- Monolithic React app: single `frontend/src/App.jsx` file, styled by `frontend/src/App.css`
- No external state management — React hooks + localStorage persistence
- No backend — all data lives in the browser
- Build: Vite, output to `dist/`, deployed to GitHub Pages
- Dev server: `just run` on port 23232

## Adding a New Pane

### 1. Structure

Every pane follows the same skeleton:

```jsx
<div className={`my-section ${!showMySection ? 'hidden' : ''}`}>
  <div className="my-section-header">
    <span className="my-section-label">Section name</span>
  </div>
  {/* content */}
</div>
```

### 2. Card styling

Apply these consistently to every new pane:

```css
.my-section {
    background: var(--paper);
    border-radius: var(--card-radius);
    padding: 1.25rem;
    box-shadow: 0 2px 12px rgb(0 0 0 / 6%);
    margin-bottom: 1rem;
}

.my-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--rule);
}

.my-section-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
}
```

### 3. Toggle visibility

Each pane needs:
- A `showX` state: `const [showMySection, setShowMySection] = useState(true)`
- A toggle icon in the column header using the `focus-toggle` class
- **The icon order in the header must match pane order top-to-bottom** (see UI Rules in CLAUDE.md)

### 4. Placement

Place the pane JSX in the correct column section and position it relative to existing panes. Place the CSS before the next section's styles to maintain file order.

## Persistence (localStorage)

### Storage keys

Always add new keys to the `STORAGE_KEYS` object at the top of App.jsx. The clear/reset/load flows iterate `Object.values(STORAGE_KEYS)` generically, so new keys get cleaned up automatically.

Ephemeral daily data (like counters that reset each day) does not need to be included in the export object.

### Daily-resetting data

Use the `{date: getTodayString(), ...fields}` pattern:

```js
const [myData, setMyData] = useState(() => {
  const defaults = { date: getTodayString(), count: 0 }
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MY_DATA)
    if (data) {
      const parsed = JSON.parse(data)
      if (parsed.date === getTodayString()) {
        return { ...defaults, ...parsed, count: parsed.count ?? 0 }
      }
    }
    return defaults
  } catch { return defaults }
})
```

Key points:
- Compare stored date to today on load; reset if different
- Always use `?? defaultValue` fallbacks when reading fields — this prevents NaN when the data shape changes between versions
- Spread `...defaults` first to fill in any missing fields from old data

### Saving

Save to localStorage immediately on mutation:

```js
const updated = { ...prev, count: prev.count + 1 }
localStorage.setItem(STORAGE_KEYS.MY_DATA, JSON.stringify(updated))
return updated
```

## Confirmation Modals

Use the existing `<ConfirmDialog>` component for any destructive action (clearing data, resetting counters, etc.).

### Pattern

1. Add a boolean state: `const [myConfirmOpen, setMyConfirmOpen] = useState(false)`
2. Trigger it from a button: `onClick={() => setMyConfirmOpen(true)}`
3. Place the dialog with the other confirm dialogs (grouped after the main layout):

```jsx
<ConfirmDialog
  isOpen={myConfirmOpen}
  onClose={() => setMyConfirmOpen(false)}
  onConfirm={() => {
    // do the destructive action
    setMyConfirmOpen(false)
  }}
  title="Action Title"
  message="Are you sure? This action cannot be undone."
/>
```

## Styling Vocabulary

### Typography

| Element        | Font                           | Size     | Weight | Style                          |
|----------------|--------------------------------|----------|--------|--------------------------------|
| Pane labels    | JetBrains Mono                 | 0.6rem   | —      | uppercase, letter-spacing 0.1em |
| Large numbers  | JetBrains Mono                 | 1.75rem  | 500    | —                              |
| Buttons        | JetBrains Mono                 | 0.55–0.6rem | —   | uppercase, letter-spacing 0.05em |
| Task names     | Playfair Display               | 1rem     | 700    | —                              |
| Break/subtitle | JetBrains Mono                 | 0.65rem  | —      | —                              |

### Colors

| Purpose       | Variable / Value         | Light background              |
|---------------|--------------------------|-------------------------------|
| Red / danger  | `var(--accent)`          | `var(--accent-light)`         |
| Green / good  | `var(--success)`         | `var(--success-light)`        |
| Orange / warn | `#e67e22`                | `rgb(230 126 34 / 8%)`       |
| Dark / active | `var(--ink)`             | —                             |
| Grey / muted  | `var(--muted)`           | —                             |
| Borders       | `var(--rule)`            | —                             |
| Background    | `var(--paper)`           | `var(--paper-dark)`           |

### Common UI elements

**Pill buttons:**
```css
padding: 0.4rem 0.6rem;
border: 1px solid var(--rule);
border-radius: 6px;
background: var(--paper);
cursor: pointer;
font-family: 'JetBrains Mono', monospace;
font-size: 0.55rem;
text-transform: uppercase;
letter-spacing: 0.05em;
transition: all 0.15s ease;
```

**Icon buttons (28px square):**
```css
width: 28px;
height: 28px;
display: flex;
align-items: center;
justify-content: center;
background: none;
border: 1px solid var(--rule);
border-radius: 6px;
cursor: pointer;
color: var(--muted);
transition: all 0.15s ease;
```

**Hover states:** Typically `border-color: var(--ink); color: var(--ink);` for neutral, `var(--accent)` for danger.

### Icons

Icons come from `lucide-react`. Import only what you need. Check the existing import line at the top of App.jsx to see what's already available before adding new imports.

## Linting

Run `just ci-quiet` for the full pipeline or `npm run lint` / `npm run lint:css` from the `frontend/` directory for quick checks. Only pre-existing warnings (react-hooks/exhaustive-deps) are acceptable — new errors must be fixed before committing.
