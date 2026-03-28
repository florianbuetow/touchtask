# Themes & Project Registry - Behavioral Specification

## Objective

Introduce a central project registry that serves as the single source of truth for
project identities across the app, and a new "Themes" pane in the Task Tracking
column where users define high-level focus themes and associate them with projects.
This allows users to see at a glance which broader goals they are pursuing and which
projects contribute to each goal.

## User Stories & Acceptance Criteria

### US-1: Central Project Registry

As a user, I want a central registry of all projects so that project identities are
consistent across kanban tasks, the project board, and themes.

**AC-1.1:** On first load (no registry in localStorage), the system builds the
registry by collecting:
- Every project from the project board (reusing its existing `id` and `name`).
- Every unique `project` string from kanban tasks that does not match a project
  board project name (generating a new ID for each).

**AC-1.2:** The registry is persisted under a dedicated localStorage key
(`touchtask_project_registry`) as a JSON array of `{ id, name }` objects.

**AC-1.3:** After the registry is built, all kanban task `project` fields are
migrated from name strings to matching registry IDs. Project board task `project`
fields are set to their parent project's ID. Both are saved to localStorage.

**AC-1.4:** On subsequent loads (registry already exists in localStorage), the
registry is loaded directly and no migration runs.

**AC-1.5:** A new project can be added to the registry by name. If a project with
the same name (case-insensitive) already exists, the existing entry is returned
instead of creating a duplicate.

**AC-1.6:** A project name in the registry can be edited. If the project also
exists as a project board column, the project board column name updates to match.

**AC-1.7:** A project can be removed from the registry only if zero tasks (across
kanban and project board) reference its ID. If tasks reference it, the removal is
rejected.

**AC-1.8:** When a project board column is created, a corresponding registry entry
is created with the same ID. When a project board column is deleted, its registry
entry is removed if no tasks reference it.

**AC-1.9:** A helper function `getProjectName(id)` returns the project name for a
given registry ID. For unknown IDs, it returns the ID itself as a fallback.

**AC-1.10:** A computed usage count is available for each registry project: the sum
of kanban tasks referencing that project ID plus the number of tasks in the matching
project board column.

### US-2: Themes Pane

As a user, I want a Themes pane in the Task Tracking column so that I can define
and view my current high-level focus themes and their associated projects.

**AC-2.1:** A new pane called "Themes" appears in the Task Tracking column. Its
position in the column (top-to-bottom) is: Don't Forget, Themes, Kanban Board.

