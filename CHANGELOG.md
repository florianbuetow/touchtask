# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This repository does not currently use release tags, so entries are grouped by date and major update scope.

## 2026-03-28

### Added
- Project registry and Themes pane in the Task Tracking column, with persistent theme colors, project associations, task modal project suggestions, and export/import/reset/demo support

### Fixed
- Added modal focus trapping so Tab and Shift+Tab stay inside TouchTask modals and no longer trigger the global sticky-notes shortcut behind an open dialog

## 2026-03-25

### Added
- **Three-column layout** — app restructured from two columns into three: Schedule, Tasks, and Cognitive Load
- **Cognitive Load column** — dedicated third column for managing mental bandwidth, containing:
  - **Current Focus** — single prominent input showing what you're working on now, with drag-to-focus support from tasks and shortlist items
  - **Interruption counter** — track external interruptions with color-coded thresholds (green 0–3, yellow 4–7, red 8+)
  - **Context switch counter** — track self-inflicted context switches with color-coded thresholds (green 0–4, yellow 5–9, red 10+)
  - **Protect Your Focus** — draggable checklist of focus rituals to toggle before deep work, reorderable to match your routine
  - **Energy Levels** — hourly energy tagging (high/medium/low) that builds predicted patterns over time
  - **Pomodoro Timer** — now persists state across page refreshes so sessions survive accidental tab closes
  - **Brain Dump** — scratchpad for intrusive thoughts with expand/shrink, copy, and clear actions
- **Shortlist overhaul** — renamed from "reminders" with drag-and-drop reorder, urgency cycling with auto-sort, restyled pills, and a bulk-add modal replacing the inline input
- Trash buttons on schedule, shortlist, and focus panes
- GitHub Pages deploy via `npx gh-pages` (removed dist/ from git tracking)
- Revamped justfile with grouped help, colored output, `stop`, `status`, and `ci-quiet` targets

### Changed
- UI polish across shortlist, pomodoro, and input fields
- Drawer UX improvements for habit tracker and project board

### Fixed
- Pomodoro and break timers now use absolute end timestamps plus a stateless heartbeat worker, restoring expiry sounds across reloads/background tabs and preventing break-loop restarts
- Timer alerts now unlock and prefer Web Audio playback, with visibility resume handling so pending bells fire reliably after tab refocus

## 2026-02-20 — 2026-02-25

### Added
- **Whiteboard drawer** — freehand drawing canvas using perfect-freehand, with full-viewport layout, undoable eraser, and delete confirmation
- Whiteboard tile thumbnails with drag-and-drop
- **Sticky notes** — floating notes overlay with 3D card styling, right-click to create, drag to reposition, copy-to-clipboard, and auto-clamp to viewport on load/toggle/resize
- Sticky notes keyboard shortcut toggle with button tooltip
- GitHub link icon in header bar

### Fixed
- Sticky notes save content on blur instead of every keystroke (performance)
- Sticky notes viewport clamping on load, toggle, and window resize

### Changed
- Improved project board layout and drag-off-board behavior

## 2026-02-16

### Added
- **Project board** — second drawer pane with cross-board drag-and-drop and project field
- Escape key closes modals, autoFocus on modal inputs

## 2026-02-14

### Added
- Habit tracker panel: bottom-drawer anchored to the habits column with a tab-shaped trigger button flush to the viewport bottom, sliding 200ms animation, and click-outside-to-close behavior
- Track daily habits over a rolling 30-day window using color-coded toggle buttons (neutral → orange → green → red)
- Add, edit (double-click title), and delete habits via modal dialogs
- Day-of-week abbreviations and dd/mm dates displayed above toggle buttons, with today highlighted in red
- Habit tracker data persisted in localStorage and included in backup/restore and reset flows
- Custom TouchTask favicon replacing the default Vite favicon, with support for apple-touch-icon, Android Chrome icons, and web app manifest
- CI pipeline via `just ci` running ESLint, Stylelint, HTML validation, Knip (dead code), Plato (complexity), Jest (tests), and Lighthouse (performance audit)
- CI toolchain dev dependencies: Jest, Testing Library, Stylelint, Knip, Plato, html-validator-cli, nyc, Babel
- Configuration files for Jest, Stylelint, Knip, nyc, and Babel
- Configurable dev server port in justfile (default 23232, override with `just --set port 9000 run`)
- Port-in-use detection — `just run` and `just preview` exit with an error if the port is already occupied
- `strictPort: true` in Vite config to prevent silent port switching
- Project badges in README (Made with AI, Verified by Humans)

### Changed
- Modernized CSS syntax: `rgba()` to `rgb()`, `top/left/right/bottom` to `inset`, `flex-direction`/`flex-wrap` to `flex-flow`, vendor-prefixed `appearance` to standard, `max-width` media query to range syntax
- Updated production build output

## 2025-05-01

### Added
- Initial release of TouchTask
- Time blocks with recurring daily habits, subtask tracking, and progress indicators
- Pomodoro timer with 4 presets (10/2, 25/5, 50/10, 90/15) and automatic time logging to tasks
- Kanban board with Backlog, Week, Progress, and Done columns
- Daily schedule for one-time appointments and meetings
- Reminders as quick sticky notes
- Focus mode to show only today's scheduled blocks
- Drag-and-drop for kanban tasks and pomodoro task assignment
- Data backup/restore via JSON export and import
- Demo data loader
- Settings for configurable day start time
- All data stored client-side in localStorage
- Deployed to GitHub Pages
