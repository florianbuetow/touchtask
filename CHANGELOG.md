# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Ultrafocus overlay sluggishness — extracted overlay into its own component so the per-second timer tick re-renders only the overlay (not the entire 9000-line App), and the interval is unmounted when the overlay closes. Task and estimate inputs now persist to localStorage on blur (or Enter) instead of every keystroke; closing the overlay flushes any unsaved changes so newly added entries are still saved.
- Completed habit pills now have proper margin (1rem) above the blocks section instead of zero gap.

### Added

- Ultrafocus overlay ("Get it done NOW, no matter what!") — full-screen blurred overlay with a focused task list for blocking out distractions. Each row has editable estimate (hh:mm with auto-formatting from raw minutes), live actual time tracking, large focus-style task text, Start/Stop timer toggle, Finish button (toggleable), delete, and drag-and-drop reorder. Time accumulates across multiple start/stop cycles and persists to localStorage. Overlay can only be dismissed via the X close button — Escape, click-outside, and other drawers do not close it. Accessed via TriangleAlert icon in the bottom-right trigger group.
- Time block Types (categories) — create multiple schedule types (e.g. default, work, study, holiday) and switch between them via a horizontal pill row above the completed-habit pills. Each block is pinned to the type under which it was created. A pencil edit button opens a manager modal to add, rename, remove, and reorder types; deletions warn first and remove all blocks of that type. Types persist across reloads and are included in backup/import; existing blocks migrate silently to `default`.
- Reorder subtasks in the Add/Edit Block modal with up/down arrow buttons — first/last items have their respective arrow disabled, and the new order persists to local storage on save.
- Quote pane in the Cognitive Load column with a gear-icon settings modal — paste quotes (one per line, last " - " separates text from source), pick fixed/hourly/daily mode (deterministic hash of YYYY-MM-DD or YYYY-MM-DD-HH), and live preview of the currently displayed quote.
- Outline for Tomorrow pane in the Habits column with two side-by-side textareas separated by a draggable resizable divider (persisted as %), expand/shrink resize buttons (optimal height based on tallest textarea), copy-all, clear, and toggle via Worm icon.
- Intermittent Fasting pane in the Habits column with animated diagonal-stripe progress bar, elapsed counter (HH:MM:SS), start time picker with yesterday/today selection, duration goal presets, and persistent state.
- Fasting goal display now shows the target end time (start + duration) in HH:MM format, with a compact duration label (e.g. "16h", "13h30m") under the elapsed timer.
- Three-column layout with Schedule, Tasks, and Cognitive Load columns.
- Cognitive Load column with current focus input, interruption counter, context switch counter, focus ritual checklist, and hourly energy level tagging.
- Click-to-cycle energy levels (high/medium/low) on hour blocks.
- Brain dump pane for capturing intrusive thoughts with expand/shrink, copy, and clear actions.
- Shortlist pane (renamed from reminders) with drag-and-drop reorder, urgency cycling with auto-sort, bulk-add modal, and restyled pills.
- Pomodoro timer with persistent state and custom presets across page refreshes.
- Break pane with activity icons, timer overlay, volume control, and configurable activity settings.
- Themes pane with central project registry, persistent theme colors, and project board sync.
- Drag-and-drop pane reordering with persistent layout and drop indicator across all three columns.
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
- Renamed `just run` to `just start`.
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
