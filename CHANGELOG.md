# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This repository does not currently use release tags, so entries are grouped by date and major update scope.

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
