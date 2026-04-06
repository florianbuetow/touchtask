# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Outline for Tomorrow pane in the Habits column with two side-by-side textareas separated by a draggable resizable divider (persisted as %), copy-all, clear, and toggle via Sunrise icon.
- Intermittent Fasting pane in the Habits column with animated diagonal-stripe progress bar, elapsed counter (HH:MM:SS), start time picker with yesterday/today selection, duration goal presets, and persistent state.
- Three-column layout with Schedule, Tasks, and Cognitive Load columns.
- Cognitive Load column with current focus input, interruption counter, context switch counter, focus ritual checklist, and hourly energy level tagging.
- Click-to-cycle energy levels (high/medium/low) on hour blocks.
- Brain dump pane for capturing intrusive thoughts with expand/shrink, copy, and clear actions.
- Shortlist pane (renamed from reminders) with drag-and-drop reorder, urgency cycling with auto-sort, bulk-add modal, and restyled pills.
- Pomodoro timer with persistent state and custom presets across page refreshes.
- Break pane with activity icons, timer overlay, volume control, and configurable activity settings.
- Themes pane with central project registry, persistent theme colors, and project board sync.
- Drag-and-drop pane reordering with persistent layout and drop indicator.
- Dynamic toggle icons in column headers that reorder to match pane layout.
- Speech-to-text recording modal for hands-free input.
- Trash buttons on schedule, shortlist, and focus panes.
- Habit tracker with bottom-drawer, rolling 30-day grid, color-coded toggles, CRUD via modals, and CSS tooltips.
- Sticky notes overlay with 3D card styling, right-click to create, copy-to-clipboard, viewport clamping, and keyboard shortcut toggle.
- Whiteboard with freehand drawing (perfect-freehand), undoable eraser, thumbnail tiles, drag-and-drop, and full-viewport layout.
- Project board with cross-board drag-and-drop and project field support.
- Escape key to close modals and autoFocus on modal inputs.
- GitHub link icon in header bar.
- Privacy disclaimer in about modal with improved text readability.
- Pane visibility persistence across page reloads, including Habits column toggles (fasting, meetings, time blocks).
- GitHub Pages deployment pipeline.
- CI toolchain with ESLint, Stylelint, Jest, Knip, Plato, and HTML validation.
- Configurable dev server port with port-in-use detection.
- Demo data loaders for habits, sticky notes, and whiteboard.

### Changed

- Replaced default Vite favicon with custom TouchTask favicon and app manifest.
- Modernized CSS syntax (`rgba()` to `rgb()`, `inset` shorthand, `flex-flow`, range media queries).
- Revamped justfile with grouped help output, color-coded messages, and stop/status targets.
- Improved project board layout and drag-off-board behavior.

### Fixed

- Synced project board when creating projects from Themes pane.
- Corrected off-by-one error in pane drop when dragging downward.
- Hardened pane reorder drag-and-drop with defensive guards and cleanup.
- Trapped keyboard focus inside modals to prevent Tab/Shift+Tab escape.
- Resolved stale closure that prevented notification sound in Safari.
- Replaced timer infrastructure with heartbeat Worker and Web Audio API for cross-browser reliability.
- Fixed Safari notification sound by keeping AudioContext alive with a silent oscillator, handling Safari's `interrupted` state, and deferring playback to tab focus when autoplay is blocked.
- Fixed pomodoro timer crediting double minutes due to React StrictMode double-invoking state updater side effects.
- Fixed missing final minute not being credited to the active task when a pomodoro expires.
- Persisted custom pomodoro timer presets across page reloads.
- Saved sticky note content on blur instead of every keystroke.
- Clamped sticky note positions to viewport on load, toggle, and resize.
- Fixed Ctrl+Enter newline insertion in sticky notes.
- Fixed habit tracker trigger button visibility and tooltip rendering.
- Fixed timer buttons rendering grey text on grey background due to missing explicit color.

[Unreleased]: https://github.com/florianbuetow/touchtask/commits/main
