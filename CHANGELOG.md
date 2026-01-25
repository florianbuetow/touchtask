# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Desktop Application Support

- **Tauri Integration**: Added support for building TouchTask as a native desktop application using Tauri 2.0
  - Cross-platform support for Windows, macOS, and Linux
  - Native performance with smaller bundle sizes compared to Electron
  - Full access to system APIs while maintaining web-based UI

- **Build System**:
  - Added Tauri CLI and API dependencies (`@tauri-apps/cli`, `@tauri-apps/api`)
  - New npm scripts: `tauri`, `tauri:dev`, `tauri:build`
  - Configured build to exclude AppImage (known linuxdeploy issues) for reliable, platform-independent builds
  - Build outputs: `.deb` and `.rpm` packages on Linux, `.msi` on Windows, `.dmg` and `.app` on macOS

- **Configuration**:
  - Updated Vite configuration with conditional base path (`/` for Tauri, `/touchtask/` for web)
  - Added Tauri-specific Vite settings (`clearScreen: false`, `envPrefix`)
  - Created `frontend/src-tauri/` directory with Rust backend
  - Configured bundle identifier: `com.touchtask`

- **Task Runner**:
  - Added `tauri-dev`, `tauri-build`, and `tauri-init` commands to justfile
  - Automatic nvm and cargo PATH setup in justfile commands
  - Updated help documentation

- **Documentation**:
  - Created comprehensive `docs/TAURI_SETUP.md` guide
  - Updated `README.md` with desktop app section
  - Added troubleshooting sections for Tauri-specific issues
  - Documented platform-specific prerequisites and setup instructions
  - Added notes about Ubuntu 24.04 package differences (`libwebkit2gtk-4.1-dev`)

### Changed

- **Vite Configuration**:
  - Modified base path to be conditional based on Tauri environment
  - Added Tauri environment variable prefix support

- **Build Process**:
  - Updated build script to exclude AppImage format for reliable builds
  - Configured platform-specific bundle targets

- **Documentation**:
  - Updated README to reflect dual deployment (web + desktop)
  - Enhanced troubleshooting section with Tauri-specific guidance
  - Clarified justfile usage (run from project root)

### Fixed

- **Build Reliability**:
  - Excluded AppImage bundle format to prevent build failures
  - Configured build to succeed on all supported platforms

- **Environment Setup**:
  - Fixed justfile commands to properly source nvm and cargo
  - Added automatic PATH configuration for Rust and Node.js toolchains

### Technical Details

#### Dependencies Added

- `@tauri-apps/api@^2.0.0` (runtime dependency)
- `@tauri-apps/cli@^2.0.0` (development dependency)

#### New Files

- `frontend/src-tauri/` - Tauri Rust backend
  - `Cargo.toml` - Rust dependencies
  - `tauri.conf.json` - Tauri configuration
  - `src/main.rs` - Rust entry point
  - `src/lib.rs` - Application library
  - `build.rs` - Build script
  - `capabilities/default.json` - Security capabilities
  - `icons/` - Application icons for all platforms

- `docs/TAURI_SETUP.md` - Comprehensive Tauri setup guide

#### Modified Files

- `frontend/package.json` - Added Tauri dependencies and scripts
- `frontend/vite.config.js` - Conditional base path and Tauri settings
- `justfile` - Added Tauri commands with nvm/cargo PATH setup
- `.gitignore` - Added Tauri build artifacts
- `README.md` - Added desktop app documentation

#### Build Configuration

- Bundle identifier: `com.touchtask`
- Build command: `tauri build --bundles deb,rpm` (excludes AppImage)
- Window configuration: 800x600, resizable
- Version: 0.1.0

---

## [1.0.0] - 2025-01-XX

### Added

#### Core Features

- **Time Blocks (Daily Habits)**: Schedule recurring daily habits and routines with time-based tracking
  - Start/end time configuration
  - Day-of-week repeat options
  - Subtask management with progress tracking
  - Color-coded progress indicators (0-100%)
  - Status indicators (on-time, active, behind schedule)
  - Complete/skip functionality
  - Focus mode to show only today's blocks

- **Pomodoro Timer**: Focus sessions with automatic time tracking
  - Four preset configurations: 10/2, 25/5, 50/10, 90/15 (work/break minutes)
  - Visual countdown timer with progress bar
  - Sound notifications (toggleable)
  - Automatic time logging to kanban tasks
  - Task drag-and-drop integration
  - Break mode with skip functionality

- **Kanban Board**: Visual task management workflow
  - Four columns: Backlog, Week, Progress, Done
  - Task cards with priority tags (High, Normal, Low)
  - Category organization
  - Automatic time tracking integration
  - Drag-and-drop task movement
  - Task editing and deletion
  - Completion timestamps

- **Daily Schedule (Terminplaner)**: Appointment and meeting management
  - Time-based scheduling
  - Automatic time sorting
  - Meeting editing and deletion
  - Integration with daily view

- **Reminders**: Quick sticky notes
  - Simple text-based reminders
  - Persistent until manually deleted
  - Keyboard-driven workflow (Enter to add)

#### User Interface

- **Header Bar**:
  - Real-time clock (updates every second)
  - Current date display
  - Hamburger menu for app-wide actions

- **Menu System**:
  - Load: Import backup JSON files
  - Save: Export all data as JSON
  - Demo: Load example data
  - Reset: Clear all data
  - Settings: Configure app preferences

- **Layout Customization**:
  - Section visibility toggles
  - Focus mode for time blocks
  - Responsive two-column layout

#### Data Management

- **Local Storage**: All data stored in browser localStorage
  - No server required
  - No account needed
  - Complete privacy

- **Backup & Restore**:
  - JSON export/import functionality
  - Full data portability
  - Demo data loading

- **Settings**:
  - Configurable day start time
  - Affects time block status calculations

#### Technical Implementation

- **Frontend Stack**:
  - React 18.2.0 with SWC compiler
  - Vite 6.3.5 for build tooling
  - Lucide React for icons
  - Modern ES modules

- **Build System**:
  - Vite-based development server
  - Production builds to `dist/` directory
  - GitHub Pages deployment support
  - Base path configuration for subdirectory hosting

- **Development Tools**:
  - ESLint configuration
  - React Hooks linting
  - Justfile for task automation
  - Node.js 22+ requirement

#### Documentation

- **User Guide**: Comprehensive tutorial (`docs/TUTORIAL.md`)
  - Feature walkthroughs
  - Step-by-step instructions
  - Keyboard shortcuts reference
  - Screenshot documentation

- **README**: Project documentation
  - Setup instructions
  - Feature overview
  - Troubleshooting guide
  - Contributing guidelines

### Technical Details

#### Dependencies

- `react@^18.2.0`
- `react-dom@^18.2.0`
- `lucide-react@^0.468.0`
- `vite@^6.3.5`
- `@vitejs/plugin-react-swc@^3.5.0`

#### Project Structure

- React SPA architecture
- Component-based design
- LocalStorage-based persistence
- Client-side only (no backend)

---

## [0.1.0] - Initial Development

### Added

- Initial project setup
- React + Vite configuration
- Basic project structure
- Development environment setup