**AC-2.2:** The Task Tracking column header contains a toggle icon for the Themes
pane using the `SwatchBook` icon from lucide-react (size 14). The toggle icon order
matches the pane order: List (Don't Forget), SwatchBook (Themes), Columns4 (Kanban).

**AC-2.3:** Clicking the toggle icon shows/hides the Themes pane. The visibility
state persists across page reloads via the pane visibility localStorage mechanism.

**AC-2.4:** Themes are persisted under a dedicated localStorage key
(`touchtask_themes`) as a JSON array.

**AC-2.5:** Each theme has the following data: `id` (string), `name` (string),
`color` (string or null), and `projectIds` (array of registry project IDs).

### US-3: Theme CRUD

As a user, I want to create, edit, delete, and color-cycle themes so that I can
manage my focus areas.

**AC-3.1:** Clicking "+ Add" in the Themes pane opens an "Add Theme" modal.

**AC-3.2:** The Add Theme modal contains:
- A textarea (3 rows) for the theme name.
- A project selector showing all registry projects as checkboxes. Each checkbox
  displays the project name. Checked projects are associated with the theme.
- A text input + "Add" button to create a new project (added to the registry and
  auto-selected for this theme).
- Cancel and Add buttons in the footer. Add is disabled when the name is empty.

**AC-3.3:** Clicking a theme pill's edit button opens the same modal pre-populated
with the theme's current name and selected projects.

**AC-3.4:** Clicking a theme pill (not on a button) cycles its color through:
null (default) -> blue -> green -> orange -> red -> purple -> null.

**AC-3.5:** Clicking a theme pill's delete button (x) removes the theme. No
confirmation dialog is needed.

**AC-3.6:** A "Clear all" button (trash icon) in the Themes header removes all
themes after a confirmation dialog.

### US-4: Theme Display

As a user, I want each theme displayed as a multi-line pill showing the theme name
and its associated projects.

**AC-4.1:** Each theme renders as a pill that is taller than a single-line reminder
pill. The pill contains:
- The theme name: bold, underlined, centered text.
- Below the name: a list of associated project names (fetched from the registry by
  ID), displayed as small tags/labels.

**AC-4.2:** When a theme has a color set, the pill's background, border, and text
colors change to match the color (similar to urgency colors on reminder pills).

**AC-4.3:** Each pill has an edit button (Pen icon, size 10) and a delete button (x)
in the top-right area.

### US-5: Task Modal Project Picker

As a user, I want the project field in the Add/Edit Task modal to suggest existing
projects from the registry so that I use consistent project names.

**AC-5.1:** The project text input in the AddTaskModal includes an HTML5 `<datalist>`
populated with all registry project names.

**AC-5.2:** When saving a task, the entered project name is resolved to a registry ID:
- If the name matches an existing registry project (case-insensitive), its ID is used.
- If the name does not match and is non-empty, a new registry entry is created and
  its ID is used.
- If the name is empty, the task's project field is set to an empty string.

**AC-5.3:** When editing an existing task, the project field displays the project name
(fetched from registry by ID), not the raw ID.

### US-6: Data Lifecycle Integration

As a user, I want themes and the project registry included in export, import, reset,
and demo operations.

**AC-6.1:** Export includes `projectRegistry` and `themes` arrays in the JSON backup.

**AC-6.2:** Import loads `projectRegistry` and `themes` from the backup file (falling
back to empty arrays for backward compatibility with older backups).

**AC-6.3:** Reset clears the registry and themes (empty arrays).

**AC-6.4:** Demo load creates a registry from the demo project board projects and
creates 2-3 demo themes referencing those projects.

## Constraints

- **Single-file architecture:** All logic lives in `frontend/src/App.jsx` and styling
  in `frontend/src/App.css`. No new files.
- **No external libraries:** Use only lucide-react icons, React hooks, and native
  HTML/CSS. No UI component libraries or state management libraries.
- **localStorage persistence:** Follow the existing `STORAGE_KEYS` + load/save
  function pattern.
- **Backward compatibility:** Existing user data (kanban tasks, project board) must
  migrate seamlessly on first load. No data loss.

## Edge Cases

**EC-1:** First load with no project board projects and no kanban tasks with project
strings: the registry is initialized as an empty array. No migration runs.

**EC-2:** A kanban task has a project string that matches a project board project name
(case-insensitive): use the project board project's existing ID (do not create a
duplicate).

**EC-3:** Multiple kanban tasks reference the same project name string: only one
registry entry is created; all tasks map to the same ID.

**EC-4:** A theme references a project ID that no longer exists in the registry
(e.g., registry edited externally): display the raw ID as a fallback, do not crash.

**EC-5:** User creates a project via the theme modal's "Add" button with a name that
already exists in the registry: return the existing project (no duplicate), and
select it for the theme.

**EC-6:** Importing a backup that has no `projectRegistry` or `themes` keys: treat
both as empty arrays and rebuild the registry from the imported project board and
kanban data.

**EC-7:** The Themes pane with zero themes shows the "+ Add" button only — no
empty-state message needed (matching reminders pane behavior).

## Non-Goals

**NG-1:** Theme ordering via drag-and-drop. Themes display in creation order. Reordering
may be added later.

**NG-2:** Archiving or completing themes. Themes are simply created and deleted.

**NG-3:** Renaming projects from within the Themes pane. Project editing happens through
the project registry (future UI), not the themes modal.

**NG-4:** Displaying the project registry as its own standalone pane or settings page.
The registry is an internal data structure exposed only through the theme modal's project
selector and the task modal's datalist.

**NG-5:** Changing how the project board renders column names. Project board columns
continue to use their own `name` field (kept in sync with the registry).

## Open Questions

(None — all requirements derived from user description.)
