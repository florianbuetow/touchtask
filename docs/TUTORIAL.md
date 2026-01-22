# User Guide

## Overview

TouchTask's interface is divided into two main columns:

- **Left Column:** Your daily habits and time-blocked schedule
- **Right Column:** Project tracking with reminders, pomodoro timer, and kanban board

Each section can be toggled on or off using the icons in the section headers, letting you customize your view.

---

## The Header Bar

![Header Bar](gfx/header-bar.jpg)
*The header showing the TouchTask logo, current time, date, and menu*

The header bar displays:
- **Logo:** "TouchTask" branding on the left
- **Clock:** Current time in the center (updates every second)
- **Date:** Today's date on the right
- **Menu:** Hamburger icon for app-wide actions

### Menu Options

Click the menu icon to access:
- **Load:** Import a previously saved backup file
- **Save:** Download all your data as a JSON file
- **Demo:** Load example data to explore the app
- **Reset:** Clear all data and start fresh
- **Settings:** Configure app preferences

---

## Time Blocks (Daily Habits)

Time blocks are the core of TouchTask's scheduling system. They represent recurring activities in your day—morning routines, workout sessions, deep work periods, or any habit you want to track.

![Time Blocks Section](gfx/time-blocks-section.jpg)
*The time blocks section showing several scheduled habits with progress indicators*

### Understanding a Time Block

Each time block displays:
- **Time:** Start time, end time, and duration
- **Status:** Whether you're on time, the block is active, or you're running behind
- **Title:** Name of the block with day-of-week toggles
- **Description:** Optional details about the block
- **Subtasks:** Individual steps within the block (shown as clickable pills)
- **Progress:** Color-coded percentage based on subtask completion

![Expanded Time Block](gfx/time-block-expanded.jpg)
*An expanded time block showing subtasks, time details, and the repeat days selector*

### Walkthrough: Creating Your First Time Block

**Step 1:** Click "+ Add new time block" at the bottom of the habits section.

**Step 2:** Fill in the details:
- **Block Name:** "Morning Routine"
- **Description:** "Start the day right"
- **Start Time:** 06:30
- **End Time:** 07:00
- **Repeat Days:** Click M, T, W, T, F to repeat on weekdays

**Step 3:** Add subtasks:
- Click "+ Add Subtask"
- Enter "Wake up, stretch" with 5 minutes
- Add another: "Shower" with 10 minutes
- Add another: "Breakfast" with 15 minutes

**Step 4:** Click "Add Block" to save.

![Add Block Modal](gfx/add-block-modal.jpg)
*The add block modal with fields for name, time, repeat days, and subtasks*

### Working Through a Block

**Step 1:** When it's time for your block, it will show as "active" with an accent-colored indicator.

**Step 2:** Click subtask pills to cycle their state:
- **First click:** Marks as done (green, strikethrough)
- **Second click:** Marks as skipped (faded, strikethrough)
- **Third click:** Returns to default

**Step 3:** As you complete subtasks, the progress percentage updates with color coding:
- Red (0-20%), Orange (21-40%), Yellow (41-60%), Green (61-100%)

**Step 4:** When finished, hover over the block and click the checkmark button to mark it complete. The block moves to the "completed" pills at the top.

![Completed Habits](gfx/completed-habits.jpg)
*Completed and skipped habits shown as pills above the active schedule*

### Tips
- **Click a block** to minimize/expand it
- **Click a completed pill** to restore it to active status
- **Use the eye icon** in the header to enable Focus Mode (shows only today's blocks)
- **Use the recycle icon** to reset all progress and start your day fresh

---

## Daily Schedule (Terminplaner)

The daily schedule section shows your appointments and meetings for today. Unlike time blocks, these are one-time entries specific to each day.

![Daily Schedule](gfx/daily-schedule.jpg)
*The daily schedule showing several meetings sorted by time*

### Walkthrough: Adding a Meeting

**Step 1:** Click the "+" button next to "Schedule" in the section header.

**Step 2:** Fill in the meeting details:
- **Time:** Select using the time picker (e.g., 14:00)
- **Title:** "Team Standup"
- **Description:** "Daily sync with the dev team" (optional)

**Step 3:** Click "Add Entry" to save.

![Add Meeting Modal](gfx/add-meeting-modal.jpg)
*The add meeting modal with time picker, title, and description fields*

Meetings are automatically sorted by time. Double-click any meeting to edit or delete it.

---

## Pomodoro Timer

The pomodoro timer helps you work in focused intervals with regular breaks. It integrates with the kanban board to automatically track time spent on tasks.

![Pomodoro Timer](gfx/pomodoro-timer.jpg)
*The pomodoro timer showing a 25-minute work session with an active task*

### Timer Presets

Choose from four work/break configurations:
- **10/2:** 10 minutes work, 2 minute break (quick tasks)
- **25/5:** 25 minutes work, 5 minute break (classic pomodoro)
- **50/10:** 50 minutes work, 10 minute break (extended focus)
- **90/15:** 90 minutes work, 15 minute break (deep work)

### Walkthrough: Running a Pomodoro Session

**Step 1:** Select your preferred preset by clicking one of the time buttons (e.g., "25/5").

**Step 2:** Drag a task from the kanban board and drop it on the timer's drop zone (the dashed border area).

![Pomodoro Drop Zone](gfx/pomodoro-drop-zone.jpg)
*Dragging a kanban task to the pomodoro drop zone to begin tracking time*

**Step 3:** Click "Start" to begin the timer. The countdown begins and the timer turns accent-colored.

**Step 4:** Work on your task. Every minute of work time is automatically logged to the task.

**Step 5:** When the timer ends:
- A bell sound plays (if enabled via the bell icon)
- The timer switches to break mode (green color)
- Take your break!

**Step 6:** When the break ends, another bell sounds and the timer resets for the next work session.

![Pomodoro Break](gfx/pomodoro-break.jpg)
*The timer in break mode showing the coffee cup icon and green styling*

### Tips
- Click the **bell icon** to toggle sound notifications
- Click **"Clear"** to remove the active task without stopping the timer
- Click **"Skip"** during a break to end it early
- The **progress bar** at the bottom shows how much time remains

---

## Kanban Board

The kanban board helps you manage tasks through a visual workflow. Tasks flow from left to right as they progress from idea to completion.

![Kanban Board](gfx/kanban-board.jpg)
*The kanban board showing tasks organized across four columns*

### The Four Columns

1. **Backlog:** Ideas and tasks you haven't scheduled yet
2. **Week:** Tasks you plan to work on this week
3. **Progress:** Tasks you're actively working on
4. **Done:** Completed tasks

### Understanding Task Cards

Each task card shows:
- **Priority tag:** High (red), Normal (orange), or Low (green)
- **Title:** The task name
- **Category:** Optional grouping label (e.g., "Backend", "Design")
- **Time logged:** Total time tracked via the pomodoro timer

![Kanban Task Card](gfx/kanban-task-card.jpg)
*A task card showing priority, title, category, and logged time*

### Walkthrough: Managing a Task

**Step 1:** Click "+ Add" in the Backlog column.

**Step 2:** Fill in the task details:
- **Task Name:** "Implement user authentication"
- **Category:** "Backend"
- **Priority:** High
- **Time Already Spent:** Leave at 0 for new tasks

**Step 3:** Click "Add Task" to create it in the backlog.

![Add Task Modal](gfx/add-task-modal.jpg)
*The add task modal with fields for name, category, priority, and time spent*

**Step 4:** When you're ready to work on it this week, drag the task from Backlog to the Week column.

**Step 5:** When you start working, drag it to Progress.

**Step 6:** To track time, drag the task to the pomodoro timer and run a session.

**Step 7:** When complete, drag the task to Done. It will be timestamped and shown with a strikethrough.

### Tips
- **Double-click** a task to edit or delete it
- Tasks in Done are **sorted by completion date** (newest first)
- Use the **"Clear"** button in the Done column to remove all completed tasks
- **Time logged** updates automatically when using the pomodoro timer

---

## Reminders

Reminders are quick sticky notes for things you need to remember. They persist until you delete them.

![Reminders Section](gfx/reminders-section.jpg)
*The reminders section showing several quick notes*

### Walkthrough: Using Reminders

**Step 1:** Click the text field that says "Add a reminder and press Enter..."

**Step 2:** Type your reminder: "Call dentist to reschedule"

**Step 3:** Press Enter to add it.

**Step 4:** When done, click the "×" button on the reminder to delete it.

That's it—reminders are intentionally simple!

---

## Settings

Access settings through the hamburger menu in the header.

![Settings Modal](gfx/settings-modal.jpg)
*The settings modal showing the day start time configuration*

### Available Settings

- **Day Starts At:** Configure when your day begins (affects time block status calculations)

---

## Backup and Restore

TouchTask stores all data in your browser's localStorage. To prevent data loss or move to another browser:

### Saving a Backup

1. Click the menu icon in the header
2. Click "Save"
3. A JSON file downloads with all your data

### Restoring a Backup

1. Click the menu icon in the header
2. Click "Load"
3. Select your backup JSON file
4. Confirm to replace all current data

### Loading Demo Data

Want to explore TouchTask with sample data? Click "Demo" in the menu to load example time blocks and tasks.

---

## Keyboard Shortcuts & Interactions

| Action | How |
|--------|-----|
| Add reminder | Type in field, press Enter |
| Edit time block | Hover, click edit icon |
| Edit task | Double-click the task card |
| Edit meeting | Double-click the meeting card |
| Complete block | Hover, click checkmark |
| Skip block | Hover, click skip icon |
| Toggle block expand/collapse | Click the block |
| Cycle subtask state | Click the subtask pill |
| Move task | Drag and drop between columns |
| Start pomodoro with task | Drag task to timer drop zone |
