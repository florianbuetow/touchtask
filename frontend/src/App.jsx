import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { ArrowBigLeftDash, ArrowBigRightDash, BarChart3, Bell, BellOff, BellRing, Brain, Captions, CaptionsOff, Coffee, Copy, Crosshair, DoorClosed, DoorOpen, Eye, EyeOff, Globe, GlobeLock, Headphones, HeadphoneOff, List, RotateCcw, ShieldCheck, Maximize2, Menu, MicVocal, Minimize2, NotebookPen, Pen, Pencil, Phone, PhoneOff, Power, PowerOff, Recycle, Sticker, SwatchBook, Timer, Columns4, CalendarCheck, LayoutList, Eraser, Undo2, Redo2, Trash2, Volume2, VolumeOff, Wifi, WifiOff, X } from 'lucide-react'
import './App.css'
import { getStroke } from 'perfect-freehand'

// ============================================
// UTILITY FUNCTIONS
// ============================================

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const getTodayString = () => new Date().toISOString().split('T')[0]

// Days: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const getToday = () => new Date().getDay()

const getPast30Days = () => {
  const days = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    days.push({
      dateStr: d.toISOString().split('T')[0],
      dayOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()],
      dayDate: `${dd}/${mm}`,
      isToday: i === 0
    })
  }
  return days
}

const formatTime = (minutes) => {
  if (minutes === 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h${m}m`
}

const formatTimer = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const getProgressColorClass = (percent) => {
  if (percent <= 20) return 'progress-red'
  if (percent <= 40) return 'progress-orange'
  if (percent <= 60) return 'progress-yellow'
  return 'progress-green'
}

// ============================================
// ENERGY LEVEL HELPERS
// ============================================

const ENERGY_VALUES = { high: 3, medium: 2, low: 1 }

const pruneEnergyData = (data) => {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 42) // 6 weeks
  const cutoffStr = cutoff.toISOString().split('T')[0]
  const pruned = {}
  for (const date of Object.keys(data)) {
    if (date >= cutoffStr) pruned[date] = data[date]
  }
  return pruned
}

const computeEnergyAverages = (data) => {
  const today = getTodayString()
  const hourTotals = {}
  const hourCounts = {}
  for (const [date, hours] of Object.entries(data)) {
    if (date === today) continue
    for (const [hour, level] of Object.entries(hours)) {
      const val = ENERGY_VALUES[level]
      if (!val) continue
      hourTotals[hour] = (hourTotals[hour] || 0) + val
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    }
  }
  const averages = {}
  for (const hour of Object.keys(hourTotals)) {
    const avg = hourTotals[hour] / hourCounts[hour]
    averages[hour] = avg >= 2.5 ? 'high' : avg >= 1.5 ? 'medium' : 'low'
  }
  return averages
}

const generateDemoEnergyData = () => {
  const data = {}
  const today = new Date()
  for (let daysAgo = 1; daysAgo <= 42; daysAgo++) {
    const d = new Date(today)
    d.setDate(d.getDate() - daysAgo)
    const dow = d.getDay()
    if (dow === 0 || dow === 6) continue // skip weekends
    const dateStr = d.toISOString().split('T')[0]
    const hours = {}
    for (let h = 8; h <= 20; h++) {
      // skip some hours randomly (~15% chance of no record)
      if (Math.random() < 0.15) continue
      // Weighted pick: [highWeight, mediumWeight, lowWeight]
      const weights = {
        8:  [0.85, 0.10, 0.05],  // morning peak
        9:  [0.90, 0.08, 0.02],  // peak focus
        10: [0.80, 0.15, 0.05],  // still strong
        11: [0.60, 0.30, 0.10],  // pre-lunch fade
        12: [0.30, 0.50, 0.20],  // lunch approaching
        13: [0.05, 0.25, 0.70],  // post-lunch crash
        14: [0.08, 0.22, 0.70],  // deep slump
        15: [0.15, 0.45, 0.40],  // starting to recover
        16: [0.35, 0.40, 0.25],  // second wind for some
        17: [0.20, 0.35, 0.45],  // fading
        18: [0.10, 0.25, 0.65],  // winding down
        19: [0.05, 0.20, 0.75],  // evening low
        20: [0.05, 0.15, 0.80],  // done for the day
      }
      const [wH, wM] = weights[h] || [0.33, 0.34, 0.33]
      const r = Math.random()
      const level = r < wH ? 'high' : r < wH + wM ? 'medium' : 'low'
      hours[String(h)] = level
    }
    data[dateStr] = hours
  }
  return data
}

// ============================================
// STORAGE FUNCTIONS
// ============================================

const STORAGE_KEYS = {
  MASTER_BLOCKS: 'touchtask_master_blocks',
  DAILY_STATE: 'touchtask_daily_state',
  KANBAN_TASKS: 'touchtask_kanban_tasks',
  POMODORO_PRESETS: 'touchtask_pomodoro_presets',
  SETTINGS: 'touchtask_settings',
  REMINDERS: 'touchtask_reminders',
  MEETINGS: 'touchtask_meetings',
  HABIT_TRACKER: 'touchtask_habit_tracker',
  PROJECT_BOARD: 'touchtask_project_board',
  PROJECT_REGISTRY: 'touchtask_project_registry',
  THEMES: 'touchtask_themes',
  WHITEBOARDS: 'touchtask_whiteboards',
  STICKY_NOTES: 'touchtask_sticky_notes',
  FOCUS_CHECKLIST: 'touchtask_focus_checklist',
  FOCUS_ORDER: 'touchtask_focus_order',
  CURRENT_FOCUS: 'touchtask_current_focus',
  BRAIN_DUMP: 'touchtask_brain_dump',
  CONTEXT_SWITCHES: 'touchtask_context_switches',
  ENERGY_LEVELS: 'touchtask_energy_levels',
  ENERGY_AVERAGES: 'touchtask_energy_averages',
  POMODORO_TIMER: 'touchtask_pomodoro_timer',
  BREAK_TIMER: 'touchtask_break_timer',
  BREAK_ACTIVITIES_ORDER: 'touchtask_break_activities_order',
  BREAK_HIDDEN_ACTIVITIES: 'touchtask_break_hidden_activities',
  BREAK_ACTIVITY_SETTINGS: 'touchtask_break_activity_settings',
  PANE_VISIBILITY: 'touchtask_pane_visibility',
}

const getDefaultSettings = () => ({
  dayStartsAt: '00:00',
  use24HourFormat: true,
  notificationVolume: 0.5
})

const loadSettings = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    return data ? JSON.parse(data) : getDefaultSettings()
  } catch (e) {
    console.error('Error loading settings:', e)
    return getDefaultSettings()
  }
}

const saveSettings = (data) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data))
}

// Default data for first-time users
const getDefaultMasterBlocks = () => ({
  blocks: [
    {
      id: generateId(),
      title: 'Morning Identity Primer',
      description: 'Start your day with intention',
      start_time: '06:00',
      end_time: '06:20',
      duration_minutes: 20,
      category: 'habit',
      tags: ['morning', 'mindset'],
      repeat_days: [1, 2, 3, 4, 5],
      subtasks: [
        { id: generateId(), title: 'Open curtains', duration_minutes: 1, optional: false },
        { id: generateId(), title: 'Place water bottle on desk', duration_minutes: 1, optional: false },
        { id: generateId(), title: 'Lay out workout clothes', duration_minutes: 1, optional: true },
        { id: generateId(), title: 'Drink full glass of water', duration_minutes: 2, optional: false },
        { id: generateId(), title: 'Identity statement', duration_minutes: 1, optional: false },
        { id: generateId(), title: 'Micro-journaling: priorities + if-then plan', duration_minutes: 8, optional: false },
        { id: generateId(), title: '5 slow breaths + 10 squats', duration_minutes: 4, optional: false },
      ]
    },
    {
      id: generateId(),
      title: 'Clean Start Work Launch',
      description: 'Prepare for focused work',
      start_time: '08:00',
      end_time: '08:15',
      duration_minutes: 15,
      category: 'focus',
      tags: ['work', 'setup'],
      repeat_days: [1, 2, 3, 4, 5],
      subtasks: [
        { id: generateId(), title: 'Close unnecessary tabs/apps', duration_minutes: 3, optional: false },
        { id: generateId(), title: 'Put phone out of reach', duration_minutes: 1, optional: false },
        { id: generateId(), title: 'Write first tiny action', duration_minutes: 2, optional: false },
        { id: generateId(), title: 'Start focus playlist/coffee', duration_minutes: 2, optional: true },
        { id: generateId(), title: 'Set timer', duration_minutes: 1, optional: false },
        { id: generateId(), title: 'Open only required files/tools', duration_minutes: 5, optional: false },
      ]
    },
    {
      id: generateId(),
      title: 'Deep Work Cycle',
      description: 'Single-task focus sprint',
      start_time: '08:30',
      end_time: '09:30',
      duration_minutes: 60,
      category: 'focus',
      tags: ['pomodoro', 'deep-work'],
      repeat_days: [1, 2, 3, 4, 5],
      subtasks: [
        { id: generateId(), title: 'Pre-commit: define stop condition', duration_minutes: 2, optional: false },
        { id: generateId(), title: 'Focus sprint', duration_minutes: 40, optional: false },
        { id: generateId(), title: 'Scoreboard tick', duration_minutes: 1, optional: false },
        { id: generateId(), title: 'Quick desk reset', duration_minutes: 3, optional: false },
        { id: generateId(), title: 'Recovery break: walk/stretch/water', duration_minutes: 7, optional: false },
      ]
    },
    {
      id: generateId(),
      title: 'Movement Minimum',
      description: 'Daily movement habit',
      start_time: '12:00',
      end_time: '12:20',
      duration_minutes: 20,
      category: 'health',
      tags: ['exercise', 'movement'],
      repeat_days: [1, 2, 3, 4, 5],
      subtasks: [
        { id: generateId(), title: 'Put on shoes / warmup', duration_minutes: 2, optional: false },
        { id: generateId(), title: 'Core activity (walk/mobility/strength)', duration_minutes: 15, optional: false },
        { id: generateId(), title: 'Log it', duration_minutes: 2, optional: false },
      ]
    },
    {
      id: generateId(),
      title: 'Meal & Health Autopilot',
      description: 'Healthy eating routine',
      start_time: '12:30',
      end_time: '13:00',
      duration_minutes: 30,
      category: 'health',
      tags: ['nutrition', 'meal'],
      repeat_days: [1, 2, 3, 4, 5],
      subtasks: [
        { id: generateId(), title: 'Make healthy default visible', duration_minutes: 2, optional: false },
        { id: generateId(), title: 'Prep micro-step', duration_minutes: 8, optional: true },
        { id: generateId(), title: 'Eat: protein + fiber first', duration_minutes: 15, optional: false },
        { id: generateId(), title: 'Quick cleanup', duration_minutes: 3, optional: false },
      ]
    },
    {
      id: generateId(),
      title: 'Evening Shutdown',
      description: 'Close the day intentionally',
      start_time: '18:00',
      end_time: '18:30',
      duration_minutes: 30,
      category: 'habit',
      tags: ['evening', 'shutdown'],
      repeat_days: [1, 2, 3, 4, 5],
      subtasks: [
        { id: generateId(), title: 'Shutdown complete + close laptop', duration_minutes: 2, optional: false },
        { id: generateId(), title: 'Plan tomorrow: top 1-3 tasks', duration_minutes: 7, optional: false },
        { id: generateId(), title: 'Reset environment: desk/clothes/water', duration_minutes: 8, optional: false },
        { id: generateId(), title: 'Phone charges outside bedroom', duration_minutes: 2, optional: false },
        { id: generateId(), title: 'Wind-down: book/stretch/breaths', duration_minutes: 5, optional: true },
      ]
    },
    {
      id: generateId(),
      title: 'Weekly Review & Habit Shaping',
      description: 'Review and adjust systems',
      start_time: '10:00',
      end_time: '10:45',
      duration_minutes: 45,
      category: 'planning',
      tags: ['weekly', 'review'],
      repeat_days: [0],
      subtasks: [
        { id: generateId(), title: 'Review scoreboard: count checkmarks', duration_minutes: 8, optional: false },
        { id: generateId(), title: 'Identify success patterns', duration_minutes: 5, optional: false },
        { id: generateId(), title: 'Lower friction: pre-pack/automate/simplify', duration_minutes: 10, optional: false },
        { id: generateId(), title: 'Raise friction for negatives', duration_minutes: 5, optional: true },
        { id: generateId(), title: 'Choose 1 habit experiment', duration_minutes: 7, optional: false },
        { id: generateId(), title: 'Write implementation intentions', duration_minutes: 5, optional: false },
      ]
    },
    {
      id: generateId(),
      title: 'Social & Recovery',
      description: 'Connection and deliberate rest',
      start_time: '19:00',
      end_time: '19:30',
      duration_minutes: 30,
      category: 'personal',
      tags: ['social', 'recovery'],
      repeat_days: [1, 2, 3, 4, 5],
      subtasks: [
        { id: generateId(), title: 'Send appreciation message', duration_minutes: 4, optional: false },
        { id: generateId(), title: 'Deliberate rest: walk/hobby/stretching', duration_minutes: 20, optional: false },
        { id: generateId(), title: 'Done ritual: tea/shower/reflection', duration_minutes: 5, optional: true },
      ]
    }
  ]
})

const getDefaultKanbanTasks = () => ({
  tasks: [
    {
      id: generateId(),
      title: 'Welcome to TouchTask!',
      category: 'Getting Started',
      priority: 'normal',
      column: 'backlog',
      time_logged_minutes: 0,
      created_at: new Date().toISOString(),
      completed_at: null
    },
    {
      id: generateId(),
      title: 'Record a demo video',
      category: 'Marketing',
      priority: 'high',
      column: 'backlog',
      time_logged_minutes: 0,
      created_at: new Date().toISOString(),
      completed_at: null
    },
    {
      id: generateId(),
      title: 'Publish video',
      category: 'Marketing',
      priority: 'normal',
      column: 'backlog',
      time_logged_minutes: 0,
      created_at: new Date().toISOString(),
      completed_at: null
    },
    {
      id: generateId(),
      title: 'Open Source TouchTask',
      category: 'Development',
      priority: 'high',
      column: 'backlog',
      time_logged_minutes: 0,
      created_at: new Date().toISOString(),
      completed_at: null
    },
    {
      id: generateId(),
      title: 'Deploy TouchTask with GitHub Pages',
      category: 'Development',
      priority: 'normal',
      column: 'backlog',
      time_logged_minutes: 0,
      created_at: new Date().toISOString(),
      completed_at: null
    }
  ]
})

const getDefaultReminders = () => [
  { id: generateId(), text: 'Buy Milk' },
  { id: generateId(), text: 'Buy Eggs' },
  { id: generateId(), text: "Follow up on Jim's email" }
]

const getDefaultMeetings = () => ({
  date: getTodayString(),
  items: [
    { id: generateId(), time: '14:00', title: 'Call Jim' }
  ]
})

const getDefaultHabitTracker = () => {
  const days = getPast30Days()
  const pick = (bias) => {
    const r = Math.random()
    if (r < bias) return 'green'
    if (r < bias + 0.15) return 'orange'
    if (r < bias + 0.3) return null
    return 'red'
  }
  const buildEntries = (bias) => {
    const entries = {}
    days.forEach(d => {
      const val = pick(bias)
      if (val) entries[d.dateStr] = val
    })
    return entries
  }
  return {
    habits: [
      {
        id: generateId(),
        name: 'Exercise',
        description: '30 min workout or run',
        created_at: new Date().toISOString(),
        entries: buildEntries(0.55)
      },
      {
        id: generateId(),
        name: 'Reading',
        description: '20 pages before bed',
        created_at: new Date().toISOString(),
        entries: buildEntries(0.45)
      },
      {
        id: generateId(),
        name: 'Meditation',
        description: '10 min morning session',
        created_at: new Date().toISOString(),
        entries: buildEntries(0.4)
      }
    ]
  }
}


const loadMasterBlocks = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MASTER_BLOCKS)
    return data ? JSON.parse(data) : getDefaultMasterBlocks()
  } catch (e) {
    console.error('Error loading master blocks:', e)
    return getDefaultMasterBlocks()
  }
}

const saveMasterBlocks = (data) => {
  localStorage.setItem(STORAGE_KEYS.MASTER_BLOCKS, JSON.stringify(data))
}

const loadDailyState = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DAILY_STATE)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.error('Error loading daily state:', e)
    return null
  }
}

const saveDailyState = (data) => {
  localStorage.setItem(STORAGE_KEYS.DAILY_STATE, JSON.stringify(data))
}

const loadKanbanTasks = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.KANBAN_TASKS)
    return data ? JSON.parse(data) : getDefaultKanbanTasks()
  } catch (e) {
    console.error('Error loading kanban tasks:', e)
    return getDefaultKanbanTasks()
  }
}

const saveKanbanTasks = (data) => {
  localStorage.setItem(STORAGE_KEYS.KANBAN_TASKS, JSON.stringify(data))
}

const loadReminders = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REMINDERS)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('Error loading reminders:', e)
    return []
  }
}

const saveReminders = (data) => {
  localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(data))
}

const loadProjectRegistry = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECT_REGISTRY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('Error loading project registry:', e)
    return []
  }
}

const saveProjectRegistry = (data) => {
  localStorage.setItem(STORAGE_KEYS.PROJECT_REGISTRY, JSON.stringify(data))
}

const loadThemes = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.THEMES)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('Error loading themes:', e)
    return []
  }
}

const saveThemes = (data) => {
  localStorage.setItem(STORAGE_KEYS.THEMES, JSON.stringify(data))
}

const loadMeetings = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MEETINGS)
    if (!data) return { date: getTodayString(), items: [] }
    const parsed = JSON.parse(data)
    // Reset meetings if it's a new day
    if (parsed.date !== getTodayString()) {
      return { date: getTodayString(), items: [] }
    }
    return parsed
  } catch (e) {
    console.error('Error loading meetings:', e)
    return { date: getTodayString(), items: [] }
  }
}

const saveMeetings = (data) => {
  localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(data))
}

const loadHabitTracker = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HABIT_TRACKER)
    return data ? JSON.parse(data) : { habits: [] }
  } catch (e) {
    console.error('Error loading habit tracker:', e)
    return { habits: [] }
  }
}

const saveHabitTracker = (data) => {
  localStorage.setItem(STORAGE_KEYS.HABIT_TRACKER, JSON.stringify(data))
}

const loadProjectBoard = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECT_BOARD)
    return data ? JSON.parse(data) : { projects: [] }
  } catch (e) {
    console.error('Error loading project board:', e)
    return { projects: [] }
  }
}

const saveProjectBoard = (data) => {
  localStorage.setItem(STORAGE_KEYS.PROJECT_BOARD, JSON.stringify(data))
}

const getDefaultWhiteboards = () => ({
  activeWhiteboardId: null,
  whiteboards: []
})

const createBlankWhiteboard = () => ({
  id: generateId(),
  name: 'Scratch',
  strokes: [],
  createdAt: Date.now()
})

const loadWhiteboards = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WHITEBOARDS)
    return data ? JSON.parse(data) : getDefaultWhiteboards()
  } catch (e) {
    console.error('Error loading whiteboards:', e)
    return getDefaultWhiteboards()
  }
}

const saveWhiteboards = (data) => {
  localStorage.setItem(STORAGE_KEYS.WHITEBOARDS, JSON.stringify(data))
}

const loadStickyNotes = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STICKY_NOTES)
    if (!data) return []
    const parsed = JSON.parse(data)
    if (Array.isArray(parsed)) return parsed
    return parsed.notes || []
  } catch (e) {
    console.error('Error loading sticky notes:', e)
    return []
  }
}

const saveStickyNotes = (data) => {
  localStorage.setItem(STORAGE_KEYS.STICKY_NOTES, JSON.stringify(data))
}

const saveFocusChecklist = (data) => {
  localStorage.setItem(STORAGE_KEYS.FOCUS_CHECKLIST, JSON.stringify(data))
}

const DEFAULT_FOCUS_ORDER = ['notificationsOff', 'messagesOff', 'phoneSilenced', 'alertsMuted', 'browsersClosed', 'wifiOff', 'monitorOff', 'musicOn', 'doorClosed']

const FOCUS_ITEMS_CONFIG = {
  notificationsOff: { onIcon: BellOff, offIcon: BellRing, onTip: 'Your notifications are turned off', offTip: 'Turn off your notifications' },
  messagesOff: { onIcon: CaptionsOff, offIcon: Captions, onTip: 'Your instant messages are turned off', offTip: 'Turn off instant messages' },
  phoneSilenced: { onIcon: PhoneOff, offIcon: Phone, onTip: 'Your phone is silenced', offTip: 'Silence your phone' },
  alertsMuted: { onIcon: VolumeOff, offIcon: Volume2, onTip: 'Music and audio are muted', offTip: 'Mute music and all audio' },
  browsersClosed: { onIcon: GlobeLock, offIcon: Globe, onTip: 'Unused browser tabs are closed', offTip: 'Close unused browser tabs and windows' },
  wifiOff: { onIcon: WifiOff, offIcon: Wifi, onTip: 'Internet is turned off', offTip: 'Turn internet off' },
  monitorOff: { onIcon: PowerOff, offIcon: Power, onTip: 'Extra devices and monitors are off', offTip: 'Turn extra devices, tablets, phones and monitors off' },
  musicOn: { onIcon: HeadphoneOff, offIcon: Headphones, onTip: 'Noise canceling headphones on', offTip: 'Wear noise canceling headphones' },
  doorClosed: { onIcon: DoorClosed, offIcon: DoorOpen, onTip: 'Your door is closed', offTip: 'Close your door' },
}

const THEME_COLORS = [null, 'blue', 'green', 'orange', 'red', 'purple']

const clampNotesToViewport = (notes, newW, newH) => {
  let changed = false
  const clamped = notes.map(n => {
    const x = Math.max(0, Math.min(n.x, newW - 300))
    const y = Math.max(0, Math.min(n.y, newH - 300))
    if (x !== n.x || y !== n.y) changed = true
    return x !== n.x || y !== n.y ? { ...n, x, y } : n
  })
  return changed ? clamped : notes
}

const initializeDailyState = (masterBlocks, existingDailyState) => {
  const today = getTodayString()

  // Check if we need to reset
  if (existingDailyState && existingDailyState.date === today) {
    return existingDailyState
  }

  // Preserve focus mode preference
  const focusMode = existingDailyState?.focus_mode ?? true

  // Create fresh daily state
  const newDailyState = {
    date: today,
    focus_mode: focusMode,
    blocks: masterBlocks.blocks.map(block => ({
      ...block,
      completed: false,
      minimized: false,
      subtasks: block.subtasks.map(st => ({
        ...st,
        state: 'default'
      }))
    })),
    completed_block_ids: []
  }

  saveDailyState(newDailyState)
  return newDailyState
}

// ============================================
// MAIN APP COMPONENT
// ============================================

function App() {
  // State
  const [masterBlocks, setMasterBlocks] = useState(null)
  const [dailyState, setDailyState] = useState(null)
  const [kanbanTasks, setKanbanTasks] = useState(null)
  const [reminders, setReminders] = useState([])
  const [meetings, setMeetings] = useState({ date: getTodayString(), items: [] })
  const [habitTracker, setHabitTracker] = useState({ habits: [] })
  const [projectBoard, setProjectBoard] = useState({ projects: [] })
  const [projectRegistry, setProjectRegistry] = useState([])
  const [themes, setThemes] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Pomodoro state
  const [presets, setPresets] = useState(() => {
    const defaults = [
      { work: 10, break: 20 },
      { work: 25, break: 5 },
      { work: 50, break: 10 },
      { work: 90, break: 15 }
    ]
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POMODORO_PRESETS)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length === 4) return parsed
      }
    } catch { /* ignore */ }
    return defaults
  })
  const [activePresetIndex, setActivePresetIndex] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POMODORO_TIMER)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.activePresetIndex != null) return parsed.activePresetIndex
      }
    } catch { /* ignore */ }
    return 1
  })
  const [editingPresetIndex, setEditingPresetIndex] = useState(null)
  const [editingPresetValues, setEditingPresetValues] = useState({ work: 0, break: 0 })
  const [bellEnabled, setBellEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POMODORO_TIMER)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.bellEnabled != null) return parsed.bellEnabled
      }
    } catch { /* ignore */ }
    return true
  })
  const [timerState, setTimerState] = useState(() => {
    const defaults = { isRunning: false, isBreak: false, timeRemaining: 25 * 60, totalTime: 25 * 60, activeTaskId: null, elapsedWhileRunning: 0, endTime: null }
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POMODORO_TIMER)
      if (saved) {
        const parsed = JSON.parse(saved)
        const totalTime = parsed.totalTime ?? defaults.totalTime
        const savedRemaining = parsed.timeRemaining ?? defaults.timeRemaining
        const parsedEndTime = Number(parsed.endTime)
        const hasEndTime = Number.isFinite(parsedEndTime)
        const legacyEndTime = parsed.savedAt != null && parsed.timeRemaining != null
          ? parsed.savedAt + parsed.timeRemaining * 1000
          : null
        const endTime = hasEndTime ? parsedEndTime : legacyEndTime

        if (parsed.isRunning && endTime != null) {
          const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
          return {
            ...defaults,
            activeTaskId: parsed.activeTaskId ?? null,
            totalTime,
            isBreak: !!parsed.isBreak,
            isRunning: true,
            timeRemaining: remaining,
            elapsedWhileRunning: totalTime - remaining,
            endTime
          }
        }
        return {
          ...defaults,
          activeTaskId: parsed.activeTaskId ?? null,
          totalTime,
          timeRemaining: savedRemaining,
          isBreak: !!parsed.isBreak,
          elapsedWhileRunning: parsed.elapsedWhileRunning ?? (totalTime - savedRemaining),
          endTime: null
        }
      }
    } catch { /* ignore */ }
    return defaults
  })
  const bellEnabledRef = useRef(bellEnabled)
  useEffect(() => { bellEnabledRef.current = bellEnabled }, [bellEnabled])
  const bellAudioRef = useRef(null)
  const audioCtxRef = useRef(null)
  const bellBufferRef = useRef(null)
  const playNotificationRef = useRef(null)
  const timerWorkerRef = useRef(null)
  const heartbeatRef = useRef(null)

  // Heartbeat Worker — stateless pulse that survives StrictMode remounts cleanly
  useEffect(() => {
    const code = `setInterval(() => self.postMessage('tick'), 500);`
    const blob = new Blob([code], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    const worker = new Worker(url)
    worker.onmessage = () => heartbeatRef.current?.()
    timerWorkerRef.current = worker;
    return () => {
      worker.terminate()
      URL.revokeObjectURL(url)
    }
  }, [])

  // Persist pomodoro state on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.POMODORO_TIMER, JSON.stringify({
      ...timerState, activePresetIndex, bellEnabled
    }))
  }, [timerState, activePresetIndex, bellEnabled])

  // Persist pomodoro presets on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.POMODORO_PRESETS, JSON.stringify(presets))
  }, [presets])

  // Modal state
  const [blockModalOpen, setBlockModalOpen] = useState(false)
  const [editingBlock, setEditingBlock] = useState(null)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskModalColumn, setTaskModalColumn] = useState('backlog')
  const [editingTask, setEditingTask] = useState(null)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [loadConfirmOpen, setLoadConfirmOpen] = useState(false)
  const [pendingLoadData, setPendingLoadData] = useState(null)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [demoConfirmOpen, setDemoConfirmOpen] = useState(false)
  const [recycleDayConfirmOpen, setRecycleDayConfirmOpen] = useState(false)
  const [meetingModalOpen, setMeetingModalOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState(null)

  // Menu state
  const [menuOpen, setMenuOpen] = useState(false)
  const [aboutModalOpen, setAboutModalOpen] = useState(false)
  const fileInputRef = useRef(null)
  const editPresetModalRef = useRef(null)
  useFocusTrap(editPresetModalRef, editingPresetIndex !== null)

  // Drag state
  const [draggedTaskId, setDraggedTaskId] = useState(null)
  const [dragSource, setDragSource] = useState(null)
  const [dragSourceProjectId, setDragSourceProjectId] = useState(null)

  // Section visibility state
  const savedPaneVisibility = useMemo(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PANE_VISIBILITY)
      return data ? JSON.parse(data) : {}
    } catch { return {} }
  }, [])
  const [showReminders, setShowReminders] = useState(true)
  const [showPomodoro, setShowPomodoro] = useState(savedPaneVisibility.pomodoro !== false)
  const [showKanban, setShowKanban] = useState(true)
  const [showMentalBandwidth, setShowMentalBandwidth] = useState(savedPaneVisibility.mentalBandwidth !== false)
  const [energyLevels, setEnergyLevels] = useState(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ENERGY_LEVELS)
      return data ? pruneEnergyData(JSON.parse(data)) : {}
    } catch { return {} }
  })
  const [energyAverages, setEnergyAverages] = useState(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ENERGY_AVERAGES)
      if (data) {
        const parsed = JSON.parse(data)
        if (parsed.date === getTodayString()) return parsed.averages
      }
      return null
    } catch { return null }
  })
  const [showFocusChecklist, setShowFocusChecklist] = useState(savedPaneVisibility.focusChecklist !== false)
  const [showCurrentFocus, setShowCurrentFocus] = useState(savedPaneVisibility.currentFocus !== false)
  const [currentFocus, setCurrentFocus] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CURRENT_FOCUS) || ''
    } catch { return '' }
  })
  const [focusChecklist, setFocusChecklist] = useState(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FOCUS_CHECKLIST)
      return data ? JSON.parse(data) : { phoneSilenced: false, alertsMuted: false, wifiOff: false, monitorOff: false, musicOn: false, notificationsOff: false, doorClosed: false, messagesOff: false, browsersClosed: false }
    } catch { return { phoneSilenced: false, alertsMuted: false, wifiOff: false, monitorOff: false, musicOn: false, notificationsOff: false, doorClosed: false, messagesOff: false, browsersClosed: false } }
  })
  const [focusOrder, setFocusOrder] = useState(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FOCUS_ORDER)
      if (data) {
        const parsed = JSON.parse(data)
        const missing = DEFAULT_FOCUS_ORDER.filter(k => !parsed.includes(k))
        return [...parsed, ...missing]
      }
      return DEFAULT_FOCUS_ORDER
    } catch { return DEFAULT_FOCUS_ORDER }
  })
  const [showBrainDump, setShowBrainDump] = useState(savedPaneVisibility.brainDump !== false)
  const [showBreakActivities, setShowBreakActivities] = useState(savedPaneVisibility.breakActivities !== false)
  const [showThemes, setShowThemes] = useState(savedPaneVisibility.themes !== false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PANE_VISIBILITY, JSON.stringify({
      pomodoro: showPomodoro,
      mentalBandwidth: showMentalBandwidth,
      focusChecklist: showFocusChecklist,
      currentFocus: showCurrentFocus,
      brainDump: showBrainDump,
      breakActivities: showBreakActivities,
      themes: showThemes,
    }))
  }, [showPomodoro, showMentalBandwidth, showFocusChecklist, showCurrentFocus, showBrainDump, showBreakActivities, showThemes])

  const breakEndTimeRef = useRef(null)
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BREAK_TIMER)
      if (saved) {
        const parsed = JSON.parse(saved)
        const parsedEndTime = Number(parsed.endTime)
        const hasEndTime = Number.isFinite(parsedEndTime)
        const legacyEndTime = parsed.savedAt != null && parsed.remaining != null
          ? parsed.savedAt + parsed.remaining * 1000
          : null
        const endTime = hasEndTime ? parsedEndTime : legacyEndTime
        if (parsed.running && endTime != null) {
          breakEndTimeRef.current = endTime
          return Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
        }
        return parsed.remaining ?? 15 * 60
      }
    } catch { /* ignore */ }
    return 15 * 60
  })
  const [breakTimerRunning, setBreakTimerRunning] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BREAK_TIMER)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.running) {
          const parsedEndTime = Number(parsed.endTime)
          const hasEndTime = Number.isFinite(parsedEndTime)
          const legacyEndTime = parsed.savedAt != null && parsed.remaining != null
            ? parsed.savedAt + parsed.remaining * 1000
            : null
          return hasEndTime || legacyEndTime != null
        }
      }
    } catch { /* ignore */ }
    return false
  })
  const [activeBreak, setActiveBreak] = useState(null) // { file, name, totalTime }
  const defaultBreakActivities = [
    { file: 'icons8-meditation-64.png', name: 'Meditate' },
    { file: 'icons8-breath-64.png', name: 'Breathing exercise' },
    { file: 'icons8-yoga-64.png', name: 'Do some yoga' },
    { file: 'icons8-stretching-hamstring-64.png', name: 'Stretch a little' },
    { file: 'icons8-pilates-64.png', name: 'Do pilates' },
    { file: 'icons8-plank-64.png', name: 'Hold a plank' },
    { file: 'icons8-squats-64.png', name: 'Do some squats' },
    { file: 'icons8-pushups-64.png', name: 'Do push-ups' },
    { file: 'icons8-pullups-64.png', name: 'Do pull-ups' },
    { file: 'icons8-strength-64.png', name: 'Lift weights' },
    { file: 'icons8-skipping-rope-64.png', name: 'Jump rope' },
    { file: 'icons8-spinning-64.png', name: 'Cycle a bit' },
    { file: 'icons8-running-64.png', name: 'Go for a run' },
    { file: 'icons8-treadmill-64.png', name: 'Hit the treadmill' },
    { file: 'icons8-stairs-64.png', name: 'Walk up some stairs' },
    { file: 'icons8-basketball-player-64.png', name: 'Play basketball' },
    { file: 'icons8-walking-64.png', name: 'Go for a walk' },
    { file: 'icons8-water-64.png', name: 'Drink some water' },
    { file: 'icons8-hot-drink-64.png', name: 'Have a hot drink' },
    { file: 'icons8-eat-64.png', name: 'Time to eat' },
    { file: 'icons8-shower-64.png', name: 'Take a shower' },
    { file: 'icons8-sauna-64.png', name: 'Sauna time' },
    { file: 'icons8-eye-64.png', name: 'Stare at a wall' },
    { file: 'icons8-open-window-64.png', name: 'Open a window' },
    { file: 'icons8-smelling-64.png', name: 'Smell the roses' },
    { file: 'icons8-thinking-bubble-64.png', name: 'Take a step back' },
    { file: 'icons8-sitting-on-chair-64.png', name: 'Mindfulness' },
    { file: 'icons8-cat-64.png', name: 'Pet the cat' },
    { file: 'icons8-dog-64.png', name: 'Walk the dog' },
    { file: 'icons8-laundry-64.png', name: 'Do the laundry' },
    { file: 'icons8-trash-64.png', name: 'Take out the trash' },
    { file: 'icons8-dirty-dishes-64.png', name: 'Do the dishes' },
    { file: 'icons8-housekeeping-64.png', name: 'Tidy up' },
    { file: 'icons8-potted-plant-64.png', name: 'Water the plants' },
    { file: 'icons8-push-64.png', name: 'Isometric exercise' },
    { file: 'icons8-unicorn-64.png', name: 'Dream a little' },
    { file: 'icons8-draw-64.png', name: 'Doodle a little' },
    { file: 'icons8-paper-plane-64.png', name: 'Build a paper plane' },
    { file: 'icons8-relax-64.png', name: 'Just relax' },
    { file: 'icons8-love-letter-64.png', name: 'Write a kind note' },
  ]
  const [breakActivities, setBreakActivities] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BREAK_ACTIVITIES_ORDER)
      if (saved) {
        const parsed = JSON.parse(saved)
        const savedFiles = new Set(parsed.map(a => a.file))
        const newActivities = defaultBreakActivities.filter(a => !savedFiles.has(a.file))
        if (newActivities.length > 0) return [...parsed, ...newActivities]
        return parsed
      }
    } catch { /* ignore */ }
    return defaultBreakActivities
  })
  const [hiddenBreakActivities, setHiddenBreakActivities] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BREAK_HIDDEN_ACTIVITIES)
      if (saved) return new Set(JSON.parse(saved))
    } catch { /* ignore */ }
    return new Set()
  })
  const [breakActivitySettings, setBreakActivitySettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BREAK_ACTIVITY_SETTINGS)
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return {}
  })
  const getBreakTooltip = (activity) => {
    const custom = breakActivitySettings[activity.file]?.tooltip
    return custom || defaultBreakActivities.find(a => a.file === activity.file)?.name || activity.name
  }
  const isBreakActivityEnabled = (file) => breakActivitySettings[file]?.enabled !== false
  const updateBreakActivitySettings = (newSettings) => {
    setBreakActivitySettings(newSettings)
    localStorage.setItem(STORAGE_KEYS.BREAK_ACTIVITY_SETTINGS, JSON.stringify(newSettings))
  }
  const [draggedBreakIdx, setDraggedBreakIdx] = useState(null)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BREAK_TIMER, JSON.stringify({
      remaining: breakTimeRemaining, running: breakTimerRunning, endTime: breakEndTimeRef.current
    }))
  }, [breakTimeRemaining, breakTimerRunning])
  const [brainDump, setBrainDump] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.BRAIN_DUMP) || ''
    } catch { return '' }
  })
  const [brainDumpQuick, setBrainDumpQuick] = useState('')
  const brainDumpTimerRef = useRef(null)
  const brainDumpTextareaRef = useRef(null)
  const [brainDumpClearConfirmOpen, setBrainDumpClearConfirmOpen] = useState(false)
  const [brainDumpCopied, setBrainDumpCopied] = useState(false)
  const [recordingModalOpen, setRecordingModalOpen] = useState(false)
  const [contextSwitchData, setContextSwitchData] = useState(() => {
    const defaults = { date: getTodayString(), interrupted: 0, switched: 0 }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONTEXT_SWITCHES)
      if (data) {
        const parsed = JSON.parse(data)
        if (parsed.date === getTodayString()) {
          return { ...defaults, ...parsed, interrupted: parsed.interrupted ?? 0, switched: parsed.switched ?? 0 }
        }
      }
      return defaults
    } catch { return defaults }
  })
  const [contextSwitchClearConfirmOpen, setContextSwitchClearConfirmOpen] = useState(false)
  const [scheduleClearConfirmOpen, setScheduleClearConfirmOpen] = useState(false)
  const [shortlistClearConfirmOpen, setShortlistClearConfirmOpen] = useState(false)
  const [themeModalOpen, setThemeModalOpen] = useState(false)
  const [editingTheme, setEditingTheme] = useState(null)
  const [themesClearConfirmOpen, setThemesClearConfirmOpen] = useState(false)
  const [showMeetings, setShowMeetings] = useState(true)
  const [showTimeBlocks, setShowTimeBlocks] = useState(true)

  // Sticky notes state
  const [stickyNotes, setStickyNotes] = useState([])
  const [showStickyNotes, setShowStickyNotes] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [draggingNoteId, setDraggingNoteId] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [topNoteId, setTopNoteId] = useState(null)
  const [deletingNoteId, setDeletingNoteId] = useState(null)

  // Habit tracker drawer state
  const [habitDrawerOpen, setHabitDrawerOpen] = useState(false)
  const [habitModalOpen, setHabitModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  const habitsSectionRef = useRef(null)
  const habitDrawerRef = useRef(null)
  const secondDrawerRef = useRef(null)
  const [triggerLeft, setTriggerLeft] = useState(null)

  // Second drawer pane state
  const [secondDrawerOpen, setSecondDrawerOpen] = useState(false)
  const [projectTaskModalOpen, setProjectTaskModalOpen] = useState(false)
  const [projectTaskModalProjectId, setProjectTaskModalProjectId] = useState(null)
  const [editingProjectTask, setEditingProjectTask] = useState(null)
  const [addProjectModalOpen, setAddProjectModalOpen] = useState(false)
  const [deleteProjectConfirmOpen, setDeleteProjectConfirmOpen] = useState(false)
  const [deletingProjectId, setDeletingProjectId] = useState(null)

  // Whiteboard drawer state
  const [whiteboardDrawerOpen, setWhiteboardDrawerOpen] = useState(false)
  const [whiteboardsData, setWhiteboardsData] = useState(getDefaultWhiteboards())

  // Alert dialog state
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '' })
  const showAlert = (title, message) => setAlertDialog({ isOpen: true, title, message })
  const closeAlert = () => setAlertDialog({ isOpen: false, title: '', message: '' })

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    try {
      console.log('TouchTask: Initializing...')
      const master = loadMasterBlocks()
      console.log('TouchTask: Master blocks loaded', master)
      const existingDaily = loadDailyState()
      console.log('TouchTask: Daily state loaded', existingDaily)
      const daily = initializeDailyState(master, existingDaily)
      console.log('TouchTask: Daily state initialized', daily)
      let kanban = loadKanbanTasks()
      console.log('TouchTask: Kanban tasks loaded', kanban)
      const appSettings = loadSettings()
      console.log('TouchTask: Settings loaded', appSettings)
      const loadedReminders = loadReminders()
      console.log('TouchTask: Shortlist loaded', loadedReminders)
      const loadedMeetings = loadMeetings()
      console.log('TouchTask: Meetings loaded', loadedMeetings)
      const loadedHabitTracker = loadHabitTracker()
      console.log('TouchTask: Habit tracker loaded', loadedHabitTracker)
      let loadedProjectBoard = loadProjectBoard()
      console.log('TouchTask: Project board loaded', loadedProjectBoard)
      let loadedRegistry = loadProjectRegistry()
      if (loadedRegistry.length === 0) {
        const registryMap = new Map()
        for (const p of loadedProjectBoard.projects) {
          registryMap.set(p.name.toLowerCase(), { id: p.id, name: p.name })
        }
        for (const task of kanban.tasks) {
          if (task.project && !registryMap.has(task.project.toLowerCase())) {
            const isAlreadyId = loadedProjectBoard.projects.some(p => p.id === task.project)
            if (!isAlreadyId) {
              registryMap.set(task.project.toLowerCase(), { id: generateId(), name: task.project })
            }
          }
        }
        loadedRegistry = Array.from(registryMap.values())
        if (loadedRegistry.length > 0) {
          const nameToId = new Map(loadedRegistry.map(p => [p.name.toLowerCase(), p.id]))
          kanban = {
            tasks: kanban.tasks.map(t => {
              if (t.project && nameToId.has(t.project.toLowerCase())) {
                return { ...t, project: nameToId.get(t.project.toLowerCase()) }
              }
              return t
            })
          }
          saveKanbanTasks(kanban)
          loadedProjectBoard = {
            projects: loadedProjectBoard.projects.map(p => ({
              ...p,
              tasks: p.tasks.map(t => ({ ...t, project: p.id }))
            }))
          }
          saveProjectBoard(loadedProjectBoard)
          saveProjectRegistry(loadedRegistry)
        }
      }
      console.log('TouchTask: Project registry loaded', loadedRegistry)
      let loadedThemes = loadThemes()
      // Strip orphan project IDs from themes
      const validIds = new Set(loadedRegistry.map(p => p.id))
      let themesChanged = false
      loadedThemes = loadedThemes.map(t => {
        const cleaned = t.projectIds.filter(id => validIds.has(id))
        if (cleaned.length !== t.projectIds.length) { themesChanged = true; return { ...t, projectIds: cleaned } }
        return t
      })
      if (themesChanged) saveThemes(loadedThemes)
      console.log('TouchTask: Themes loaded', loadedThemes)
      const loadedWhiteboards = loadWhiteboards()
      console.log('TouchTask: Whiteboards loaded', loadedWhiteboards)
      const loadedStickyNotes = clampNotesToViewport(loadStickyNotes(), window.innerWidth, window.innerHeight)
      console.log('TouchTask: Sticky notes loaded', loadedStickyNotes)

      setMasterBlocks(master)
      setDailyState(daily)
      setKanbanTasks(kanban)
      setReminders(loadedReminders)
      setMeetings(loadedMeetings)
      setHabitTracker(loadedHabitTracker)
      setProjectBoard(loadedProjectBoard)
      setProjectRegistry(loadedRegistry)
      setThemes(loadedThemes)
      setWhiteboardsData(loadedWhiteboards)
      setStickyNotes(loadedStickyNotes)
      setSettings(appSettings)
      setTimerState(prev => {
        if (localStorage.getItem(STORAGE_KEYS.POMODORO_TIMER)) return prev
        return {
          ...prev,
          timeRemaining: presets[activePresetIndex].work * 60,
          totalTime: presets[activePresetIndex].work * 60,
          endTime: null
        }
      })
      setLoading(false)
      console.log('TouchTask: Initialization complete')
    } catch (error) {
      console.error('TouchTask: Initialization error', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Update habit tracker trigger + drawer position
  useEffect(() => {
    const updatePosition = () => {
      const el = habitsSectionRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setTriggerLeft(rect.right - 136)
      document.documentElement.style.setProperty('--habits-pane-width', `${rect.width}px`)
      const paneCenter = rect.left + rect.width / 2
      // Center habit drawer on habits pane, clamped to viewport
      const hd = habitDrawerRef.current
      if (hd) {
        const hdWidth = hd.offsetWidth
        const idealLeft = paneCenter - hdWidth / 2
        const clampedLeft = Math.max(16, Math.min(idealLeft, window.innerWidth - hdWidth - 16))
        hd.style.left = `${clampedLeft}px`
      }
      // Center second drawer on habits pane, clamped to viewport
      const sd = secondDrawerRef.current
      if (sd) {
        const sdWidth = sd.offsetWidth
        const idealLeft = paneCenter - sdWidth / 2
        const clampedLeft = Math.max(16, Math.min(idealLeft, window.innerWidth - sdWidth - 16))
        sd.style.left = `${clampedLeft}px`
      }
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [habitDrawerOpen, secondDrawerOpen, showStickyNotes, loading])

  // Close habit drawer on click outside (project board only toggles via its button)
  useEffect(() => {
    if (!habitDrawerOpen) return
    const handleClickOutside = (e) => {
      if (e.target.closest('.habit-tracker-drawer') || e.target.closest('.drawer-trigger') || e.target.closest('.modal-overlay')) return
      setHabitDrawerOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [habitDrawerOpen])

  // Sticky notes keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Shift+Tab to toggle sticky notes
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault()
        setShowStickyNotes(prev => {
          const opening = !prev
          if (opening) {
            setHabitDrawerOpen(false); setSecondDrawerOpen(false); setWhiteboardDrawerOpen(false)
            if (stickyNotes.length === 0) {
              const x = window.innerWidth / 2 - 150 + (Math.random() - 0.5) * 100
              const y = window.innerHeight / 2 - 150 + (Math.random() - 0.5) * 100
              addStickyNote(x, y)
            } else {
              const clamped = clampNotesToViewport(stickyNotes, window.innerWidth, window.innerHeight)
              if (clamped !== stickyNotes) { setStickyNotes(clamped); saveStickyNotes(clamped) }
            }
          }
          return opening
        })
        return
      }
      // Escape to close editing, sticky notes, or drawers
      if (e.key === 'Escape') {
        if (showStickyNotes) {
          if (editingNoteId) {
            setEditingNoteId(null)
          } else {
            setShowStickyNotes(false)
          }
        } else if (whiteboardDrawerOpen) {
          setWhiteboardDrawerOpen(false)
        } else if (habitDrawerOpen) {
          setHabitDrawerOpen(false)
        } else if (secondDrawerOpen) {
          setSecondDrawerOpen(false)
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showStickyNotes, editingNoteId, stickyNotes, habitDrawerOpen, secondDrawerOpen, whiteboardDrawerOpen])

  // Adjust sticky note positions on resize when visible
  useEffect(() => {
    if (!showStickyNotes) return
    const handleResize = () => {
      setStickyNotes(prev => {
        const clamped = clampNotesToViewport(prev, window.innerWidth, window.innerHeight)
        if (clamped !== prev) saveStickyNotes(clamped)
        return clamped
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [showStickyNotes])

  // ============================================
  // DAILY STATE HANDLERS
  // ============================================

  const updateDailyState = useCallback((updater) => {
    setDailyState(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater
      saveDailyState(newState)
      return newState
    })
  }, [])

  const toggleFocusMode = () => {
    updateDailyState(prev => ({
      ...prev,
      focus_mode: !prev.focus_mode
    }))
  }

  const toggleBlockMinimized = (blockId) => {
    updateDailyState(prev => ({
      ...prev,
      blocks: prev.blocks.map(b =>
        b.id === blockId ? { ...b, minimized: !b.minimized } : b
      )
    }))
  }

  const cycleSubtaskState = (blockId, subtaskId) => {
    updateDailyState(prev => ({
      ...prev,
      blocks: prev.blocks.map(block => {
        if (block.id !== blockId) return block
        return {
          ...block,
          subtasks: block.subtasks.map(st => {
            if (st.id !== subtaskId) return st
            const nextState = st.state === 'default' ? 'done'
                           : st.state === 'done' ? 'skipped'
                           : 'default'
            return { ...st, state: nextState }
          })
        }
      })
    }))
  }

  const completeBlock = (blockId, skipped = false) => {
    updateDailyState(prev => ({
      ...prev,
      blocks: prev.blocks.map(b =>
        b.id === blockId ? { ...b, completed: true, skipped } : b
      ),
      completed_block_ids: [...prev.completed_block_ids, blockId]
    }))
  }

  const restoreBlock = (blockId) => {
    updateDailyState(prev => ({
      ...prev,
      blocks: prev.blocks.map(b =>
        b.id === blockId ? { ...b, completed: false, skipped: false } : b
      ),
      completed_block_ids: prev.completed_block_ids.filter(id => id !== blockId)
    }))
  }

  const toggleRepeatDay = (blockId, dayIndex) => {
    // Update master blocks
    setMasterBlocks(prev => {
      const updated = {
        ...prev,
        blocks: prev.blocks.map(block => {
          if (block.id !== blockId) return block
          const newDays = block.repeat_days.includes(dayIndex)
            ? block.repeat_days.filter(d => d !== dayIndex)
            : [...block.repeat_days, dayIndex].sort((a, b) => a - b)
          return { ...block, repeat_days: newDays }
        })
      }
      saveMasterBlocks(updated)
      return updated
    })

    // Also update daily state
    updateDailyState(prev => ({
      ...prev,
      blocks: prev.blocks.map(block => {
        if (block.id !== blockId) return block
        const newDays = block.repeat_days.includes(dayIndex)
          ? block.repeat_days.filter(d => d !== dayIndex)
          : [...block.repeat_days, dayIndex].sort((a, b) => a - b)
        return { ...block, repeat_days: newDays }
      })
    }))
  }

  // ============================================
  // MASTER BLOCKS HANDLERS (Add/Edit/Delete)
  // ============================================

  const addBlock = (blockData) => {
    const newBlock = {
      id: generateId(),
      ...blockData,
      subtasks: blockData.subtasks.map(st => ({
        ...st,
        id: generateId()
      }))
    }

    // Update master
    setMasterBlocks(prev => {
      const updated = { ...prev, blocks: [...prev.blocks, newBlock] }
      saveMasterBlocks(updated)
      return updated
    })

    // Add to daily state with daily fields
    updateDailyState(prev => ({
      ...prev,
      blocks: [...prev.blocks, {
        ...newBlock,
        completed: false,
        minimized: false,
        subtasks: newBlock.subtasks.map(st => ({ ...st, state: 'default' }))
      }]
    }))
  }

  const updateBlock = (blockId, blockData) => {
    // Prepare subtasks with ids (keep existing ids for existing subtasks, generate for new ones)
    const updatedSubtasks = blockData.subtasks.map(st => ({
      ...st,
      id: st.id || generateId()
    }))

    const updatedBlockData = {
      ...blockData,
      subtasks: updatedSubtasks
    }

    // Update master
    setMasterBlocks(prev => {
      const updated = {
        ...prev,
        blocks: prev.blocks.map(block =>
          block.id === blockId ? { ...block, ...updatedBlockData } : block
        )
      }
      saveMasterBlocks(updated)
      return updated
    })

    // Update daily state - preserve daily-specific fields (completed, minimized, subtask states)
    updateDailyState(prev => ({
      ...prev,
      blocks: prev.blocks.map(block => {
        if (block.id !== blockId) return block
        // Merge subtask states from existing daily state
        const existingSubtaskStates = {}
        block.subtasks.forEach(st => {
          existingSubtaskStates[st.id] = st.state
        })
        return {
          ...block,
          ...updatedBlockData,
          subtasks: updatedSubtasks.map(st => ({
            ...st,
            state: existingSubtaskStates[st.id] || 'default'
          }))
        }
      })
    }))
  }

  const openEditBlock = (block) => {
    setEditingBlock(block)
    setBlockModalOpen(true)
  }

  const closeBlockModal = () => {
    setBlockModalOpen(false)
    setEditingBlock(null)
  }

  const deleteBlock = (blockId) => {
    // Remove from master blocks
    setMasterBlocks(prev => {
      const updated = {
        ...prev,
        blocks: prev.blocks.filter(block => block.id !== blockId)
      }
      saveMasterBlocks(updated)
      return updated
    })

    // Remove from daily state
    updateDailyState(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== blockId),
      completed_block_ids: prev.completed_block_ids.filter(id => id !== blockId)
    }))

    // Close the modal
    closeBlockModal()
  }

  // ============================================
  // KANBAN HANDLERS
  // ============================================

  const updateKanbanTasks = useCallback((updater) => {
    setKanbanTasks(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater
      saveKanbanTasks(newState)
      return newState
    })
  }, [])

  const addKanbanTask = (taskData) => {
    const newTask = {
      id: taskData.id || generateId(),
      ...taskData,
      time_logged_minutes: taskData.time_logged_minutes || 0,
      created_at: taskData.created_at || new Date().toISOString(),
      completed_at: null
    }

    updateKanbanTasks(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }))
  }

  const moveKanbanTask = (taskId, newColumn) => {
    updateKanbanTasks(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => {
        if (task.id !== taskId) return task
        return {
          ...task,
          column: newColumn,
          completed_at: newColumn === 'done' ? new Date().toISOString() : null
        }
      })
    }))
  }

  const incrementTaskTime = useCallback((taskId, minutes = 1) => {
    updateKanbanTasks(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId
          ? { ...task, time_logged_minutes: task.time_logged_minutes + minutes }
          : task
      )
    }))
  }, [updateKanbanTasks])

  const clearDoneTasks = () => {
    updateKanbanTasks(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.column !== 'done')
    }))
  }

  const updateKanbanTask = (taskId, taskData) => {
    updateKanbanTasks(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, ...taskData } : task
      )
    }))
  }

  const deleteKanbanTask = (taskId) => {
    updateKanbanTasks(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId)
    }))
  }

  const openEditTask = (task) => {
    setEditingTask(task)
    setTaskModalColumn(task.column)
    setTaskModalOpen(true)
  }

  const closeTaskModal = () => {
    setTaskModalOpen(false)
    setEditingTask(null)
  }

  // ============================================
  // SETTINGS HANDLERS
  // ============================================

  const updateSettings = (newSettings) => {
    setSettings(newSettings)
    saveSettings(newSettings)
  }

  // ============================================
  // SAVE/LOAD HANDLERS
  // ============================================

  const handleSaveData = () => {
    // Export masterBlocks, kanbanTasks, reminders, and meetings (no dailyState, settings, or metadata)
    const exportData = {
      masterBlocks: masterBlocks.blocks,
      kanbanTasks: kanbanTasks.tasks,
      reminders: reminders,
      meetings: meetings.items,
      habitTracker: habitTracker.habits,
      projectBoard: projectBoard.projects,
      projectRegistry: projectRegistry,
      themes: themes,
      whiteboards: whiteboardsData,
      stickyNotes: stickyNotes,
      brainDump: brainDump,
      energyLevels: energyLevels,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `touchtask-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setMenuOpen(false)
  }

  const handleLoadClick = () => {
    fileInputRef.current?.click()
    setMenuOpen(false)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result)
        // Validate format: masterBlocks (array) and kanbanTasks (array), reminders optional
        if (Array.isArray(data.masterBlocks) && Array.isArray(data.kanbanTasks)) {
          // Ensure reminders and meetings are arrays (for backward compatibility with old backups)
          if (!Array.isArray(data.reminders)) {
            data.reminders = []
          }
          if (!Array.isArray(data.meetings)) {
            data.meetings = []
          }
          setPendingLoadData(data)
          setLoadConfirmOpen(true)
        } else {
          alert('Invalid backup file format. Expected masterBlocks and kanbanTasks arrays.')
        }
      } catch (err) {
        alert('Failed to parse backup file')
        console.error('Load error:', err)
      }
    }
    reader.readAsText(file)
    e.target.value = '' // Reset input
  }

  const confirmLoadData = () => {
    if (!pendingLoadData) return

    // Clear all localStorage
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })

    // Apply loaded data - masterBlocks and kanbanTasks are direct arrays
    const loadedMasterBlocks = { blocks: pendingLoadData.masterBlocks }
    let loadedKanbanTasks = { tasks: pendingLoadData.kanbanTasks }

    saveMasterBlocks(loadedMasterBlocks)
    setMasterBlocks(loadedMasterBlocks)

    // Always treat as a new day - copy all master blocks to daily state
    const newDaily = initializeDailyState(loadedMasterBlocks, null)
    setDailyState(newDaily)

    // Load reminders
    const loadedReminders = pendingLoadData.reminders || []
    saveReminders(loadedReminders)
    setReminders(loadedReminders)

    // Load meetings
    const loadedMeetings = { date: getTodayString(), items: pendingLoadData.meetings || [] }
    saveMeetings(loadedMeetings)
    setMeetings(loadedMeetings)

    // Load habit tracker
    const loadedHabitTracker = { habits: pendingLoadData.habitTracker || [] }
    saveHabitTracker(loadedHabitTracker)
    setHabitTracker(loadedHabitTracker)

    // Load project board
    let loadedProjectBoard = { projects: pendingLoadData.projectBoard || [] }

    // Load project registry
    let loadedProjectRegistry = pendingLoadData.projectRegistry || []
    if (loadedProjectRegistry.length === 0) {
      const registryMap = new Map()
      loadedProjectBoard.projects.forEach(p => {
        registryMap.set(p.name.toLowerCase(), { id: p.id, name: p.name })
      })
      loadedKanbanTasks.tasks.forEach(task => {
        if (!task.project) return
        const hasProjectId = loadedProjectBoard.projects.some(p => p.id === task.project)
        if (!hasProjectId && !registryMap.has(task.project.toLowerCase())) {
          registryMap.set(task.project.toLowerCase(), { id: generateId(), name: task.project })
        }
      })
      loadedProjectRegistry = Array.from(registryMap.values())
    }

    if (loadedProjectRegistry.length > 0) {
      const nameToId = new Map(loadedProjectRegistry.map(p => [p.name.toLowerCase(), p.id]))
      loadedKanbanTasks = {
        tasks: loadedKanbanTasks.tasks.map(task => {
          if (task.project && nameToId.has(task.project.toLowerCase())) {
            return { ...task, project: nameToId.get(task.project.toLowerCase()) }
          }
          return task
        })
      }
      loadedProjectBoard = {
        projects: loadedProjectBoard.projects.map(project => ({
          ...project,
          tasks: project.tasks.map(task => ({ ...task, project: project.id }))
        }))
      }
    }

    saveKanbanTasks(loadedKanbanTasks)
    setKanbanTasks(loadedKanbanTasks)
    saveProjectBoard(loadedProjectBoard)
    setProjectBoard(loadedProjectBoard)

    saveProjectRegistry(loadedProjectRegistry)
    setProjectRegistry(loadedProjectRegistry)

    // Load themes
    const loadedThemes2 = pendingLoadData.themes || []
    saveThemes(loadedThemes2)
    setThemes(loadedThemes2)

    // Load whiteboards
    const loadedWhiteboards = pendingLoadData.whiteboards || getDefaultWhiteboards()
    saveWhiteboards(loadedWhiteboards)
    setWhiteboardsData(loadedWhiteboards)

    // Load sticky notes
    const loadedStickyNotes = pendingLoadData.stickyNotes || []
    saveStickyNotes(loadedStickyNotes)
    setStickyNotes(loadedStickyNotes)

    // Load brain dump
    const loadedBrainDump = pendingLoadData.brainDump || ''
    localStorage.setItem(STORAGE_KEYS.BRAIN_DUMP, loadedBrainDump)
    setBrainDump(loadedBrainDump)

    // Load energy levels
    const loadedEnergy = pendingLoadData.energyLevels || {}
    const prunedEnergy = pruneEnergyData(loadedEnergy)
    localStorage.setItem(STORAGE_KEYS.ENERGY_LEVELS, JSON.stringify(prunedEnergy))
    setEnergyLevels(prunedEnergy)
    const loadedAverages = computeEnergyAverages(prunedEnergy)
    localStorage.setItem(STORAGE_KEYS.ENERGY_AVERAGES, JSON.stringify({ date: getTodayString(), averages: loadedAverages }))
    setEnergyAverages(loadedAverages)

    // Reset settings to defaults
    const defaultSettings = getDefaultSettings()
    saveSettings(defaultSettings)
    setSettings(defaultSettings)

    setPendingLoadData(null)
    setLoadConfirmOpen(false)
  }

  const handleResetClick = () => {
    setResetConfirmOpen(true)
    setMenuOpen(false)
  }

  const confirmResetData = () => {
    // Clear all localStorage
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })

    // Reset to empty/default state
    const emptyMaster = { blocks: [] }
    const emptyKanban = { tasks: [] }
    const defaultSettings = getDefaultSettings()

    saveMasterBlocks(emptyMaster)
    setMasterBlocks(emptyMaster)

    const newDaily = initializeDailyState(emptyMaster, null)
    setDailyState(newDaily)

    saveKanbanTasks(emptyKanban)
    setKanbanTasks(emptyKanban)

    // Clear reminders
    saveReminders([])
    setReminders([])

    // Clear meetings
    const emptyMeetings = { date: getTodayString(), items: [] }
    saveMeetings(emptyMeetings)
    setMeetings(emptyMeetings)

    // Clear habit tracker
    const emptyHabitTracker = { habits: [] }
    saveHabitTracker(emptyHabitTracker)
    setHabitTracker(emptyHabitTracker)

    // Clear project board
    const emptyProjectBoard = { projects: [] }
    saveProjectBoard(emptyProjectBoard)
    setProjectBoard(emptyProjectBoard)

    // Clear project registry
    saveProjectRegistry([])
    setProjectRegistry([])

    // Clear themes
    saveThemes([])
    setThemes([])

    // Clear whiteboards
    const emptyWhiteboards = getDefaultWhiteboards()
    saveWhiteboards(emptyWhiteboards)
    setWhiteboardsData(emptyWhiteboards)

    // Clear sticky notes
    saveStickyNotes([])
    setStickyNotes([])

    // Clear brain dump
    localStorage.setItem(STORAGE_KEYS.BRAIN_DUMP, '')
    setBrainDump('')

    // Clear energy levels
    localStorage.removeItem(STORAGE_KEYS.ENERGY_LEVELS)
    localStorage.removeItem(STORAGE_KEYS.ENERGY_AVERAGES)
    setEnergyLevels({})
    setEnergyAverages(null)

    const defaultTimer = { isRunning: false, isBreak: false, timeRemaining: presets[1].work * 60, totalTime: presets[1].work * 60, activeTaskId: null, elapsedWhileRunning: 0, endTime: null }
    setTimerState(defaultTimer)
    setActivePresetIndex(1)
    setBellEnabled(true)
    breakEndTimeRef.current = null
    setBreakTimeRemaining(15 * 60)
    setBreakTimerRunning(false)
    setActiveBreak(null)

    saveSettings(defaultSettings)
    setSettings(defaultSettings)

    setResetConfirmOpen(false)
  }

  const handleDemoClick = () => {
    setDemoConfirmOpen(true)
    setMenuOpen(false)
  }

  const confirmLoadDemo = () => {
    // Clear all localStorage
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })

    // Load demo/default data
    const demoMaster = getDefaultMasterBlocks()
    const demoKanban = getDefaultKanbanTasks()
    const demoReminders = getDefaultReminders()
    const demoMeetings = getDefaultMeetings()
    const defaultSettings = getDefaultSettings()

    saveMasterBlocks(demoMaster)
    setMasterBlocks(demoMaster)

    const newDaily = initializeDailyState(demoMaster, null)
    setDailyState(newDaily)

    saveKanbanTasks(demoKanban)
    setKanbanTasks(demoKanban)

    // Load demo reminders
    saveReminders(demoReminders)
    setReminders(demoReminders)

    // Load demo meetings
    saveMeetings(demoMeetings)
    setMeetings(demoMeetings)

    // Load demo habit tracker
    const demoHabitTracker = getDefaultHabitTracker()
    saveHabitTracker(demoHabitTracker)
    setHabitTracker(demoHabitTracker)

    // Load demo project board
    const t = () => new Date().toISOString()
    const appLaunchId = generateId()
    const contentPlanId = generateId()
    const websiteRedesignId = generateId()
    const userResearchId = generateId()
    const bugFixesId = generateId()
    const apiIntegrationId = generateId()
    const onboardingId = generateId()
    const q2PlanningId = generateId()
    const pt = (title, category, priority, project, minutes = 0) => ({ id: generateId(), title, category, project, priority, time_logged_minutes: minutes, created_at: t(), completed_at: null })
    const demoProjectBoard = {
      projects: [
        {
          id: appLaunchId, name: 'App Launch', created_at: t(),
          tasks: [
            pt('Write landing page copy', 'Marketing', 'high', appLaunchId),
            pt('Set up analytics dashboard', 'Development', 'normal', appLaunchId),
            pt('Create onboarding flow', 'Design', 'high', appLaunchId, 45),
            pt('Prepare press kit', 'Marketing', 'low', appLaunchId),
            pt('Configure CI/CD pipeline', 'Development', 'normal', appLaunchId, 120),
          ]
        },
        {
          id: contentPlanId, name: 'Content Plan', created_at: t(),
          tasks: [
            pt('Draft blog post outline', 'Writing', 'normal', contentPlanId),
            pt('Record tutorial video', 'Content', 'high', contentPlanId),
            pt('Design social media assets', 'Design', 'low', contentPlanId),
            pt('Write product changelog', 'Writing', 'normal', contentPlanId, 30),
          ]
        },
        {
          id: websiteRedesignId, name: 'Website Redesign', created_at: t(),
          tasks: [
            pt('Audit current site performance', 'Research', 'high', websiteRedesignId, 60),
            pt('Create wireframes for homepage', 'Design', 'high', websiteRedesignId),
            pt('Build responsive nav component', 'Development', 'normal', websiteRedesignId, 90),
          ]
        },
        {
          id: userResearchId, name: 'User Research', created_at: t(),
          tasks: [
            pt('Prepare interview questions', 'Research', 'normal', userResearchId),
            pt('Schedule 5 user interviews', 'Outreach', 'high', userResearchId, 15),
          ]
        },
        {
          id: bugFixesId, name: 'Bug Fixes', created_at: t(),
          tasks: [
            pt('Fix mobile layout overflow', 'Development', 'high', bugFixesId, 25),
          ]
        },
        {
          id: apiIntegrationId, name: 'API Integration', created_at: t(),
          tasks: [
            pt('Design REST API schema', 'Architecture', 'high', apiIntegrationId),
            pt('Implement auth endpoints', 'Development', 'high', apiIntegrationId, 180),
            pt('Write API documentation', 'Documentation', 'normal', apiIntegrationId),
          ]
        },
        {
          id: onboardingId, name: 'Onboarding', created_at: t(),
          tasks: [
            pt('Design welcome wizard', 'Design', 'high', onboardingId),
            pt('Build tooltip tour component', 'Development', 'normal', onboardingId, 40),
          ]
        },
        {
          id: q2PlanningId, name: 'Q2 Planning', created_at: t(),
          tasks: [
            pt('Review Q1 metrics', 'Strategy', 'high', q2PlanningId, 30),
            pt('Define OKRs for Q2', 'Strategy', 'high', q2PlanningId),
            pt('Estimate engineering capacity', 'Planning', 'normal', q2PlanningId),
            pt('Prioritize feature backlog', 'Planning', 'normal', q2PlanningId, 20),
          ]
        }
      ]
    }
    saveProjectBoard(demoProjectBoard)
    setProjectBoard(demoProjectBoard)

    // Build registry from demo project board
    const demoRegistry = demoProjectBoard.projects.map(p => ({ id: p.id, name: p.name }))
    saveProjectRegistry(demoRegistry)
    setProjectRegistry(demoRegistry)

    // Create demo themes
    const demoThemes = [
      { id: generateId(), name: 'Product Launch', color: 'blue', projectIds: demoProjectBoard.projects.filter(p => ['App Launch', 'Content Plan', 'Onboarding'].includes(p.name)).map(p => p.id) },
      { id: generateId(), name: 'Technical Excellence', color: 'green', projectIds: demoProjectBoard.projects.filter(p => ['Website Redesign', 'Bug Fixes', 'API Integration'].includes(p.name)).map(p => p.id) },
      { id: generateId(), name: 'Strategic Planning', color: 'purple', projectIds: demoProjectBoard.projects.filter(p => ['User Research', 'Q2 Planning'].includes(p.name)).map(p => p.id) },
    ]
    saveThemes(demoThemes)
    setThemes(demoThemes)

    // Clear whiteboards (no demo data for whiteboards)
    const emptyWhiteboards = getDefaultWhiteboards()
    saveWhiteboards(emptyWhiteboards)
    setWhiteboardsData(emptyWhiteboards)

    // Load demo sticky notes
    const demoStickyNotes = [
      { id: generateId(), title: 'Shopping List', body: 'Milk\nEggs\nBread\nButter', x: 80, y: 120, createdAt: t() },
      { id: generateId(), title: 'Meeting Notes', body: 'Discuss Q2 roadmap\nReview sprint velocity\nAssign new tasks', x: 420, y: 180, createdAt: t() },
      { id: generateId(), title: '', body: 'Call dentist tomorrow!', x: 250, y: 400, createdAt: t() },
    ]
    saveStickyNotes(demoStickyNotes)
    setStickyNotes(demoStickyNotes)

    // Load demo brain dump
    const demoBrainDump = 'Need to follow up on the API rate limiting issue — the 429s started spiking after we deployed the new batch endpoint. Check if the token bucket config got overwritten.\n\nRemember to ask Sarah about the design review for the settings page. She mentioned something about the toggle spacing feeling off on mobile. Might tie into the responsive grid bug we shelved last sprint.\n\nLook into that weird CSS bug on mobile where the sidebar overlay doesn\'t dismiss on tap outside. Could be a z-index stacking context issue or maybe the backdrop click handler isn\'t firing on touch events.\n\nIdea for the dashboard: what if we added a small sparkline next to each KPI card? Nothing fancy, just the last 7 days trend. Could use the lightweight SVG approach instead of pulling in a full charting library.\n\nNeed to block out time this week to refactor the notification service. The current fan-out logic is getting unwieldy — every new channel we add requires touching three files. Should probably extract a strategy pattern or at least a registry.\n\nParking lot from standup: Alex suggested we look into edge caching for the asset pipeline. Worth a spike if we can get a 30% reduction in TTFB. Grab the Cloudflare docs and compare with our current Fastly setup.'
    localStorage.setItem(STORAGE_KEYS.BRAIN_DUMP, demoBrainDump)
    setBrainDump(demoBrainDump)

    // Load demo energy levels
    const demoEnergy = generateDemoEnergyData()
    localStorage.setItem(STORAGE_KEYS.ENERGY_LEVELS, JSON.stringify(demoEnergy))
    setEnergyLevels(demoEnergy)
    const demoAverages = computeEnergyAverages(demoEnergy)
    localStorage.setItem(STORAGE_KEYS.ENERGY_AVERAGES, JSON.stringify({ date: getTodayString(), averages: demoAverages }))
    setEnergyAverages(demoAverages)

    // Reset pomodoro timer
    const defaultTimer = { isRunning: false, isBreak: false, timeRemaining: presets[1].work * 60, totalTime: presets[1].work * 60, activeTaskId: null, elapsedWhileRunning: 0, endTime: null }
    setTimerState(defaultTimer)
    setActivePresetIndex(1)
    setBellEnabled(true)
    localStorage.setItem(STORAGE_KEYS.POMODORO_TIMER, JSON.stringify({ ...defaultTimer, activePresetIndex: 1, bellEnabled: true }))
    breakEndTimeRef.current = null
    setBreakTimeRemaining(15 * 60)
    setBreakTimerRunning(false)
    setActiveBreak(null)
    localStorage.setItem(STORAGE_KEYS.BREAK_TIMER, JSON.stringify({ remaining: 15 * 60, running: false, endTime: null }))

    saveSettings(defaultSettings)
    setSettings(defaultSettings)

    setDemoConfirmOpen(false)
  }

  const handleRecycleDayClick = () => {
    setRecycleDayConfirmOpen(true)
  }

  const confirmRecycleDay = () => {
    // Re-initialize daily state from master blocks, resetting all progress
    const newDaily = initializeDailyState(masterBlocks, null)
    setDailyState(newDaily)
    setRecycleDayConfirmOpen(false)
  }

  // ============================================
  // REMINDERS HANDLERS
  // ============================================

  const sortByUrgency = (items) => {
    const priority = { red: 0, orange: 1 }
    return [...items].sort((a, b) => (priority[a.urgency] ?? 2) - (priority[b.urgency] ?? 2))
  }

  const addReminder = (text) => {
    if (!text.trim()) return
    const newReminder = {
      id: generateId(),
      text: text.trim()
    }
    const updated = sortByUrgency([...reminders, newReminder])
    setReminders(updated)
    saveReminders(updated)
  }

  const cycleReminderUrgency = (id) => {
    const cycle = [null, 'orange', 'red']
    const updated = sortByUrgency(reminders.map(r => {
      if (r.id !== id) return r
      const idx = cycle.indexOf(r.urgency || null)
      return { ...r, urgency: cycle[(idx + 1) % cycle.length] }
    }))
    setReminders(updated)
    saveReminders(updated)
  }

  const deleteReminder = (id) => {
    const updated = reminders.filter(r => r.id !== id)
    setReminders(updated)
    saveReminders(updated)
  }

  // ============================================
  // PROJECT REGISTRY HELPERS
  // ============================================

  const getProjectName = useCallback((projectId) => {
    if (!projectId) return ''
    const entry = projectRegistry.find(p => p.id === projectId)
    return entry ? entry.name : projectId
  }, [projectRegistry])

  const addRegistryProject = (name) => {
    const trimmed = name.trim()
    if (!trimmed) return null
    const existing = projectRegistry.find(p => p.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) return existing
    const newProject = { id: generateId(), name: trimmed }
    const updated = [...projectRegistry, newProject]
    setProjectRegistry(updated)
    saveProjectRegistry(updated)
    return newProject
  }

  const resolveProjectId = (name) => {
    if (!name || !name.trim()) return ''
    const trimmed = name.trim()
    const existing = projectRegistry.find(p => p.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) return existing.id
    const newProject = addRegistryProject(trimmed)
    return newProject ? newProject.id : ''
  }

  // ============================================
  // THEMES HANDLERS
  // ============================================

  const addTheme = (themeData) => {
    const newTheme = {
      id: generateId(),
      name: themeData.name.trim(),
      color: themeData.color || null,
      projectIds: themeData.projectIds || []
    }
    const updated = [...themes, newTheme]
    setThemes(updated)
    saveThemes(updated)
  }

  const editTheme = (id, themeData) => {
    const updated = themes.map(t => t.id === id ? { ...t, name: themeData.name.trim(), color: themeData.color !== undefined ? themeData.color : t.color, projectIds: themeData.projectIds || [] } : t)
    setThemes(updated)
    saveThemes(updated)
  }

  const deleteTheme = (id) => {
    const updated = themes.filter(t => t.id !== id)
    setThemes(updated)
    saveThemes(updated)
  }

  // ============================================
  // STICKY NOTES HANDLERS
  // ============================================

  const addStickyNote = useCallback((x, y) => {
    const newNote = {
      id: generateId(),
      title: '',
      body: '',
      x,
      y,
      createdAt: new Date().toISOString()
    }
    setStickyNotes(prev => {
      const updated = [...prev, newNote]
      saveStickyNotes(updated)
      return updated
    })
    setEditingNoteId(newNote.id)
    setTopNoteId(newNote.id)
    return newNote
  }, [])

  const updateStickyNote = (id, changes, skipSave) => {
    const updated = stickyNotes.map(n => n.id === id ? { ...n, ...changes } : n)
    setStickyNotes(updated)
    if (!skipSave) saveStickyNotes(updated)
  }

  const deleteStickyNote = (id) => {
    const updated = stickyNotes.filter(n => n.id !== id)
    setStickyNotes(updated)
    saveStickyNotes(updated)
    if (editingNoteId === id) setEditingNoteId(null)
    setDeletingNoteId(null)
  }

  // ============================================
  // HABIT TRACKER HANDLERS
  // ============================================

  const addHabit = (habitData) => {
    const newHabit = {
      id: generateId(),
      name: habitData.name.trim(),
      description: (habitData.description || '').trim(),
      created_at: new Date().toISOString(),
      entries: {}
    }
    const updated = { habits: [...habitTracker.habits, newHabit] }
    setHabitTracker(updated)
    saveHabitTracker(updated)
  }

  const updateHabit = (id, habitData) => {
    const updated = {
      habits: habitTracker.habits.map(h =>
        h.id === id ? { ...h, name: habitData.name.trim(), description: (habitData.description || '').trim() } : h
      )
    }
    setHabitTracker(updated)
    saveHabitTracker(updated)
  }

  const deleteHabit = (id) => {
    const updated = { habits: habitTracker.habits.filter(h => h.id !== id) }
    setHabitTracker(updated)
    saveHabitTracker(updated)
  }

  const toggleHabitEntry = (habitId, dateStr) => {
    const cycle = [null, 'orange', 'green', 'red']
    const updated = {
      habits: habitTracker.habits.map(h => {
        if (h.id !== habitId) return h
        const current = h.entries[dateStr] || null
        const nextIndex = (cycle.indexOf(current) + 1) % cycle.length
        const next = cycle[nextIndex]
        const newEntries = { ...h.entries }
        if (next === null) {
          delete newEntries[dateStr]
        } else {
          newEntries[dateStr] = next
        }
        return { ...h, entries: newEntries }
      })
    }
    setHabitTracker(updated)
    saveHabitTracker(updated)
  }

  const openEditHabit = (habit) => {
    setEditingHabit(habit)
    setHabitModalOpen(true)
  }

  const closeHabitModal = () => {
    setHabitModalOpen(false)
    setEditingHabit(null)
  }

  // ============================================
  // PROJECT BOARD HANDLERS
  // ============================================

  const addProject = (name) => {
    const newProject = {
      id: generateId(),
      name: name.trim(),
      created_at: new Date().toISOString(),
      tasks: []
    }
    const updated = { projects: [...projectBoard.projects, newProject] }
    setProjectBoard(updated)
    saveProjectBoard(updated)
    const regEntry = { id: newProject.id, name: newProject.name }
    const updatedReg = [...projectRegistry, regEntry]
    setProjectRegistry(updatedReg)
    saveProjectRegistry(updatedReg)
  }

  const deleteProject = (projectId) => {
    const updated = { projects: projectBoard.projects.filter(p => p.id !== projectId) }
    setProjectBoard(updated)
    saveProjectBoard(updated)
    const hasKanbanRefs = kanbanTasks?.tasks.some(t => t.project === projectId)
    if (!hasKanbanRefs) {
      const updatedReg = projectRegistry.filter(p => p.id !== projectId)
      setProjectRegistry(updatedReg)
      saveProjectRegistry(updatedReg)
    }
    // Strip deleted project from all themes
    const updatedThemes = themes.map(t =>
      t.projectIds.includes(projectId) ? { ...t, projectIds: t.projectIds.filter(id => id !== projectId) } : t
    )
    if (updatedThemes.some((t, i) => t !== themes[i])) {
      setThemes(updatedThemes)
      saveThemes(updatedThemes)
    }
  }

  const addProjectTask = (projectId, taskData) => {
    const newTask = {
      id: generateId(),
      title: taskData.title,
      category: taskData.category || 'Task',
      project: taskData.project || projectId,
      priority: taskData.priority || 'normal',
      time_logged_minutes: taskData.time_logged_minutes || 0,
      created_at: new Date().toISOString(),
      completed_at: null
    }
    const updated = {
      projects: projectBoard.projects.map(p =>
        p.id === projectId ? { ...p, tasks: [...p.tasks, newTask] } : p
      )
    }
    setProjectBoard(updated)
    saveProjectBoard(updated)
  }

  const updateProjectTask = (projectId, taskId, taskData) => {
    const updated = {
      projects: projectBoard.projects.map(p =>
        p.id === projectId
          ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, ...taskData, project: taskData.project || projectId } : t) }
          : p
      )
    }
    setProjectBoard(updated)
    saveProjectBoard(updated)
  }

  const deleteProjectTask = (projectId, taskId) => {
    const updated = {
      projects: projectBoard.projects.map(p =>
        p.id === projectId ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) } : p
      )
    }
    setProjectBoard(updated)
    saveProjectBoard(updated)
  }

  const removeTaskFromProject = (taskId) => {
    const updated = {
      projects: projectBoard.projects.map(p => ({
        ...p,
        tasks: p.tasks.filter(t => t.id !== taskId)
      }))
    }
    setProjectBoard(updated)
    saveProjectBoard(updated)
  }

  const openEditProjectTask = (projectId, task) => {
    setEditingProjectTask({ ...task, _projectId: projectId })
    setProjectTaskModalProjectId(projectId)
    setProjectTaskModalOpen(true)
  }

  const closeProjectTaskModal = () => {
    setProjectTaskModalOpen(false)
    setEditingProjectTask(null)
    setProjectTaskModalProjectId(null)
  }

  // ============================================
  // WHITEBOARD HANDLERS
  // ============================================

  const updateWhiteboards = useCallback((updater) => {
    setWhiteboardsData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveWhiteboards(next)
      return next
    })
  }, [])

  const getActiveWhiteboard = () => {
    const { activeWhiteboardId, whiteboards } = whiteboardsData
    return whiteboards.find(wb => wb.id === activeWhiteboardId) || whiteboards[0] || null
  }

  const addWhiteboard = () => {
    const newWb = createBlankWhiteboard()
    newWb.name = `Whiteboard ${whiteboardsData.whiteboards.length + 1}`
    updateWhiteboards(prev => ({
      activeWhiteboardId: newWb.id,
      whiteboards: [...prev.whiteboards, newWb]
    }))
    return newWb
  }

  const deleteWhiteboard = (id) => {
    updateWhiteboards(prev => {
      const remaining = prev.whiteboards.filter(wb => wb.id !== id)
      if (remaining.length === 0) {
        const fresh = createBlankWhiteboard()
        return { activeWhiteboardId: fresh.id, whiteboards: [fresh] }
      }
      const newActiveId = prev.activeWhiteboardId === id ? remaining[0].id : prev.activeWhiteboardId
      return { activeWhiteboardId: newActiveId, whiteboards: remaining }
    })
  }

  const switchWhiteboard = (id) => {
    updateWhiteboards(prev => ({ ...prev, activeWhiteboardId: id }))
  }

  const updateActiveWhiteboardStrokes = (strokesUpdater) => {
    updateWhiteboards(prev => ({
      ...prev,
      whiteboards: prev.whiteboards.map(wb =>
        wb.id === prev.activeWhiteboardId
          ? { ...wb, strokes: typeof strokesUpdater === 'function' ? strokesUpdater(wb.strokes) : strokesUpdater }
          : wb
      )
    }))
  }

  const reorderWhiteboards = (fromIndex, toIndex) => {
    updateWhiteboards(prev => {
      const reordered = [...prev.whiteboards]
      const [moved] = reordered.splice(fromIndex, 1)
      reordered.splice(toIndex, 0, moved)
      return { ...prev, whiteboards: reordered }
    })
  }

  // ============================================
  // MEETINGS HANDLERS
  // ============================================

  const addMeeting = (meetingData) => {
    const newMeeting = {
      id: generateId(),
      ...meetingData
    }
    const updated = {
      ...meetings,
      items: [...meetings.items, newMeeting].sort((a, b) => a.time.localeCompare(b.time))
    }
    setMeetings(updated)
    saveMeetings(updated)
  }

  const updateMeeting = (id, meetingData) => {
    const updated = {
      ...meetings,
      items: meetings.items.map(m =>
        m.id === id ? { ...m, ...meetingData } : m
      ).sort((a, b) => a.time.localeCompare(b.time))
    }
    setMeetings(updated)
    saveMeetings(updated)
  }

  const deleteMeeting = (id) => {
    const updated = {
      ...meetings,
      items: meetings.items.filter(m => m.id !== id)
    }
    setMeetings(updated)
    saveMeetings(updated)
  }

  const openAddMeeting = () => {
    setEditingMeeting(null)
    setMeetingModalOpen(true)
  }

  const openEditMeeting = (meeting) => {
    setEditingMeeting(meeting)
    setMeetingModalOpen(true)
  }

  const closeMeetingModal = () => {
    setMeetingModalOpen(false)
    setEditingMeeting(null)
  }

  // ============================================
  // ENERGY LEVEL HANDLERS
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours())
  const todayEnergy = energyLevels[getTodayString()] || {}

  useEffect(() => {
    const checkHour = () => {
      const h = new Date().getHours()
      setCurrentHour(prev => {
        if (prev !== h) return h
        return prev
      })
    }
    const id = setInterval(checkHour, 60_000)
    return () => clearInterval(id)
  }, [])

  const setEnergyLevel = (level) => {
    const today = getTodayString()
    const hour = String(new Date().getHours())
    setEnergyLevels(prev => {
      const updated = { ...prev, [today]: { ...prev[today], [hour]: level } }
      const pruned = pruneEnergyData(updated)
      localStorage.setItem(STORAGE_KEYS.ENERGY_LEVELS, JSON.stringify(pruned))
      return pruned
    })
  }

  const refreshEnergyAverages = useCallback(() => {
    const averages = computeEnergyAverages(energyLevels)
    setEnergyAverages(averages)
    localStorage.setItem(STORAGE_KEYS.ENERGY_AVERAGES, JSON.stringify({ date: getTodayString(), averages }))
  }, [energyLevels])

  // Compute averages on first render if not cached for today
  useEffect(() => {
    if (!energyAverages && Object.keys(energyLevels).length > 0) {
      refreshEnergyAverages()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const energyWindowHours = useMemo(() => {
    const hours = []
    const start = currentHour - 3
    for (let i = 0; i < 8; i++) {
      hours.push(start + i)
    }
    return hours
  }, [currentHour])

  // CONTEXT SWITCH HANDLERS
  const incrementInterrupted = () => {
    setContextSwitchData(prev => {
      const today = getTodayString()
      const base = prev.date === today ? prev : { date: today, interrupted: 0, switched: 0, auto: prev.auto }
      const updated = { ...base, interrupted: base.interrupted + 1 }
      localStorage.setItem(STORAGE_KEYS.CONTEXT_SWITCHES, JSON.stringify(updated))
      return updated
    })
  }

  const incrementSwitched = () => {
    setContextSwitchData(prev => {
      const today = getTodayString()
      const base = prev.date === today ? prev : { date: today, interrupted: 0, switched: 0, auto: prev.auto }
      const updated = { ...base, switched: base.switched + 1 }
      localStorage.setItem(STORAGE_KEYS.CONTEXT_SWITCHES, JSON.stringify(updated))
      return updated
    })
  }

  // POMODORO HANDLERS
  // ============================================

  const selectPreset = (index) => {
    setActivePresetIndex(index)
    setTimerState(prev => ({
      ...prev,
      timeRemaining: presets[index].work * 60,
      totalTime: presets[index].work * 60,
      isRunning: false,
      isBreak: false,
      elapsedWhileRunning: 0,
      endTime: null
    }))
  }

  const lastSoundPlayedRef = useRef(0)
  const ensureAudioContext = useCallback(() => {
    const existingCtx = audioCtxRef.current
    if (existingCtx && existingCtx.state !== 'closed') {
      if (existingCtx.state === 'suspended') {
        existingCtx.resume().catch(e => console.error('AudioContext resume failed:', e))
      }
      return existingCtx
    }

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextCtor) return null

    const ctx = new AudioContextCtor()
    audioCtxRef.current = ctx

    const sourceEl = bellAudioRef.current?.querySelector('source')
    const audioSrc = sourceEl?.src || `${import.meta.env.BASE_URL}audio/notification-bell.mp3`

    fetch(audioSrc)
      .then(r => r.arrayBuffer())
      .then(buf => ctx.decodeAudioData(buf))
      .then(decoded => { bellBufferRef.current = decoded })
      .catch(e => console.error('Failed to load bell audio:', e))

    return ctx
  }, [])
  const playNotification = useCallback((force = false) => {
    if (!bellEnabledRef.current) return
    // Prevent duplicate sounds within 3 seconds (e.g. from heartbeat + visibilitychange)
    const now = Date.now()
    if (!force && now - lastSoundPlayedRef.current < 3000) return
    lastSoundPlayedRef.current = now
    try {
      const ctx = audioCtxRef.current
      const buffer = bellBufferRef.current
      if (ctx && buffer && ctx.state !== 'closed') {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(e => console.error('AudioContext resume failed:', e))
        }
        const source = ctx.createBufferSource()
        const gain = ctx.createGain()
        source.buffer = buffer
        source.connect(gain)
        gain.connect(ctx.destination)
        gain.gain.value = settings?.notificationVolume ?? 0.5
        source.start(0)
        return
      }

      const audio = bellAudioRef.current
      if (audio) {
        audio.volume = settings?.notificationVolume ?? 0.5
        audio.currentTime = 0
        audio.play().catch(e => console.log('Autoplay blocked:', e))
      }
    } catch (e) {
      console.error('Audio notification failed:', e)
    }
  }, [settings?.notificationVolume])
  playNotificationRef.current = playNotification

  const [focusTooltip, setFocusTooltip] = useState({ text: '', type: '', visible: false, x: 0, y: 0 })
  const focusTooltipTimer = useRef(null)

  const showFocusTooltip = (e) => {
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const text = btn.getAttribute('data-tooltip')
    const type = btn.classList.contains('on') ? 'on' : 'off'
    const x = rect.left + rect.width / 2
    const y = rect.top - 8
    setFocusTooltip({ text, type, visible: false, x, y })
    focusTooltipTimer.current = setTimeout(() => {
      const el = document.querySelector('.focus-tooltip')
      const tipWidth = el ? el.offsetWidth : 0
      const clampedX = Math.min(x, window.innerWidth - tipWidth / 2 - 10)
      setFocusTooltip({ text, type, visible: true, x: clampedX, y })
    }, 200)
  }

  const hideFocusTooltip = () => {
    clearTimeout(focusTooltipTimer.current)
    setFocusTooltip(prev => ({ ...prev, visible: false }))
  }

  const toggleFocusItem = (key) => {
    setFocusChecklist(prev => {
      const updated = { ...prev, [key]: !prev[key] }
      saveFocusChecklist(updated)
      return updated
    })
  }

  const [focusDragIndex, setFocusDragIndex] = useState(null)
  const [focusDragOverIndex, setFocusDragOverIndex] = useState(null)

  const handleFocusDragStart = (e, index) => {
    setFocusDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', `focus-${index}`)
  }

  const handleFocusDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setFocusDragOverIndex(index)
  }

  const handleFocusDrop = (e, toIndex) => {
    e.preventDefault()
    if (focusDragIndex !== null && focusDragIndex !== toIndex) {
      setFocusOrder(prev => {
        const updated = [...prev]
        const [moved] = updated.splice(focusDragIndex, 1)
        updated.splice(toIndex, 0, moved)
        localStorage.setItem(STORAGE_KEYS.FOCUS_ORDER, JSON.stringify(updated))
        return updated
      })
    }
    setFocusDragIndex(null)
    setFocusDragOverIndex(null)
  }

  const handleFocusDragEnd = () => {
    setFocusDragIndex(null)
    setFocusDragOverIndex(null)
  }

  const toggleTimer = useCallback(() => {
    if (timerState.isBreak) {
      // Skip break
      setTimerState(prev => ({
        ...prev,
        isRunning: false,
        isBreak: false,
        timeRemaining: presets[activePresetIndex].work * 60,
        totalTime: presets[activePresetIndex].work * 60,
        elapsedWhileRunning: 0,
        endTime: null
      }))
      return
    }

    if (!timerState.activeTaskId) {
      showAlert('No Task Selected', 'Drag a task to the timer first!')
      return
    }

    if (timerState.isRunning) {
      // Stop timer
      setTimerState(prev => {
        const remaining = prev.endTime
          ? Math.max(0, Math.ceil((prev.endTime - Date.now()) / 1000))
          : prev.timeRemaining
        return {
          ...prev,
          isRunning: false,
          timeRemaining: remaining,
          elapsedWhileRunning: prev.totalTime - remaining,
          endTime: null
        }
      })
    } else {
      // Start timer
      ensureAudioContext()
      setTimerState(prev => ({ ...prev, isRunning: true, endTime: Date.now() + prev.timeRemaining * 1000 }))
    }
  }, [timerState.isBreak, timerState.activeTaskId, timerState.isRunning, activePresetIndex, presets, ensureAudioContext])

  const resetTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      isBreak: false,
      timeRemaining: presets[activePresetIndex].work * 60,
      totalTime: presets[activePresetIndex].work * 60,
      elapsedWhileRunning: 0,
      endTime: null
    }))
  }

  const setActiveTask = (taskId) => {
    setTimerState(prev => ({
      ...prev,
      activeTaskId: taskId,
      isRunning: false,
      isBreak: false,
      timeRemaining: presets[activePresetIndex].work * 60,
      totalTime: presets[activePresetIndex].work * 60,
      elapsedWhileRunning: 0,
      endTime: null
    }))
  }

  const clearActiveTask = () => {
    setTimerState(prev => ({
      ...prev,
      activeTaskId: null,
      isRunning: false,
      isBreak: false,
      timeRemaining: presets[activePresetIndex].work * 60,
      totalTime: presets[activePresetIndex].work * 60,
      elapsedWhileRunning: 0,
      endTime: null
    }))
  }

  // Track whether sound needs to play — use a ref (not a closure variable)
  // because React StrictMode double-invokes state updaters and reverts closure mutations
  const pomodoroExpiredRef = useRef(false)
  const breakExpiredRef = useRef(false)

  heartbeatRef.current = () => {
    const now = Date.now()

    setTimerState(prev => {
      if (!prev.isRunning || !prev.endTime) return prev

      const remaining = Math.max(0, Math.ceil((prev.endTime - now) / 1000))
      if (remaining <= 0) {
        pomodoroExpiredRef.current = true
        if (prev.isBreak) {
          const workTime = presets[activePresetIndex].work * 60
          return {
            ...prev,
            isRunning: false,
            isBreak: false,
            timeRemaining: workTime,
            totalTime: workTime,
            elapsedWhileRunning: 0,
            endTime: null
          }
        }

        const breakDuration = presets[activePresetIndex].break * 60
        return {
          ...prev,
          isBreak: true,
          timeRemaining: breakDuration,
          totalTime: breakDuration,
          elapsedWhileRunning: 0,
          endTime: now + breakDuration * 1000
        }
      }

      if (!prev.isBreak && prev.activeTaskId) {
        const prevMinutes = Math.floor((prev.totalTime - prev.timeRemaining) / 60)
        const nextMinutes = Math.floor((prev.totalTime - remaining) / 60)
        if (nextMinutes > prevMinutes) {
          setTimeout(() => incrementTaskTime(prev.activeTaskId, nextMinutes - prevMinutes), 0)
        }
      }

      return { ...prev, timeRemaining: remaining, elapsedWhileRunning: prev.totalTime - remaining }
    })

    if (pomodoroExpiredRef.current) {
      pomodoroExpiredRef.current = false
      playNotificationRef.current?.()
    }

    if (breakEndTimeRef.current) {
      const remaining = Math.max(0, Math.ceil((breakEndTimeRef.current - now) / 1000))
      setBreakTimeRemaining(remaining)
      if (remaining <= 0) {
        breakEndTimeRef.current = null
        breakExpiredRef.current = true
        setBreakTimerRunning(false)
      }
    }

    if (breakExpiredRef.current) {
      breakExpiredRef.current = false
      playNotificationRef.current?.()
    }
  }

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) return
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume().catch(e => console.error('AudioContext resume failed:', e))
      }
      heartbeatRef.current?.()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  const setBreakDuration = useCallback((seconds) => {
    const nextSeconds = Math.max(0, Math.min(seconds, 90 * 60))
    if (breakTimerRunning) {
      breakEndTimeRef.current = nextSeconds > 0 ? Date.now() + nextSeconds * 1000 : null
      if (nextSeconds === 0) {
        setBreakTimerRunning(false)
      }
    }
    setBreakTimeRemaining(nextSeconds)
  }, [breakTimerRunning])

  // ============================================
  // DRAG AND DROP
  // ============================================

  // Track whether drawer was open before drag started
  const drawerOpenBeforeDrag = useRef(false)

  const handleDragStart = (e, taskId, source = 'kanban', sourceProjectId = null) => {
    console.log('[DnD] dragstart:', { taskId, source, sourceProjectId })
    setDraggedTaskId(taskId)
    setDragSource(source)
    setDragSourceProjectId(sourceProjectId)
    drawerOpenBeforeDrag.current = secondDrawerOpen
    e.dataTransfer.effectAllowed = 'copyMove'
    let task = kanbanTasks?.tasks.find(t => t.id === taskId)
    if (!task) {
      for (const project of (projectBoard?.projects || [])) {
        task = project.tasks?.find(t => t.id === taskId)
        if (task) break
      }
    }
    if (task) {
      e.dataTransfer.setData('application/x-task-title', task.title)
    }
    // When dragging from project board, capture drag image and collapse on leave
    if (source === 'project') {
      const card = e.target.closest('.kanban-task')
      if (card) {
        const rect = card.getBoundingClientRect()
        e.dataTransfer.setDragImage(card, e.clientX - rect.left, e.clientY - rect.top)
      }
      const drawer = e.target.closest('.second-drawer')
      if (drawer) {
        const onLeave = (ev) => {
          if (!drawer.contains(ev.relatedTarget)) {
            setSecondDrawerOpen(false)
            drawer.removeEventListener('dragleave', onLeave)
          }
        }
        drawer.addEventListener('dragleave', onLeave)
      }
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const clearDragState = () => {
    console.log('[DnD] clearing drag state')
    if (drawerOpenBeforeDrag.current) setSecondDrawerOpen(true)
    setDraggedTaskId(null)
    setDragSource(null)
    setDragSourceProjectId(null)
  }

  const handleDropOnColumn = (e, column) => {
    e.preventDefault()
    console.log('[DnD] dropOnColumn:', { column, draggedTaskId, dragSource })
    if (draggedTaskId) {
      if (dragSource === 'project') {
        // Find the task in the project board
        let task = null
        let sourceProject = null
        for (const project of projectBoard.projects) {
          task = project.tasks.find(t => t.id === draggedTaskId)
          if (task) { sourceProject = project; break }
        }
        if (task) {
          addKanbanTask({ ...task, column, project: task.project || sourceProject?.id || '' })
          removeTaskFromProject(draggedTaskId)
        }
      } else {
        moveKanbanTask(draggedTaskId, column)
      }
      clearDragState()
    }
  }

  const handleDropOnTimer = (e) => {
    e.preventDefault()
    if (draggedTaskId) {
      if (dragSource === 'project') {
        let task = null
        let sourceProject = null
        for (const project of projectBoard.projects) {
          task = project.tasks.find(t => t.id === draggedTaskId)
          if (task) { sourceProject = project; break }
        }
        if (task) {
          addKanbanTask({ ...task, column: 'progress', project: task.project || sourceProject?.id || '' })
          removeTaskFromProject(draggedTaskId)
          setActiveTask(draggedTaskId)
        }
      } else {
        setActiveTask(draggedTaskId)
      }
      clearDragState()
    }
  }

  const handleDropOnProject = (e, targetProjectId) => {
    e.preventDefault()
    console.log('[DnD] dropOnProject:', { targetProjectId, draggedTaskId, dragSource, dragSourceProjectId })
    if (!draggedTaskId) return

    const targetProject = projectBoard.projects.find(p => p.id === targetProjectId)

    if (dragSource === 'kanban') {
      // Move from Kanban to project
      const task = kanbanTasks.tasks.find(t => t.id === draggedTaskId)
      if (task) {
        const { column: _column, ...projectTask } = task
        addProjectTask(targetProjectId, { ...projectTask, project: projectTask.project || targetProject?.id || '' })
        deleteKanbanTask(draggedTaskId)
      }
    } else if (dragSource === 'project' && dragSourceProjectId !== targetProjectId) {
      // Move between projects
      let task = null
      for (const project of projectBoard.projects) {
        task = project.tasks.find(t => t.id === draggedTaskId)
        if (task) break
      }
      if (task) {
        const updated = {
          projects: projectBoard.projects.map(p => {
            if (p.id === dragSourceProjectId) {
              return { ...p, tasks: p.tasks.filter(t => t.id !== draggedTaskId) }
            }
            if (p.id === targetProjectId) {
              return { ...p, tasks: [...p.tasks, { ...task, project: task.project || targetProject?.id || '' }] }
            }
            return p
          })
        }
        setProjectBoard(updated)
        saveProjectBoard(updated)
      }
    }
    clearDragState()
  }

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const today = getToday()

  const visibleBlocks = (dailyState?.blocks.filter(block => {
    if (block.completed) return false
    if (!dailyState.focus_mode) return true
    return block.repeat_days.includes(today)
  }) || []).sort((a, b) => a.start_time.localeCompare(b.start_time))

  const completedBlocks = (dailyState?.blocks.filter(b => b.completed) || [])
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  const totalBlocksToday = dailyState?.blocks.filter(b => {
    if (!dailyState.focus_mode) return true
    return b.repeat_days.includes(today)
  }).length || 0

  const completedCount = completedBlocks.length

  const activeTask = kanbanTasks?.tasks.find(t => t.id === timerState.activeTaskId)

  const getTasksByColumn = (column) => {
    const tasks = kanbanTasks?.tasks.filter(t => t.column === column) || []
    if (column === 'done') {
      // Sort by completion date (newest first)
      return tasks.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
    }
    // Sort by priority (high > normal > low), then by creation date (newest first)
    const priorityOrder = { high: 0, normal: 1, low: 2 }
    return tasks.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }

  // ============================================
  // RENDER
  // ============================================

  if (loading || !dailyState || !kanbanTasks) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#eae6dd',
        color: '#1a1a1a',
        fontFamily: 'Georgia, serif'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #d4d0c8',
          borderTopColor: '#1a1a1a',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{ marginTop: '1rem' }}>Loading TouchTask...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const dateString = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).toUpperCase()

  return (
    <>
      {/* Hidden file input for load */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Top Bar */}
      <header className="topbar">
        <div
          className="brand brand-clickable"
          onClick={() => setAboutModalOpen(true)}
          title="About TouchTask"
        >Touch<span>Task</span></div>
        <div
          className="topbar-clock"
          onClick={() => {
            const updated = { ...settings, use24HourFormat: !settings.use24HourFormat }
            setSettings(updated)
            saveSettings(updated)
          }}
          style={{ cursor: 'pointer' }}
          title="Click to toggle time format"
        >
          {settings.use24HourFormat
            ? currentTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
            : currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          }
        </div>
        <div className="topbar-right">
          <a
            href="https://github.com/florianbuetow/touchtask"
            target="_blank"
            rel="noopener noreferrer"
            className="topbar-github"
            title="View on GitHub"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
          </a>
          <div className="topbar-date">{dateString}</div>
          <div className="topbar-menu">
            <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
              <Menu size={20} />
            </button>
            {menuOpen && (
              <>
                <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
                <div className="menu-dropdown">
                  <button className="menu-item" onClick={() => { setAboutModalOpen(true); setMenuOpen(false); }}>About</button>
                  <button className="menu-item" onClick={handleLoadClick}>Load</button>
                  <button className="menu-item" onClick={handleSaveData}>Save</button>
                  <button className="menu-item" onClick={handleDemoClick}>Demo</button>
                  <button className="menu-item menu-item-danger" onClick={handleResetClick}>Reset</button>
                  <button className="menu-item" onClick={() => { setSettingsModalOpen(true); setMenuOpen(false); }}>Settings</button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="main-layout">
        {/* Left Column - Habits */}
        <section className="habits-section" ref={habitsSectionRef}>
          <header className="section-header">
            <h2 className="section-title">Today's <span>Habits</span></h2>
            <div className="section-meta">
              <span className="habits-stats">{completedCount} of {totalBlocksToday} complete</span>
              <div className="section-meta-buttons">
                <button
                  className={`focus-toggle ${!showMeetings ? 'disabled' : ''}`}
                  onClick={() => setShowMeetings(!showMeetings)}
                  title={showMeetings ? 'Hide schedule' : 'Show schedule'}
                >
                  <CalendarCheck size={14} />
                </button>
                <button
                  className={`focus-toggle ${!showTimeBlocks ? 'disabled' : ''}`}
                  onClick={() => setShowTimeBlocks(!showTimeBlocks)}
                  title={showTimeBlocks ? 'Hide time blocks' : 'Show time blocks'}
                >
                  <LayoutList size={14} />
                </button>
                <button
                  className={`focus-toggle ${dailyState.focus_mode ? 'active' : ''}`}
                  onClick={toggleFocusMode}
                  title={dailyState.focus_mode ? 'Showing today\'s blocks only' : 'Showing all blocks'}
                >
                  {dailyState.focus_mode ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  className="focus-toggle"
                  onClick={handleRecycleDayClick}
                  title="Reset day progress"
                >
                  <Recycle size={14} />
                </button>
              </div>
            </div>
          </header>

          {/* Meetings/Terminplaner Section */}
          <div className={!showMeetings ? 'hidden' : ''}>
            <MeetingsSection
              meetings={meetings}
              onAdd={openAddMeeting}
              onEdit={openEditMeeting}
              onClear={() => setScheduleClearConfirmOpen(true)}
            />
          </div>

          {/* Completed Habits Pills */}
          <div className={`completed-habits ${!showTimeBlocks ? 'hidden' : ''}`}>
            {completedBlocks.map(block => (
              <div
                key={block.id}
                className={`completed-habit-pill ${block.skipped ? 'skipped' : ''}`}
                onClick={() => restoreBlock(block.id)}
              >
                <span>{block.skipped ? '⏭' : '✓'}</span> {block.title}
              </div>
            ))}
          </div>

          {/* Daily Schedule */}
          <div className={`daily-schedule ${!showTimeBlocks ? 'hidden' : ''}`}>
            {visibleBlocks.map(block => (
              <TimeBlock
                key={block.id}
                block={block}
                currentTime={currentTime}
                onToggleMinimized={() => toggleBlockMinimized(block.id)}
                onCycleSubtask={(subtaskId) => cycleSubtaskState(block.id, subtaskId)}
                onComplete={() => completeBlock(block.id)}
                onSkip={() => completeBlock(block.id, true)}
                onToggleRepeatDay={(dayIndex) => toggleRepeatDay(block.id, dayIndex)}
                onEdit={() => openEditBlock(block)}
              />
            ))}

            <div className="add-block" onClick={() => setBlockModalOpen(true)}>
              + Add new time block
            </div>
          </div>
        </section>

        {/* Middle Column - Kanban */}
        <aside className="kanban-section">
          <header className="section-header">
            <h2 className="section-title">Task <span>Tracking</span></h2>
            <div className="section-meta">
              <span className="habits-stats">{(kanbanTasks?.tasks.filter(t => t.column === 'done').length || 0)} of {(kanbanTasks?.tasks.filter(t => t.column !== 'backlog').length || 0) + reminders.length} complete</span>
              <div className="section-meta-buttons">
                <button
                  className={`focus-toggle ${!showReminders ? 'disabled' : ''}`}
                  onClick={() => setShowReminders(!showReminders)}
                  title={showReminders ? "Hide don't forget" : "Show don't forget"}
                >
                  <List size={14} />
                </button>
                <button
                  className={`focus-toggle ${!showThemes ? 'disabled' : ''}`}
                  onClick={() => setShowThemes(!showThemes)}
                  title={showThemes ? 'Hide themes' : 'Show themes'}
                >
                  <SwatchBook size={14} />
                </button>
                <button
                  className={`focus-toggle ${!showKanban ? 'disabled' : ''}`}
                  onClick={() => setShowKanban(!showKanban)}
                  title={showKanban ? 'Hide kanban board' : 'Show kanban board'}
                >
                  <Columns4 size={14} />
                </button>
              </div>
            </div>
          </header>

          {/* Don't Forget Section */}
          <div className={!showReminders ? 'hidden' : ''}>
            <RemindersSection
              reminders={reminders}
              addReminder={addReminder}
              addReminders={(texts) => {
                const newItems = texts.map(t => ({ id: generateId(), text: t.trim() }))
                const updated = sortByUrgency([...reminders, ...newItems])
                setReminders(updated)
                saveReminders(updated)
              }}
              deleteReminder={deleteReminder}
              cycleUrgency={cycleReminderUrgency}
              onClear={() => setShortlistClearConfirmOpen(true)}
              reorderReminders={(fromIndex, toIndex) => {
                const updated = [...reminders]
                const [moved] = updated.splice(fromIndex, 1)
                updated.splice(toIndex, 0, moved)
                const sorted = sortByUrgency(updated)
                setReminders(sorted)
                saveReminders(sorted)
              }}
            />
          </div>

          {/* Themes Section */}
          <div className={!showThemes ? 'hidden' : ''}>
            <ThemesSection
              themes={themes}
              projectRegistry={projectRegistry}
              onAdd={() => { setEditingTheme(null); setThemeModalOpen(true) }}
              onEdit={(theme) => { setEditingTheme(theme); setThemeModalOpen(true) }}
              onClear={() => setThemesClearConfirmOpen(true)}
            />
          </div>

          {/* Kanban Board */}
          <div className={`kanban-card ${!showKanban ? 'hidden' : ''}`}>
            <div className="kanban-board">
              {['backlog', 'week', 'progress', 'done'].map(column => (
                <KanbanColumn
                  key={column}
                  column={column}
                  tasks={getTasksByColumn(column)}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDropOnColumn}
                  onAddClick={() => {
                    setEditingTask(null)
                    setTaskModalColumn(column)
                    setTaskModalOpen(true)
                  }}
                  onEditTask={openEditTask}
                  onClearClick={column === 'done' ? () => setClearConfirmOpen(true) : null}
                />
              ))}
            </div>
          </div>

        </aside>

        {/* Right Column - Cognitive Load */}
        <section className="cognitive-load-section">
          <header className="section-header">
            <h2 className="section-title">Cognitive <span>Load</span></h2>
            <div className="section-meta">
              <span className="section-subtitle">Mental bandwidth</span>
              <div className="section-meta-buttons">
                <button
                  className={`focus-toggle ${!showCurrentFocus ? 'disabled' : ''}`}
                  onClick={() => setShowCurrentFocus(!showCurrentFocus)}
                  title={showCurrentFocus ? 'Hide current focus' : 'Show current focus'}
                >
                  <Crosshair size={14} />
                </button>
                <button
                  className={`focus-toggle ${!showFocusChecklist ? 'disabled' : ''}`}
                  onClick={() => setShowFocusChecklist(!showFocusChecklist)}
                  title={showFocusChecklist ? 'Hide protect your focus' : 'Show protect your focus'}
                >
                  <ShieldCheck size={14} />
                </button>
                <button
                  className={`focus-toggle ${!showMentalBandwidth ? 'disabled' : ''}`}
                  onClick={() => setShowMentalBandwidth(!showMentalBandwidth)}
                  title={showMentalBandwidth ? 'Hide mental bandwidth' : 'Show mental bandwidth'}
                >
                  <Brain size={14} />
                </button>
                <button
                  className={`focus-toggle ${!showPomodoro ? 'disabled' : ''}`}
                  onClick={() => setShowPomodoro(!showPomodoro)}
                  title={showPomodoro ? 'Hide pomodoro timer' : 'Show pomodoro timer'}
                >
                  <Timer size={14} />
                </button>
                <button
                  className={`focus-toggle ${!showBreakActivities ? 'disabled' : ''}`}
                  onClick={() => setShowBreakActivities(!showBreakActivities)}
                  title={showBreakActivities ? 'Hide break activities' : 'Show break activities'}
                >
                  <Coffee size={14} />
                </button>
                <button
                  className={`focus-toggle ${!showBrainDump ? 'disabled' : ''}`}
                  onClick={() => setShowBrainDump(!showBrainDump)}
                  title={showBrainDump ? 'Hide brain dump' : 'Show brain dump'}
                >
                  <NotebookPen size={14} />
                </button>
              </div>
            </div>
          </header>

          {/* Current Focus */}
          <div className={`current-focus-section ${!showCurrentFocus ? 'hidden' : ''}`}>
            <div className="current-focus-header">
              <span className="current-focus-label">Current focus</span>
              <button
                className="context-switch-clear"
                onClick={() => setContextSwitchClearConfirmOpen(true)}
                title="Reset counters"
                disabled={!(contextSwitchData.date === getTodayString() && (contextSwitchData.interrupted > 0 || contextSwitchData.switched > 0))}
              ><Trash2 size={14} /></button>
            </div>
            <div className="current-focus-content">
              <input
                type="text"
                className={`current-focus-input ${currentFocus ? 'has-text' : ''}`}
                placeholder="NO FOCUS"
                value={currentFocus}
                onChange={(e) => {
                  setCurrentFocus(e.target.value)
                  localStorage.setItem(STORAGE_KEYS.CURRENT_FOCUS, e.target.value)
                }}
                onDragOver={(e) => {
                  if (e.dataTransfer.types.includes('application/x-reminder') || e.dataTransfer.types.includes('application/x-task-title')) {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'copy'
                  }
                }}
                onDrop={(e) => {
                  const reminderData = e.dataTransfer.getData('application/x-reminder')
                  const taskTitle = e.dataTransfer.getData('application/x-task-title')
                  if (reminderData) {
                    e.preventDefault()
                    const reminder = JSON.parse(reminderData)
                    setCurrentFocus(reminder.text)
                    localStorage.setItem(STORAGE_KEYS.CURRENT_FOCUS, reminder.text)
                  } else if (taskTitle) {
                    e.preventDefault()
                    setCurrentFocus(taskTitle)
                    localStorage.setItem(STORAGE_KEYS.CURRENT_FOCUS, taskTitle)
                  }
                }}
              />
              {currentFocus && (
                <button
                  className="current-focus-clear"
                  onClick={() => {
                    setCurrentFocus('')
                    localStorage.setItem(STORAGE_KEYS.CURRENT_FOCUS, '')
                  }}
                  title="Clear focus"
                >×</button>
              )}
            </div>
            <div className="context-switch-controls">
              <button className="context-switch-btn" onClick={incrementInterrupted}>I was interrupted</button>
              <span className={`context-switch-counter ${(contextSwitchData.date === getTodayString() ? contextSwitchData.interrupted : 0) >= 8 ? 'critical' : (contextSwitchData.date === getTodayString() ? contextSwitchData.interrupted : 0) >= 4 ? 'warning' : 'normal'}`} title="Times interrupted today — 0–3 normal, 4–7 losing 1.5–2.5h to refocusing, 8+ more time recovering than doing deep work">{contextSwitchData.date === getTodayString() ? contextSwitchData.interrupted : 0}x</span>
              <button className="context-switch-btn" onClick={incrementSwitched}>I switched context</button>
              <span className={`context-switch-counter ${(contextSwitchData.date === getTodayString() ? contextSwitchData.switched : 0) >= 10 ? 'critical' : (contextSwitchData.date === getTodayString() ? contextSwitchData.switched : 0) >= 5 ? 'warning' : 'normal'}`} title="Times you switched context today — 0–4 normal, 5–9 fragmented attention, 10+ task-hopping">{contextSwitchData.date === getTodayString() ? contextSwitchData.switched : 0}x</span>
            </div>
          </div>

          {/* Focus Checklist */}
          <div className={`focus-checklist-section ${!showFocusChecklist ? 'hidden' : ''}`}>
            <div className="focus-checklist-header">
              <span className="focus-checklist-label">Protect your focus</span>
              <button
                className="focus-checklist-reset"
                onClick={() => {
                  const defaults = { phoneSilenced: false, alertsMuted: false, wifiOff: false, monitorOff: false, musicOn: false, notificationsOff: false, doorClosed: false, messagesOff: false, browsersClosed: false }
                  setFocusChecklist(defaults)
                  saveFocusChecklist(defaults)
                }}
                title="Reset all protections to default"
                disabled={!Object.values(focusChecklist).some(Boolean)}
              ><Trash2 size={14} /></button>
            </div>
            <div className="focus-checklist-items">
              {focusOrder.map((key, index) => {
                const cfg = FOCUS_ITEMS_CONFIG[key]
                if (!cfg) return null
                const isOn = focusChecklist[key]
                const Icon = isOn ? cfg.onIcon : cfg.offIcon
                return (
                  <button
                    key={key}
                    className={`focus-checklist-btn ${isOn ? 'on' : 'off'}${focusDragIndex === index ? ' dragging' : ''}${focusDragOverIndex === index && focusDragIndex !== index ? ' drag-over' : ''}`}
                    onClick={() => toggleFocusItem(key)}
                    data-tooltip={isOn ? cfg.onTip : cfg.offTip}
                    onMouseEnter={showFocusTooltip} onMouseLeave={hideFocusTooltip}
                    draggable
                    onDragStart={(e) => handleFocusDragStart(e, index)}
                    onDragOver={(e) => handleFocusDragOver(e, index)}
                    onDrop={(e) => handleFocusDrop(e, index)}
                    onDragEnd={handleFocusDragEnd}
                  >
                    <Icon size={28} />
                  </button>
                )
              })}
            </div>
            <div
              className={`focus-tooltip ${focusTooltip.visible ? 'visible' : ''} ${focusTooltip.type}`}
              style={{ top: focusTooltip.y, left: focusTooltip.x, transform: 'translate(-50%, -100%)' }}
            >
              {focusTooltip.text}
            </div>
          </div>

          {/* Energy Level Tracker */}
          <div className={`energy-tracker-section ${!showMentalBandwidth ? 'hidden' : ''}`}>
            <div className="energy-tracker-header">
              <span className="energy-tracker-label">Energy levels</span>
            </div>
            <div className="energy-tracker-content">
              <div className="energy-toggle-group">
                {[['high', 'High'], ['medium', 'Medium'], ['low', 'Low']].map(([level, label]) => (
                  <button
                    key={level}
                    className={`energy-toggle-btn ${level} ${todayEnergy[String(currentHour)] === level ? 'active' : ''}`}
                    onClick={() => setEnergyLevel(level)}
                  >{label}</button>
                ))}
                <button
                  className={`energy-toggle-btn unset ${!todayEnergy[String(currentHour)] ? 'active' : ''}`}
                  onClick={() => {
                    const today = getTodayString()
                    const hour = String(currentHour)
                    setEnergyLevels(prev => {
                      const dayData = { ...prev[today] }
                      delete dayData[hour]
                      const updated = { ...prev, [today]: dayData }
                      localStorage.setItem(STORAGE_KEYS.ENERGY_LEVELS, JSON.stringify(updated))
                      return updated
                    })
                  }}
                >?</button>
              </div>
              <div className="energy-hour-window">
                {energyWindowHours.map(h => {
                  const hourStr = String(h)
                  const todayLevel = todayEnergy[hourStr]
                  const predictedLevel = energyAverages ? energyAverages[hourStr] : null
                  const isCurrent = h === currentHour
                  return (
                    <div key={h} className={`energy-hour-slot ${isCurrent ? 'current' : ''}`}>
                      <div className="energy-hour-label">{h < 0 ? h + 24 : h > 23 ? h - 24 : h}:00</div>
                      <div className="energy-hour-bar">
                        {todayLevel ? (
                          <div className={`energy-bar-fill solid ${todayLevel}`} />
                        ) : predictedLevel ? (
                          <div className={`energy-bar-fill predicted ${predictedLevel}`} />
                        ) : (
                          <div className="energy-bar-fill empty" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Pomodoro Section */}
          <div className={`pomodoro-section ${!showPomodoro ? 'hidden' : ''}`}>
            <div className="pomodoro-header">
              <div className="pomodoro-header-left">
                <span className="pomodoro-label">Pomodoro</span>
                <div className="pomodoro-presets">
                  {presets.map((p, i) => (
                    <button
                      key={i}
                      className={`preset-btn ${i === activePresetIndex ? 'active' : ''}`}
                      onClick={() => selectPreset(i)}
                      onDoubleClick={() => {
                        setEditingPresetIndex(i)
                        setEditingPresetValues({ work: p.work, break: p.break })
                      }}
                      title="Double-click to edit"
                    >
                      {p.work}/{p.break}
                    </button>
                  ))}
                </div>
                <button
                  className={`bell-toggle ${!bellEnabled ? 'muted' : ''}`}
                  onClick={() => setBellEnabled(!bellEnabled)}
                >
                  {bellEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                </button>
              </div>
              <span className={`pomodoro-timer ${timerState.isRunning ? 'running' : ''} ${timerState.isBreak ? 'break-time' : ''}`}>
                {formatTimer(timerState.timeRemaining)}
              </span>
            </div>

            <div className="pomodoro-content">
              <div
                className={`drop-zone ${activeTask ? (timerState.isRunning ? 'has-task running' : 'has-task') : ''} ${timerState.isBreak ? 'break-mode' : ''}`}
                onDragOver={handleDragOver}
                onDrop={handleDropOnTimer}
              >
                <div className="drop-placeholder">
                  <div className="drop-placeholder-icon">⏱</div>
                  <div>Drag a task here to start working</div>
                </div>
                <div className="active-task-display">
                  <div className="active-task-name">{activeTask?.title}</div>
                  <div className="active-task-meta">{activeTask?.category}</div>
                  <div className="active-task-time-logged">
                    {formatTime(activeTask?.time_logged_minutes || 0)} logged
                  </div>
                </div>
                <div className="break-display">
                  <div className="break-title">☕ Break Time</div>
                  <div className="break-subtitle">Take a moment to rest</div>
                </div>
              </div>

              <div className="timer-controls">
                <button
                  className={`timer-btn primary ${timerState.isRunning ? 'running' : ''} ${timerState.isBreak && timerState.isRunning ? 'break-running' : ''}`}
                  onClick={toggleTimer}
                >
                  {timerState.isBreak ? 'Skip' : timerState.isRunning ? 'Stop' : 'Start'}
                </button>
                <button className="timer-btn small" onClick={resetTimer}>Reset</button>
                {activeTask && (
                  <button className="timer-btn small" onClick={clearActiveTask}>Clear</button>
                )}
              </div>
            </div>

            <div className="timer-progress">
              <div
                className={`timer-progress-bar ${timerState.isBreak ? 'break-time' : ''} ${timerState.timeRemaining === timerState.totalTime ? 'no-transition' : ''}`}
                style={{ width: `${((timerState.totalTime - timerState.timeRemaining) / timerState.totalTime) * 100}%` }}
              />
            </div>
          </div>

          {/* Break Activities */}
          <div className={`break-activities-section ${!showBreakActivities ? 'hidden' : ''}`}>
            <div className="break-activities-header">
              <span className="break-activities-label">Break</span>
              <button
                className="break-activities-reset"
                onClick={() => {
                  setHiddenBreakActivities(new Set())
                  localStorage.setItem(STORAGE_KEYS.BREAK_HIDDEN_ACTIVITIES, JSON.stringify([]))
                }}
                title="Restore hidden activities"
                disabled={hiddenBreakActivities.size === 0}
              ><Trash2 size={14} /></button>
            </div>

            <div className="break-content">
              <div className="break-left">
                <div className={`break-timer-display ${breakTimerRunning ? 'running' : ''}`}>
                  <input
                    type="text"
                    className="break-timer-field"
                    value={Math.ceil(breakTimeRemaining / 60)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value.replace(/\D/g, '')) || 0
                      setBreakDuration(Math.min(val, 90) * 60)
                    }}
                    onFocus={(e) => e.target.select()}
                    maxLength={2}
                  />
                  <button
                    className="break-timer-unit"
                    onClick={() => {
                      breakEndTimeRef.current = null
                      setBreakTimerRunning(false)
                      setBreakTimeRemaining(0)
                    }}
                    title="Reset timer"
                  >
                    <span className="break-timer-unit-text">min</span>
                    <span className="break-timer-unit-reset">reset</span>
                  </button>
                </div>
                <span className="break-timer-until">
                  until {new Date(Date.now() + breakTimeRemaining * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
                <div className="break-presets">
                  {[1, 5].map(mins => (
                    <button
                      key={mins}
                      className="break-preset-btn"
                      onClick={() => {
                        setBreakDuration(breakTimeRemaining + mins * 60)
                      }}
                    >+{mins}</button>
                  ))}
                  <button
                    className="break-preset-btn break-snap-btn"
                    onClick={() => {
                      const now = new Date()
                      const endMin = now.getMinutes() + Math.ceil(breakTimeRemaining / 60)
                      const endHour = now.getHours() + Math.floor(endMin / 60)
                      const endMinOfHour = endMin % 60
                      const floored = Math.floor(endMinOfHour / 15) * 15
                      const targetMin = floored === endMinOfHour ? endMinOfHour - 15 : floored
                      const targetTotal = endHour * 60 + targetMin
                      const nowTotal = now.getHours() * 60 + now.getMinutes()
                      setBreakDuration(Math.max(0, targetTotal - nowTotal) * 60)
                    }}
                    title="Round down to previous quarter hour"
                  >
                    <ArrowBigLeftDash size={12} />
                  </button>
                  <button
                    className="break-preset-btn break-snap-btn"
                    onClick={() => {
                      const now = new Date()
                      const endMin = now.getMinutes() + Math.ceil(breakTimeRemaining / 60)
                      const endHour = now.getHours() + Math.floor(endMin / 60)
                      const endMinOfHour = endMin % 60
                      const ceiled = Math.ceil(endMinOfHour / 15) * 15
                      const targetMin = ceiled === endMinOfHour ? endMinOfHour + 15 : ceiled
                      const targetTotal = endHour * 60 + targetMin
                      const nowTotal = now.getHours() * 60 + now.getMinutes()
                      setBreakDuration(Math.min((targetTotal - nowTotal) * 60, 90 * 60))
                    }}
                    title="Round up to next quarter hour"
                  >
                    <ArrowBigRightDash size={12} />
                  </button>
                </div>
              </div>
              <div className="break-activities-grid">
                {breakActivities.map((activity, idx) => {
                  if (!isBreakActivityEnabled(activity.file)) return null
                  if (hiddenBreakActivities.has(activity.file)) return null
                  const tooltip = getBreakTooltip(activity)
                  return (
                    <button
                      key={activity.file}
                      className={`break-activity-btn ${draggedBreakIdx === idx ? 'dragging' : ''}`}
                      data-tooltip={tooltip}
                      draggable
                      onDragStart={(e) => {
                        setDraggedBreakIdx(idx)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        if (draggedBreakIdx === null || draggedBreakIdx === idx) return
                        const updated = [...breakActivities]
                        const [moved] = updated.splice(draggedBreakIdx, 1)
                        updated.splice(idx, 0, moved)
                        setBreakActivities(updated)
                        setDraggedBreakIdx(idx)
                      }}
                      onDragEnd={() => {
                        setDraggedBreakIdx(null)
                        localStorage.setItem(STORAGE_KEYS.BREAK_ACTIVITIES_ORDER, JSON.stringify(breakActivities))
                      }}
                      onClick={() => {
                        if (timerState.isRunning && !timerState.isBreak) {
                          showAlert('Pomodoro Running', 'Stop the current Pomodoro before starting a break.')
                          return
                        }
                        setActiveBreak({ file: activity.file, name: tooltip, totalTime: breakTimeRemaining })
                        if (!breakTimerRunning && breakTimeRemaining > 0) {
                          ensureAudioContext()
                          breakEndTimeRef.current = Date.now() + breakTimeRemaining * 1000
                          setBreakTimerRunning(true)
                        }
                      }}
                    >
                      <span
                        className="break-activity-remove"
                        onClick={(e) => {
                          e.stopPropagation()
                          const updated = new Set(hiddenBreakActivities)
                          updated.add(activity.file)
                          setHiddenBreakActivities(updated)
                          localStorage.setItem(STORAGE_KEYS.BREAK_HIDDEN_ACTIVITIES, JSON.stringify([...updated]))
                        }}
                        title={`Hide ${tooltip}`}
                      ><X size={10} strokeWidth={3} /></span>
                      <img
                        src={`${import.meta.env.BASE_URL}icons/${activity.file}`}
                        alt={activity.name}
                        className="break-activity-icon"
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Brain Dump */}
          <div className={`brain-dump-section ${!showBrainDump ? 'hidden' : ''}`}>
            <div className="brain-dump-header">
              <div className="brain-dump-quick">
                {(window.SpeechRecognition || window.webkitSpeechRecognition) && (
                  <button
                    className="brain-dump-mic-btn"
                    onClick={() => setRecordingModalOpen(true)}
                    title="Voice dump — speak your thoughts"
                  >
                    <MicVocal size={14} />
                  </button>
                )}
                <input
                  type="text"
                  className="brain-dump-quick-input"
                  placeholder="Type it, let it go, refocus."
                  value={brainDumpQuick}
                  onChange={(e) => setBrainDumpQuick(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && brainDumpQuick.trim()) {
                      const updated = brainDump ? brainDump + '\n\n' + brainDumpQuick.trim() : brainDumpQuick.trim()
                      setBrainDump(updated)
                      localStorage.setItem(STORAGE_KEYS.BRAIN_DUMP, updated)
                      setBrainDumpQuick('')
                    }
                  }}
                />
                <button
                  className="brain-dump-quick-btn"
                  onClick={() => {
                    if (brainDumpQuick.trim()) {
                      const updated = brainDump ? brainDump + '\n\n' + brainDumpQuick.trim() : brainDumpQuick.trim()
                      setBrainDump(updated)
                      localStorage.setItem(STORAGE_KEYS.BRAIN_DUMP, updated)
                      setBrainDumpQuick('')
                    }
                  }}
                  title="Store anything that is on your mind and keeps you from focussing"
                >Store</button>
              </div>
            </div>
            <textarea
              ref={brainDumpTextareaRef}
              cols="1"
              placeholder="Offload your thoughts here..."
              value={brainDump}
              onChange={(e) => {
                const val = e.target.value
                setBrainDump(val)
                if (!val.trim() && brainDumpTextareaRef.current) {
                  brainDumpTextareaRef.current.style.height = '150px'
                }
                clearTimeout(brainDumpTimerRef.current)
                brainDumpTimerRef.current = setTimeout(() => {
                  localStorage.setItem(STORAGE_KEYS.BRAIN_DUMP, val)
                }, 1000)
              }}
              onBlur={() => {
                clearTimeout(brainDumpTimerRef.current)
                const trimmed = brainDump.split('\n').map(line => line.trim()).join('\n')
                setBrainDump(trimmed)
                localStorage.setItem(STORAGE_KEYS.BRAIN_DUMP, trimmed)
              }}
            />
            {brainDump && (
              <div className="brain-dump-actions">
                <button
                  className="brain-dump-action-btn"
                  onClick={() => {
                    const ta = brainDumpTextareaRef.current
                    if (ta) {
                      ta.style.height = 'auto'
                      ta.style.height = (ta.scrollHeight + 16) + 'px'
                      const section = ta.closest('.brain-dump-section')
                      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                  title="Expand to fit content"
                >
                  <Maximize2 size={14} />
                </button>
                <button
                  className="brain-dump-action-btn"
                  onClick={() => {
                    const ta = brainDumpTextareaRef.current
                    if (ta) ta.style.height = '150px'
                  }}
                  title="Shrink to default height"
                >
                  <Minimize2 size={14} />
                </button>
                <button
                  className={`brain-dump-action-btn ${brainDumpCopied ? 'copied' : ''}`}
                  onClick={() => {
                    navigator.clipboard.writeText(brainDump)
                    setBrainDumpCopied(true)
                    setTimeout(() => setBrainDumpCopied(false), 1500)
                  }}
                  title="Copy to clipboard"
                >
                  <Copy size={14} />
                </button>
                <button
                  className="brain-dump-action-btn danger"
                  onClick={() => setBrainDumpClearConfirmOpen(true)}
                  title="Clear brain dump"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

        </section>
      </main>

      {/* Drawer Trigger Buttons */}
      {triggerLeft !== null && (
        <div className="drawer-trigger-group">
          <button
            className={`drawer-trigger ${showStickyNotes ? 'active' : ''}`}
            onClick={() => {
              const opening = !showStickyNotes
              setShowStickyNotes(opening)
              setHabitDrawerOpen(false); setSecondDrawerOpen(false); setWhiteboardDrawerOpen(false)
              if (opening) {
                if (stickyNotes.length === 0) {
                  const x = window.innerWidth / 2 - 150 + (Math.random() - 0.5) * 100
                  const y = window.innerHeight / 2 - 150 + (Math.random() - 0.5) * 100
                  addStickyNote(x, y)
                } else {
                  const clamped = clampNotesToViewport(stickyNotes, window.innerWidth, window.innerHeight)
                  if (clamped !== stickyNotes) { setStickyNotes(clamped); saveStickyNotes(clamped) }
                }
              }
            }}
            title={showStickyNotes ? 'Hide sticky notes (Shift+Tab)' : 'Show sticky notes (Shift+Tab)'}
          >
            <Sticker size={18} />
          </button>
          <button
            className={`drawer-trigger ${whiteboardDrawerOpen ? 'active' : ''}`}
            onClick={() => { setWhiteboardDrawerOpen(!whiteboardDrawerOpen); setHabitDrawerOpen(false); setSecondDrawerOpen(false); setShowStickyNotes(false) }}
            title={whiteboardDrawerOpen ? 'Close whiteboard' : 'Open whiteboard'}
          >
            <Pen size={18} />
          </button>
          <button
            className={`drawer-trigger ${habitDrawerOpen ? 'active' : ''}`}
            onClick={() => { setHabitDrawerOpen(!habitDrawerOpen); setSecondDrawerOpen(false); setWhiteboardDrawerOpen(false); setShowStickyNotes(false) }}
            title={habitDrawerOpen ? 'Close habit tracker' : 'Open habit tracker'}
          >
            <BarChart3 size={18} />
          </button>
          <button
            className={`drawer-trigger ${secondDrawerOpen ? 'active' : ''}`}
            onClick={() => { setSecondDrawerOpen(!secondDrawerOpen); setHabitDrawerOpen(false); setWhiteboardDrawerOpen(false); setShowStickyNotes(false) }}
            title={secondDrawerOpen ? 'Close pane' : 'Open pane'}
          >
            <Columns4 size={18} />
          </button>
        </div>
      )}

      {/* Habit Tracker Drawer */}
      <div
        ref={habitDrawerRef}
        className={`habit-tracker-drawer ${habitDrawerOpen ? 'open' : ''}`}
      >
        <div className="habit-tracker-drawer-header">
          <h3 className="habit-tracker-drawer-title">Habit <span>Tracker</span></h3>
          <button
            className="btn btn-secondary"
            onClick={() => { setEditingHabit(null); setHabitModalOpen(true) }}
            style={{ fontSize: '0.65rem', padding: '0.4rem 0.8rem' }}
          >
            + Add
          </button>
        </div>
        <div className="habit-tracker-drawer-body">
          <HabitTrackerDrawer
            habits={habitTracker.habits}
            onToggleEntry={toggleHabitEntry}
            onEditHabit={openEditHabit}
          />
        </div>
      </div>

      {/* Second Drawer - Project Board */}
      <div
        ref={secondDrawerRef}
        className={`second-drawer ${secondDrawerOpen ? 'open' : ''}`}
      >
        <div className="habit-tracker-drawer-header">
          <h3 className="habit-tracker-drawer-title">Project <span>Board</span></h3>
          <button
            className="btn btn-secondary"
            onClick={() => setAddProjectModalOpen(true)}
            style={{ fontSize: '0.65rem', padding: '0.4rem 0.8rem' }}
          >
            + Project
          </button>
        </div>
        <div className="project-board-body">
          {projectBoard.projects.length === 0 ? (
            <div className="habit-tracker-empty">
              No projects yet. Click "+ Project" to get started.
            </div>
          ) : (
            <div className="project-board">
              {projectBoard.projects.map(project => (
                <div
                  key={project.id}
                  className="project-column"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnProject(e, project.id)}
                >
                  <div className="project-column-header">
                    <span className="column-title">{project.name}</span>
                    <span className="column-count">{project.tasks.length}</span>
                  </div>
                  <div className="project-column-tasks">
                    {project.tasks.map(task => (
                      <div
                        key={task.id}
                        className="kanban-task"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id, 'project', project.id)}
                        onDragEnd={() => { if (drawerOpenBeforeDrag.current) setSecondDrawerOpen(true); clearDragState() }}
                        onDoubleClick={() => openEditProjectTask(project.id, task)}
                      >
                        <div className="kanban-task-header">
                          <span className={`priority-tag ${task.priority === 'high' ? 'priority-high' : task.priority === 'low' ? 'priority-low' : 'priority-normal'}`}>
                            {task.priority === 'high' ? 'High' : task.priority === 'low' ? 'Low' : 'Normal'}
                          </span>
                        </div>
                        <div className="kanban-task-title">{task.title}</div>
                        <div className="kanban-task-footer">
                          <span className="kanban-task-meta">{task.category}</span>
                          <span className={`kanban-task-time ${task.time_logged_minutes > 0 ? 'has-time' : ''}`}>
                            {formatTime(task.time_logged_minutes)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="column-action add-task-btn" onClick={() => {
                    setEditingProjectTask(null)
                    setProjectTaskModalProjectId(project.id)
                    setProjectTaskModalOpen(true)
                  }}>+ Add</div>
                  <div
                    className="column-action clear-action"
                    onClick={() => {
                      setDeletingProjectId(project.id)
                      setDeleteProjectConfirmOpen(true)
                    }}
                  >Delete</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Third Drawer - Whiteboard */}
      <div
        className={`whiteboard-drawer ${whiteboardDrawerOpen ? 'open' : ''}`}
      >
        <div className="habit-tracker-drawer-header">
          <h3 className="habit-tracker-drawer-title">White<span>board</span></h3>
        </div>
        <div className="whiteboard-drawer-body">
          <WhiteboardDrawer
            whiteboardsData={whiteboardsData}
            getActiveWhiteboard={getActiveWhiteboard}
            onAddStroke={(stroke) => updateActiveWhiteboardStrokes(prev => [...prev, stroke])}
            onSetStrokes={(strokes) => updateActiveWhiteboardStrokes(strokes)}
            onAddWhiteboard={addWhiteboard}
            onDeleteWhiteboard={deleteWhiteboard}
            onSwitchWhiteboard={switchWhiteboard}
            onReorderWhiteboards={reorderWhiteboards}
            isOpen={whiteboardDrawerOpen}
            onClose={() => setWhiteboardDrawerOpen(false)}
          />
        </div>
      </div>

      {/* Add/Edit Block Modal */}
      <AddBlockModal
        isOpen={blockModalOpen}
        onClose={closeBlockModal}
        onSave={editingBlock ? (data) => updateBlock(editingBlock.id, data) : addBlock}
        onDelete={editingBlock ? () => deleteBlock(editingBlock.id) : null}
        editingBlock={editingBlock}
      />

      {/* Add/Edit Task Modal */}
      <AddTaskModal
        isOpen={taskModalOpen}
        onClose={closeTaskModal}
        onSave={editingTask ? (data) => updateKanbanTask(editingTask.id, data) : (data) => addKanbanTask({ ...data, column: taskModalColumn })}
        onDelete={editingTask ? () => deleteKanbanTask(editingTask.id) : null}
        editingTask={editingTask}
        projectRegistry={projectRegistry}
        resolveProjectId={resolveProjectId}
        getProjectName={getProjectName}
      />

      {/* Add/Edit Meeting Modal */}
      <AddMeetingModal
        isOpen={meetingModalOpen}
        onClose={closeMeetingModal}
        onSave={editingMeeting ? (data) => updateMeeting(editingMeeting.id, data) : addMeeting}
        onDelete={editingMeeting ? () => deleteMeeting(editingMeeting.id) : null}
        editingMeeting={editingMeeting}
      />

      {/* Add/Edit Habit Modal */}
      <AddHabitModal
        isOpen={habitModalOpen}
        onClose={closeHabitModal}
        onSave={editingHabit ? (data) => updateHabit(editingHabit.id, data) : addHabit}
        onDelete={editingHabit ? () => deleteHabit(editingHabit.id) : null}
        editingHabit={editingHabit}
      />

      {/* Add/Edit Project Task Modal (reuses AddTaskModal) */}
      <AddTaskModal
        isOpen={projectTaskModalOpen}
        onClose={closeProjectTaskModal}
        onSave={editingProjectTask
          ? (data) => updateProjectTask(editingProjectTask._projectId, editingProjectTask.id, data)
          : (data) => addProjectTask(projectTaskModalProjectId, data)
        }
        onDelete={editingProjectTask
          ? () => { deleteProjectTask(editingProjectTask._projectId, editingProjectTask.id); closeProjectTaskModal() }
          : null
        }
        editingTask={editingProjectTask}
        projectRegistry={projectRegistry}
        resolveProjectId={resolveProjectId}
        getProjectName={getProjectName}
      />

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={addProjectModalOpen}
        onClose={() => setAddProjectModalOpen(false)}
        onSave={(name) => { addProject(name); setAddProjectModalOpen(false) }}
      />

      {/* Delete Project Confirmation */}
      <ConfirmDialog
        isOpen={deleteProjectConfirmOpen}
        onClose={() => { setDeleteProjectConfirmOpen(false); setDeletingProjectId(null) }}
        onConfirm={() => {
          if (deletingProjectId) deleteProject(deletingProjectId)
          setDeleteProjectConfirmOpen(false)
          setDeletingProjectId(null)
        }}
        title="Delete Project"
        message="Are you sure you want to delete this project and all its tasks? This action cannot be undone."
      />

      {/* Clear Done Confirmation Modal */}
      <ConfirmDialog
        isOpen={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        onConfirm={() => {
          clearDoneTasks()
          setClearConfirmOpen(false)
        }}
        title="Clear Done Tasks"
        message="Are you sure you want to remove all tasks from the Done column? This action cannot be undone."
      />

      {/* Load Confirmation Modal */}
      <ConfirmDialog
        isOpen={loadConfirmOpen}
        onClose={() => { setLoadConfirmOpen(false); setPendingLoadData(null); }}
        onConfirm={confirmLoadData}
        title="Load Backup"
        message="Do you really want to overwrite EVERYTHING? All current data will be replaced with the loaded backup."
      />

      {/* Reset Confirmation Modal */}
      <ConfirmDialog
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={confirmResetData}
        title="Reset All Data"
        message="Are you sure you want to reset the app? This will permanently delete ALL your time blocks, tasks, and settings. This action cannot be undone."
      />

      {/* Demo Confirmation Modal */}
      <ConfirmDialog
        isOpen={demoConfirmOpen}
        onClose={() => setDemoConfirmOpen(false)}
        onConfirm={confirmLoadDemo}
        title="Load Demo Data"
        message="Do you really want to overwrite EVERYTHING? All current data will be replaced with example time blocks and tasks."
      />

      {/* Recycle Day Confirmation Modal */}
      <ConfirmDialog
        isOpen={recycleDayConfirmOpen}
        onClose={() => setRecycleDayConfirmOpen(false)}
        onConfirm={confirmRecycleDay}
        title="Reset Day"
        message="Are you sure? This will clear the daily list and repopulate it fresh from the master list."
      />

      {/* Brain Dump Clear Confirmation Modal */}
      <ConfirmDialog
        isOpen={brainDumpClearConfirmOpen}
        onClose={() => setBrainDumpClearConfirmOpen(false)}
        onConfirm={() => {
          setBrainDump('')
          localStorage.setItem(STORAGE_KEYS.BRAIN_DUMP, '')
          if (brainDumpTextareaRef.current) brainDumpTextareaRef.current.style.height = '150px'
          setBrainDumpClearConfirmOpen(false)
        }}
        title="Clear Brain Dump"
        message="Are you sure you want to clear the brain dump? This action cannot be undone."
      />

      {/* Brain Dump Voice Recording Modal */}
      <RecordingModal
        isOpen={recordingModalOpen}
        onClose={() => setRecordingModalOpen(false)}
        onDone={(text) => {
          setBrainDumpQuick(text.trim())
          setRecordingModalOpen(false)
        }}
      />

      {/* Context Switch Clear Confirmation Modal */}
      <ConfirmDialog
        isOpen={contextSwitchClearConfirmOpen}
        onClose={() => setContextSwitchClearConfirmOpen(false)}
        onConfirm={() => {
          const reset = { date: getTodayString(), interrupted: 0, switched: 0 }
          setContextSwitchData(reset)
          localStorage.setItem(STORAGE_KEYS.CONTEXT_SWITCHES, JSON.stringify(reset))
          setContextSwitchClearConfirmOpen(false)
        }}
        title="Reset Counters"
        message="Are you sure you want to reset the context switch counters? This action cannot be undone."
      />

      <ConfirmDialog
        isOpen={scheduleClearConfirmOpen}
        onClose={() => setScheduleClearConfirmOpen(false)}
        onConfirm={() => {
          const empty = { date: getTodayString(), items: [] }
          setMeetings(empty)
          saveMeetings(empty)
          setScheduleClearConfirmOpen(false)
        }}
        title="Clear Schedule"
        message="Are you sure you want to clear the schedule? This action cannot be undone."
      />

      <ConfirmDialog
        isOpen={shortlistClearConfirmOpen}
        onClose={() => setShortlistClearConfirmOpen(false)}
        onConfirm={() => {
          setReminders([])
          saveReminders([])
          setShortlistClearConfirmOpen(false)
        }}
        title="Clear Shortlist"
        message="Are you sure you want to remove all shortlist items? This action cannot be undone."
      />

      <AddThemeModal
        isOpen={themeModalOpen}
        onClose={() => { setThemeModalOpen(false); setEditingTheme(null) }}
        onSave={editingTheme
          ? (data) => { editTheme(editingTheme.id, data); setThemeModalOpen(false); setEditingTheme(null) }
          : (data) => { addTheme(data); setThemeModalOpen(false) }
        }
        onDelete={(id) => { deleteTheme(id); setThemeModalOpen(false); setEditingTheme(null) }}
        editingTheme={editingTheme}
        projectRegistry={projectRegistry}
        onAddProject={addRegistryProject}
      />

      <ConfirmDialog
        isOpen={themesClearConfirmOpen}
        onClose={() => setThemesClearConfirmOpen(false)}
        onConfirm={() => {
          setThemes([])
          saveThemes([])
          setThemesClearConfirmOpen(false)
        }}
        title="Clear Themes"
        message="Are you sure you want to remove all themes? This action cannot be undone."
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSave={updateSettings}
        onTestSound={() => {
          ensureAudioContext()
          playNotification(true)
        }}
        defaultBreakActivities={defaultBreakActivities}
        breakActivitySettings={breakActivitySettings}
        onBreakActivitySettingsChange={updateBreakActivitySettings}
      />

      {/* About Modal */}
      <AboutModal
        isOpen={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
      />

      {/* Edit Preset Modal */}
      {editingPresetIndex !== null && (
        <div className="modal-overlay active" onClick={() => setEditingPresetIndex(null)}>
          <div className="modal" ref={editPresetModalRef} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Preset</h3>
              <button className="modal-close" onClick={() => setEditingPresetIndex(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Focus Time (minutes)</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingPresetValues.work}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setEditingPresetValues({ ...editingPresetValues, work: val === '' ? '' : parseInt(val) })
                  }}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Break Time (minutes)</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingPresetValues.break}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setEditingPresetValues({ ...editingPresetValues, break: val === '' ? '' : parseInt(val) })
                  }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <div className="modal-footer-right">
                <button className="btn btn-secondary" onClick={() => setEditingPresetIndex(null)}>Cancel</button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const workVal = Math.max(1, parseInt(editingPresetValues.work) || 1)
                    const breakVal = Math.max(1, parseInt(editingPresetValues.break) || 1)
                    const newPresets = [...presets]
                    newPresets[editingPresetIndex] = { work: workVal, break: breakVal }
                    setPresets(newPresets)
                    if (editingPresetIndex === activePresetIndex && !timerState.isRunning) {
                      setTimerState(prev => ({
                        ...prev,
                        timeRemaining: workVal * 60,
                        totalTime: workVal * 60,
                        elapsedWhileRunning: 0,
                        endTime: null
                      }))
                    }
                    setEditingPresetIndex(null)
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={closeAlert}
        title={alertDialog.title}
        message={alertDialog.message}
      />

      {/* Sticky Notes Overlay */}
      {showStickyNotes && (
        <div
          className="sticky-notes-overlay"
          onClick={() => {
            if (editingNoteId) {
              setEditingNoteId(null)
              return
            }
            const cleaned = stickyNotes.filter(n => n.title || n.body)
            setStickyNotes(cleaned)
            saveStickyNotes(cleaned)
            setShowStickyNotes(false)
          }}
          onContextMenu={(e) => {
            e.preventDefault()
            const x = e.clientX - 150
            const y = e.clientY - 150
            addStickyNote(x, y)
          }}
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
              onDelete={(id) => {
                const note = stickyNotes.find(n => n.id === id)
                if (note && !note.title && !note.body) {
                  deleteStickyNote(id)
                } else {
                  setDeletingNoteId(id)
                }
              }}
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
                  }, true)
                }
              }}
              onDragEnd={() => {
                saveStickyNotes(stickyNotes)
                setDraggingNoteId(null)
              }}
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

      <audio ref={bellAudioRef} preload="auto">
        <source src={`${import.meta.env.BASE_URL}audio/notification-bell.mp3`} type="audio/mpeg" />
      </audio>

      {/* Break Overlay */}
      {activeBreak && (
        <div className="break-overlay">
          <button
            className="break-overlay-close"
            onClick={() => {
              setActiveBreak(null)
              breakEndTimeRef.current = null
              setBreakTimerRunning(false)
            }}
          >&times;</button>
          <div className="break-overlay-pane">
            <div className="break-overlay-content">
              <img
                src={`${import.meta.env.BASE_URL}icons/${activeBreak.file}`}
                alt={activeBreak.name}
                className="break-overlay-icon"
              />
              {breakTimeRemaining > 0 ? (
                <span className="break-overlay-text">
                  Taking a {Math.ceil(breakTimeRemaining / 60)}-minute break to {activeBreak.name.toLowerCase()}, until {new Date(Date.now() + breakTimeRemaining * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}...
                </span>
              ) : (
                <span className="break-overlay-text break-overlay-complete">
                  Your {Math.round(activeBreak.totalTime / 60)}-minute break has been completed.
                </span>
              )}
            </div>
            <div className="break-overlay-progress">
              <div
                className={`break-overlay-progress-bar${breakTimeRemaining === 0 ? ' no-transition' : ''}`}
                style={{ width: `${activeBreak.totalTime > 0 ? ((activeBreak.totalTime - breakTimeRemaining) / activeBreak.totalTime) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      )}

    </>
  )
}

// ============================================
// TIME BLOCK COMPONENT
// ============================================

function TimeBlock({ block, currentTime, onToggleMinimized, onCycleSubtask, onComplete, onSkip, onToggleRepeatDay, onEdit }) {
  const getBlockStatus = () => {
    const now = currentTime
    const [startH, startM] = block.start_time.split(':').map(Number)
    const [endH, endM] = block.end_time.split(':').map(Number)

    const start = new Date(now)
    start.setHours(startH, startM, 0)

    const end = new Date(now)
    end.setHours(endH, endM, 0)

    if (now < start) return { text: 'on time', className: '' }
    if (now >= start && now <= end) return { text: 'active', className: 'active' }
    return { text: 'behind', className: 'late' }
  }

  const status = getBlockStatus()

  const doneCount = block.subtasks.filter(st => st.state === 'done').length
  const totalCount = block.subtasks.length
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
  const progressClass = getProgressColorClass(progressPercent)

  const handleBlockClick = (e) => {
    // Don't toggle if clicking on interactive elements
    if (e.target.closest('.complete-btn') ||
        e.target.closest('.skip-btn') ||
        e.target.closest('.edit-btn') ||
        e.target.closest('.subtask-pill') ||
        e.target.closest('.repeat-day')) {
      return
    }
    onToggleMinimized()
  }

  return (
    <article className={`task-block ${block.minimized ? 'minimized' : ''}`} onClick={handleBlockClick}>
      <div className="block-action-buttons">
        <button className="edit-btn" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
          <Pencil size={12} />
        </button>
        <button className="skip-btn" onClick={(e) => { e.stopPropagation(); onSkip(); }}>
          ⏭ Skip
        </button>
        <button className="complete-btn" onClick={(e) => { e.stopPropagation(); onComplete(); }}>
          ✓ Complete
        </button>
      </div>

      {/* Compact View */}
      <div className="task-block-compact">
        <span className="compact-time">{block.start_time}</span>
        <span className="compact-title">{block.title}</span>
        <span className={`compact-progress ${progressClass}`}>{progressPercent}%</span>
        <div className="compact-days">
          {[1, 2, 3, 4, 5, 6, 0].map(dayIdx => (
            block.repeat_days.includes(dayIdx) && <span key={dayIdx} className="compact-day">{DAY_LABELS[dayIdx]}</span>
          ))}
        </div>
      </div>

      {/* Expanded View */}
      <div className="task-block-expanded">
        <div className="time-column">
          <div className="time-start">{block.start_time}</div>
          <div className="time-end">{block.end_time}</div>
          <div className="time-duration">{block.duration_minutes} min</div>
          <div className={`time-status ${status.className}`}>{status.text}</div>
        </div>

        <div className="content-column">
          <div className="block-header">
            <h2 className="block-title">{block.title}</h2>
            <div className="repeat-indicator">
              <div className="repeat-row">
                {[1, 2, 3, 4, 5].map(dayIdx => (
                  <div
                    key={dayIdx}
                    className={`repeat-day ${block.repeat_days.includes(dayIdx) ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onToggleRepeatDay(dayIdx); }}
                  >
                    {DAY_LABELS[dayIdx]}
                  </div>
                ))}
              </div>
              <div className="repeat-row">
                {[6, 0].map(dayIdx => (
                  <div
                    key={dayIdx}
                    className={`repeat-day ${block.repeat_days.includes(dayIdx) ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onToggleRepeatDay(dayIdx); }}
                  >
                    {DAY_LABELS[dayIdx]}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {block.description && (
            <p className="block-description">{block.description}</p>
          )}

          {block.tags && block.tags.length > 0 && (
            <div className="block-tags">
              {block.tags.map((tag, i) => (
                <span key={i} className={`tag ${tag === 'no-screens' ? 'highlight' : ''}`}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {block.subtasks && block.subtasks.length > 0 && (
            <div className="subtask-pills">
              {block.subtasks.map(subtask => (
                <div
                  key={subtask.id}
                  className={`subtask-pill ${subtask.state}`}
                  onClick={(e) => { e.stopPropagation(); onCycleSubtask(subtask.id); }}
                >
                  <span className="pill-name">{subtask.title}</span>
                  <span className="pill-minutes">{subtask.duration_minutes}m</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

// ============================================
// KANBAN COLUMN COMPONENT
// ============================================

function KanbanColumn({ column, tasks, onDragStart, onDragOver, onDrop, onAddClick, onEditTask, onClearClick }) {
  const columnNames = {
    backlog: 'Backlog',
    week: 'Week',
    progress: 'Progress',
    done: 'Done'
  }

  const getPriorityClass = (priority) => {
    if (priority === 'high') return 'priority-high'
    if (priority === 'low') return 'priority-low'
    return 'priority-normal'
  }

  return (
    <div
      className="kanban-column"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column)}
    >
      <div className="column-header">
        <span className="column-title">{columnNames[column]}</span>
        <span className={`column-count ${column === 'done' ? 'done-count' : ''}`}>{tasks.length}</span>
      </div>

      <div className="column-tasks">
        {tasks.map(task => (
          <div
            key={task.id}
            className={`kanban-task ${column === 'done' ? 'completed' : ''}`}
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            onDoubleClick={() => onEditTask(task)}
          >
            <div className="kanban-task-header">
              <span className={`priority-tag ${getPriorityClass(task.priority)}`}>
                {task.priority === 'high' ? 'High' : task.priority === 'low' ? 'Low' : 'Normal'}
              </span>
            </div>
            <div className="kanban-task-title">{task.title}</div>
            <div className="kanban-task-footer">
              <span className="kanban-task-meta">{task.category}</span>
              <span className={`kanban-task-time ${task.time_logged_minutes > 0 ? 'has-time' : ''}`}>
                {formatTime(task.time_logged_minutes)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {column === 'done' ? (
        tasks.length > 0 ? (
          <div className="column-action clear-action" onClick={onClearClick}>Clear</div>
        ) : null
      ) : (
        <div className="column-action add-task-btn" onClick={onAddClick}>+ Add</div>
      )}
    </div>
  )
}

// ============================================
// ADD BLOCK MODAL
// ============================================

function useFocusTrap(ref, isOpen) {
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (!isOpen || !ref.current) return

    previousFocusRef.current = document.activeElement

    const getFocusableElements = () => {
      return ref.current.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]), a[href]'
      )
    }

    // Focus first element after autoFocus has had a chance to apply
    requestAnimationFrame(() => {
      if (ref.current && !ref.current.contains(document.activeElement)) {
        const focusable = getFocusableElements()
        if (focusable.length > 0) focusable[0].focus()
      }
    })

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return

      // Always stop propagation to prevent the global Shift+Tab → sticky notes shortcut
      e.stopPropagation()

      const elements = getFocusableElements()
      if (elements.length === 0) {
        e.preventDefault()
        return
      }

      const first = elements[0]
      const last = elements[elements.length - 1]
      const active = document.activeElement

      if (e.shiftKey) {
        if (active === first || !ref.current.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last || !ref.current.contains(active)) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    const el = ref.current
    el.addEventListener('keydown', handleKeyDown)

    return () => {
      el.removeEventListener('keydown', handleKeyDown)
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen, ref])
}

function AddBlockModal({ isOpen, onClose, onSave, onDelete, editingBlock }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('09:00')
  // activeDays[i] = true means day index i is selected (0=Sun, 1=Mon, etc.)
  const [activeDays, setActiveDays] = useState([false, true, true, true, true, true, false])
  const [subtasks, setSubtasks] = useState([{ name: '', minutes: 0 }])
  const [tags, setTags] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Initialize form when editing
  useEffect(() => {
    if (editingBlock) {
      setName(editingBlock.title || '')
      setDescription(editingBlock.description || '')
      setStartTime(editingBlock.start_time || '08:00')
      setEndTime(editingBlock.end_time || '09:00')
      // Convert repeat_days array (numeric indices) to boolean array
      const repeatDays = editingBlock.repeat_days || []
      setActiveDays([0, 1, 2, 3, 4, 5, 6].map(i => repeatDays.includes(i)))
      // Convert subtasks to form format
      const formSubtasks = (editingBlock.subtasks || []).map(st => ({
        id: st.id,
        name: st.title || '',
        minutes: st.duration_minutes || 0
      }))
      setSubtasks(formSubtasks.length > 0 ? formSubtasks : [{ name: '', minutes: 0 }])
      setTags((editingBlock.tags || []).join(', '))
    } else {
      // Reset form for new block - default Mon-Fri
      setName('')
      setDescription('')
      setStartTime('08:00')
      setEndTime('09:00')
      setActiveDays([false, true, true, true, true, true, false])
      setSubtasks([{ name: '', minutes: 0 }])
      setTags('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingBlock, isOpen])

  const modalRef = useRef(null)
  useFocusTrap(modalRef, isOpen)

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a block name')
      return
    }

    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM)

    // Convert boolean array to array of day indices
    const repeatDays = activeDays.map((active, i) => active ? i : -1).filter(i => i !== -1)

    onSave({
      title: name.trim(),
      description: description.trim(),
      start_time: startTime,
      end_time: endTime,
      duration_minutes: durationMinutes,
      category: editingBlock?.category || 'custom',
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      repeat_days: repeatDays,
      subtasks: subtasks
        .filter(s => s.name.trim())
        .map(s => ({
          id: s.id,
          title: s.name.trim(),
          duration_minutes: s.minutes || 0,
          optional: false
        }))
    })

    onClose()
  }

  const addSubtaskInput = () => {
    setSubtasks([...subtasks, { name: '', minutes: 0 }])
  }

  const updateSubtaskName = (index, value) => {
    const newSubtasks = [...subtasks]
    newSubtasks[index] = { ...newSubtasks[index], name: value }
    setSubtasks(newSubtasks)
  }

  const updateSubtaskMinutes = (index, value) => {
    const val = value.replace(/\D/g, '').slice(0, 3)
    const num = parseInt(val) || 0
    const newSubtasks = [...subtasks]
    newSubtasks[index] = { ...newSubtasks[index], minutes: num }
    setSubtasks(newSubtasks)
  }

  const removeSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index))
  }

  const toggleDay = (index) => {
    const newDays = [...activeDays]
    newDays[index] = !newDays[index]
    setActiveDays(newDays)
  }

  if (!isOpen) return null

  const isEditing = !!editingBlock

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="modal" ref={modalRef} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEditing ? 'Edit Time Block' : 'Add Time Block'}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Block Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Morning Workout"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              placeholder="Optional description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tags</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., health, morning, focus (comma separated)"
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input
                type="time"
                className="form-input"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input
                type="time"
                className="form-input"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Repeat Days</label>
            <div className="days-selector">
              <div className="days-row">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className={`day-checkbox ${activeDays[i] ? 'active' : ''}`}
                    onClick={() => toggleDay(i)}
                  >
                    {DAY_LABELS[i]}
                  </div>
                ))}
              </div>
              <div className="days-row">
                {[6, 0].map(i => (
                  <div
                    key={i}
                    className={`day-checkbox ${activeDays[i] ? 'active' : ''}`}
                    onClick={() => toggleDay(i)}
                  >
                    {DAY_LABELS[i]}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Subtasks</label>
            <div className="subtasks-area">
              {subtasks.map((st, i) => (
                <div key={i} className="subtask-input-row">
                  <input
                    type="text"
                    className="form-input subtask-name-input"
                    placeholder="Subtask name"
                    value={st.name}
                    onChange={e => updateSubtaskName(i, e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input subtask-minutes-input no-spinner"
                    placeholder="min"
                    maxLength="3"
                    value={st.minutes || ''}
                    onChange={e => updateSubtaskMinutes(i, e.target.value)}
                  />
                  <button className="subtask-remove" onClick={() => removeSubtask(i)}>
                    &times;
                  </button>
                </div>
              ))}
            </div>
            <button className="add-subtask-btn" onClick={addSubtaskInput}>
              + Add Subtask
            </button>
          </div>
        </div>

        <div className="modal-footer">
          {isEditing && onDelete && (
            <button className="btn btn-danger" onClick={() => setDeleteConfirmOpen(true)}>Delete</button>
          )}
          <div className="modal-footer-right">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>{isEditing ? 'Save Changes' : 'Add Block'}</button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          setDeleteConfirmOpen(false)
          onDelete()
        }}
        title="Delete Time Block"
        message={`Are you sure you want to delete "${name}"? This will permanently remove it from your schedule and cannot be undone.`}
      />
    </div>
  )
}

// ============================================
// ADD TASK MODAL
// ============================================

function AddTaskModal({ isOpen, onClose, onSave, onDelete, editingTask, projectRegistry = [], resolveProjectId, getProjectName }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [project, setProject] = useState('')
  const [priority, setPriority] = useState('normal')
  const [hoursSpent, setHoursSpent] = useState('')
  const [minutesSpent, setMinutesSpent] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const resolveProjectIdLocal = useCallback((nameValue) => {
    if (!nameValue || !nameValue.trim()) return ''
    const trimmed = nameValue.trim()
    const existing = projectRegistry.find(p => p.name.toLowerCase() === trimmed.toLowerCase())
    return existing ? existing.id : ''
  }, [projectRegistry])

  const getProjectNameLocal = useCallback((id) => {
    if (!id) return ''
    const entry = projectRegistry.find(p => p.id === id)
    return entry ? entry.name : id
  }, [projectRegistry])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Initialize form when editing
  useEffect(() => {
    if (editingTask) {
      setName(editingTask.title || '')
      setCategory(editingTask.category || '')
      setProject((getProjectName ? getProjectName(editingTask.project) : getProjectNameLocal(editingTask.project)) || editingTask.project || '')
      setPriority(editingTask.priority || 'normal')
      const hours = Math.floor((editingTask.time_logged_minutes || 0) / 60)
      const mins = (editingTask.time_logged_minutes || 0) % 60
      setHoursSpent(hours > 0 ? String(hours) : '')
      setMinutesSpent(mins > 0 ? String(mins) : '')
    } else {
      // Reset form for new task
      setName('')
      setCategory('')
      setProject('')
      setPriority('normal')
      setHoursSpent('')
      setMinutesSpent('')
    }
  }, [editingTask, getProjectName, getProjectNameLocal, isOpen])

  const modalRef = useRef(null)
  useFocusTrap(modalRef, isOpen)

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a task name')
      return
    }

    const totalMinutes = (parseInt(hoursSpent) || 0) * 60 + (parseInt(minutesSpent) || 0)

    onSave({
      title: name.trim(),
      category: category.trim() || 'Task',
      project: (resolveProjectId ? resolveProjectId(project) : resolveProjectIdLocal(project)) || project.trim(),
      priority,
      time_logged_minutes: totalMinutes
    })

    onClose()
  }

  const handleHoursChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 3)
    setHoursSpent(val)
  }

  const handleMinutesChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2)
    const num = parseInt(val) || 0
    if (num <= 59) setMinutesSpent(val)
  }

  if (!isOpen) return null

  const isEditing = !!editingTask

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="modal" ref={modalRef} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEditing ? 'Edit Task' : 'Add Task'}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Task Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Build MVP"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="category-project-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Category</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Development"
                value={category}
                onChange={e => setCategory(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Project</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Website Redesign"
                value={project}
                list="project-suggestions"
                onChange={e => setProject(e.target.value)}
              />
              <datalist id="project-suggestions">
                {(projectRegistry || []).map(p => <option key={p.id} value={p.name} />)}
              </datalist>
            </div>
          </div>

          <div className="priority-time-row">
            <div className="form-group priority-group">
              <label className="form-label">Priority</label>
              <div className="priority-radio-group">
                <label className={`priority-radio ${priority === 'low' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="priority"
                    value="low"
                    checked={priority === 'low'}
                    onChange={e => setPriority(e.target.value)}
                  />
                  <span>Low</span>
                </label>
                <label className={`priority-radio ${priority === 'normal' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="priority"
                    value="normal"
                    checked={priority === 'normal'}
                    onChange={e => setPriority(e.target.value)}
                  />
                  <span>Normal</span>
                </label>
                <label className={`priority-radio ${priority === 'high' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="priority"
                    value="high"
                    checked={priority === 'high'}
                    onChange={e => setPriority(e.target.value)}
                  />
                  <span>High</span>
                </label>
              </div>
            </div>

            <div className="form-group time-group">
              <label className="form-label">Time Already Spent</label>
              <div className="time-spent-row">
                <input
                  type="text"
                  className="form-input time-spent-input no-spinner"
                  placeholder="0"
                  maxLength="3"
                  value={hoursSpent}
                  onChange={handleHoursChange}
                />
                <span className="time-spent-label">h</span>
                <input
                  type="text"
                  className="form-input time-spent-input no-spinner"
                  placeholder="0"
                  maxLength="2"
                  value={minutesSpent}
                  onChange={handleMinutesChange}
                />
                <span className="time-spent-label">m</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          {isEditing && onDelete && (
            <button className="btn btn-danger" onClick={() => setDeleteConfirmOpen(true)}>Delete</button>
          )}
          <div className="modal-footer-right">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>{isEditing ? 'Save Changes' : 'Add Task'}</button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          setDeleteConfirmOpen(false)
          onDelete()
          onClose()
        }}
        title="Delete Task"
        message={`Are you sure you want to delete "${name}"? This action cannot be undone.`}
      />
    </div>
  )
}

// ============================================
// THEMES SECTION COMPONENT
// ============================================

function ThemesSection({ themes, projectRegistry, onAdd, onEdit, onClear }) {
  const registryIds = useMemo(() => new Set(projectRegistry.map(p => p.id)), [projectRegistry])
  const getProjectName = (id) => {
    const p = projectRegistry.find(pr => pr.id === id)
    return p ? p.name : id
  }

  return (
    <div className="themes-section">
      <div className="themes-header">
        <span className="themes-label">Themes</span>
        <button
          className="themes-clear"
          onClick={onClear}
          title="Clear all themes"
          disabled={themes.length === 0}
        ><Trash2 size={14} /></button>
      </div>
      <div className="themes-pills">
        {themes.map(theme => (
          <div
            key={theme.id}
            className={`theme-pill${theme.color ? ` theme-${theme.color}` : ''}`}
            onClick={() => onEdit(theme)}
          >
            <div className="theme-pill-name">{theme.name}</div>
            {(theme.projectIds || []).filter(pid => registryIds.has(pid)).length > 0 && (
              <div className="theme-pill-projects">
                {(theme.projectIds || []).filter(pid => registryIds.has(pid)).map(pid => (
                  <span key={pid} className="theme-project-tag">{getProjectName(pid)}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        <span className="theme-add" onClick={onAdd}>+ Add</span>
      </div>
    </div>
  )
}

// ============================================
// ADD THEME MODAL
// ============================================

function AddThemeModal({ isOpen, onClose, onSave, onDelete, editingTheme, projectRegistry, onAddProject }) {
  const [name, setName] = useState('')
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedProjectIds, setSelectedProjectIds] = useState([])
  const [newProjectName, setNewProjectName] = useState('')
  const [showNewProjectInput, setShowNewProjectInput] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (editingTheme) {
        setName(editingTheme.name)
        setSelectedColor(editingTheme.color || null)
        setSelectedProjectIds([...(editingTheme.projectIds || [])])
      } else {
        setName('')
        setSelectedColor(null)
        setSelectedProjectIds([])
      }
      setNewProjectName('')
      setShowNewProjectInput(false)
      setDeleteConfirmOpen(false)
    }
  }, [isOpen, editingTheme])

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  const modalRef = useRef(null)
  useFocusTrap(modalRef, isOpen)

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ name: name.trim(), color: selectedColor, projectIds: selectedProjectIds })
    onClose()
  }

  const toggleProject = (projectId) => {
    setSelectedProjectIds(prev =>
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    )
  }

  const handleAddNewProject = () => {
    if (!newProjectName.trim()) return
    const newProject = onAddProject(newProjectName.trim())
    if (newProject) {
      setSelectedProjectIds(prev => prev.includes(newProject.id) ? prev : [...prev, newProject.id])
      setNewProjectName('')
    }
  }

  if (!isOpen) return null

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="modal" ref={modalRef} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{editingTheme ? 'Edit Theme' : 'Add Theme'}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="theme-name-color-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Theme Name</label>
              <textarea
                className="form-input form-textarea"
                placeholder="e.g., Product Launch Q2"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleSave() }}
                rows={3}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div className="theme-color-picker">
                <button
                  className={`theme-color-swatch theme-color-default${selectedColor === null ? ' active' : ''}`}
                  onClick={() => setSelectedColor(null)}
                  title="Default"
                />
                {THEME_COLORS.filter(Boolean).map(color => (
                  <button
                    key={color}
                    className={`theme-color-swatch theme-color-${color}${selectedColor === color ? ' active' : ''}`}
                    onClick={() => setSelectedColor(color)}
                    title={color.charAt(0).toUpperCase() + color.slice(1)}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Projects</label>
            <div className="theme-project-selector">
              {projectRegistry.map(p => (
                <span
                  key={p.id}
                  className={`theme-project-pill${selectedProjectIds.includes(p.id) ? ' selected' : ''}`}
                  onClick={() => toggleProject(p.id)}
                >
                  {p.name}
                </span>
              ))}
              {!showNewProjectInput ? (
                <span className="theme-project-pill add-project-pill" onClick={() => setShowNewProjectInput(true)}>+</span>
              ) : (
                <span className="theme-new-project-inline">
                  <input
                    type="text"
                    className="theme-new-project-input"
                    placeholder="Add new project name..."
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddNewProject(); setShowNewProjectInput(false) }
                      if (e.key === 'Escape') { setNewProjectName(''); setShowNewProjectInput(false) }
                    }}
                    onBlur={() => { if (!newProjectName.trim()) setShowNewProjectInput(false) }}
                    autoFocus
                  />
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          {editingTheme && (
            <button className="btn btn-danger" onClick={() => setDeleteConfirmOpen(true)}>Delete</button>
          )}
          <span style={{ flex: 1 }} />
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim()}>
            {editingTheme ? 'Save' : 'Add'}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => { onDelete(editingTheme.id); setDeleteConfirmOpen(false); onClose() }}
        title="Delete Theme"
        message={`Are you sure you want to delete "${editingTheme?.name || 'this theme'}"? This action cannot be undone.`}
      />
    </div>
  )
}

// ============================================
// ADD PROJECT MODAL
// ============================================

function AddProjectModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (isOpen) setName('')
  }, [isOpen])

  const modalRef = useRef(null)
  useFocusTrap(modalRef, isOpen)

  const handleSave = () => {
    if (!name.trim()) return
    onSave(name.trim())
  }

  if (!isOpen) return null

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="modal" ref={modalRef} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Add Project</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., App Launch"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              autoFocus
            />
          </div>
        </div>
        <div className="modal-footer">
          <div className="modal-footer-right">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>Add Project</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ADD MEETING MODAL
// ============================================

function AddMeetingModal({ isOpen, onClose, onSave, onDelete, editingMeeting }) {
  const [time, setTime] = useState('09:00')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // Initialize form when editing
  useEffect(() => {
    if (editingMeeting) {
      setTime(editingMeeting.time || '09:00')
      setTitle(editingMeeting.title || '')
      setDescription(editingMeeting.description || '')
    } else {
      setTime('09:00')
      setTitle('')
      setDescription('')
    }
  }, [editingMeeting, isOpen])

  const modalRef = useRef(null)
  useFocusTrap(modalRef, isOpen)

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }
    if (!time) {
      alert('Please enter a time')
      return
    }

    onSave({
      time: time,
      title: title.trim(),
      description: description.trim()
    })

    onClose()
  }

  if (!isOpen) return null

  const isEditing = !!editingMeeting

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="modal" ref={modalRef} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEditing ? 'Edit Entry' : 'Add Entry'}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="form-row">
            <div className="form-group" style={{ flex: '0 0 auto' }}>
              <label className="form-label">Time</label>
              <input
                type="time"
                className="form-input"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: '1' }}>
              <label className="form-label">Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Team Meeting"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Additional details..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="modal-footer">
          {isEditing && onDelete && (
            <button className="btn btn-danger" onClick={() => setDeleteConfirmOpen(true)}>Delete</button>
          )}
          <div className="modal-footer-right">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>{isEditing ? 'Save Changes' : 'Add Entry'}</button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          setDeleteConfirmOpen(false)
          onDelete()
          onClose()
        }}
        title="Delete Entry"
        message={`Are you sure you want to delete "${title}"? This action cannot be undone.`}
      />
    </div>
  )
}

// ============================================
// ADD/EDIT HABIT MODAL
// ============================================

function AddHabitModal({ isOpen, onClose, onSave, onDelete, editingHabit }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    if (editingHabit) {
      setName(editingHabit.name || '')
      setDescription(editingHabit.description || '')
    } else {
      setName('')
      setDescription('')
    }
  }, [editingHabit, isOpen])

  const modalRef = useRef(null)
  useFocusTrap(modalRef, isOpen)

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a habit name')
      return
    }
    onSave({ name: name.trim(), description: description.trim() })
    onClose()
  }

  if (!isOpen) return null

  const isEditing = !!editingHabit

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="modal" ref={modalRef} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEditing ? 'Edit Habit' : 'Add Habit'}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Habit Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Meditation"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <textarea
              className="form-input form-textarea"
              placeholder="What does this habit involve?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="modal-footer">
          {isEditing && onDelete && (
            <button className="btn btn-danger" onClick={() => setDeleteConfirmOpen(true)}>Delete</button>
          )}
          <div className="modal-footer-right">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>{isEditing ? 'Save Changes' : 'Add Habit'}</button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          setDeleteConfirmOpen(false)
          onDelete()
          onClose()
        }}
        title="Delete Habit"
        message={`Are you sure you want to delete "${name}"? All tracking data for this habit will be lost.`}
      />
    </div>
  )
}

// ============================================
// HABIT TRACKER DRAWER COMPONENT
// ============================================

function HabitTrackerDrawer({ habits, onToggleEntry, onEditHabit }) {
  const days = getPast30Days()

  if (habits.length === 0) {
    return (
      <div className="habit-tracker-empty">
        No habits yet. Click "+ Add" to start tracking.
      </div>
    )
  }

  return (
    <div className="habit-tracker-grid">
      {/* Day labels header row */}
      <div className="habit-tracker-row habit-tracker-header-row">
        <div className="habit-tracker-days">
          {days.map(day => (
            <div
              key={day.dateStr}
              className={`habit-tracker-day-label ${day.isToday ? 'today' : ''}`}
            >
              <div>{day.dayOfWeek}</div>
              <div className="habit-tracker-day-date">{day.dayDate}</div>
            </div>
          ))}
        </div>
        <div className="habit-tracker-name-spacer" />
      </div>

      {/* Habit rows */}
      {habits.map(habit => (
        <div key={habit.id} className="habit-tracker-row">
          <div className="habit-tracker-days">
            {days.map(day => {
              const state = habit.entries[day.dateStr] || null
              return (
                <button
                  key={day.dateStr}
                  className={`habit-tracker-btn ${state || 'neutral'}`}
                  onClick={() => onToggleEntry(habit.id, day.dateStr)}
                  title={`${day.dayOfWeek} ${day.dateStr}`}
                />
              )
            })}
          </div>
          <span
            className="habit-tracker-name"
            data-tooltip={habit.description || undefined}
            onDoubleClick={() => onEditHabit(habit)}
          >
            {habit.name}
          </span>
        </div>
      ))}
      <div className="habit-tracker-row habit-tracker-spacer-row" />
    </div>
  )
}

// ============================================
// WHITEBOARD DRAWER COMPONENT
// ============================================

const WHITEBOARD_COLORS = [
  { value: '#000000', label: 'Black' },
  { value: '#e74c3c', label: 'Red' },
  { value: '#2980b9', label: 'Blue' },
  { value: '#27ae60', label: 'Green' },
  { value: '#f39c12', label: 'Orange' },
  { value: '#8e44ad', label: 'Purple' },
]

const WHITEBOARD_SIZES = [
  { value: 2, label: 'Thin' },
  { value: 4, label: 'Medium' },
  { value: 8, label: 'Thick' },
  { value: 14, label: 'Heavy' },
  { value: 22, label: 'Extra Heavy' },
]

function getSvgPathFromStroke(stroke) {
  if (!stroke.length) return ''
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...stroke[0], 'Q']
  )
  d.push('Z')
  return d.join(' ')
}

function WhiteboardDrawer({
  whiteboardsData,
  getActiveWhiteboard,
  onAddStroke,
  onSetStrokes,
  onAddWhiteboard,
  onDeleteWhiteboard,
  onSwitchWhiteboard,
  onReorderWhiteboards,
  isOpen,
  onClose,
}) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState('#000000')
  const [size, setSize] = useState(4)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState([])
  const [undoStack, setUndoStack] = useState([])
  const [redoStack, setRedoStack] = useState([])
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const eraserStartStrokesRef = useRef(null)
  const [dragTileIndex, setDragTileIndex] = useState(null)
  const [dragOverTileIndex, setDragOverTileIndex] = useState(null)

  const activeWhiteboard = getActiveWhiteboard()

  // Reset tool defaults when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTool('pen')
      setColor('#000000')
      setSize(4)
    }
  }, [isOpen])

  // Ensure at least one whiteboard exists
  useEffect(() => {
    if (isOpen && whiteboardsData.whiteboards.length === 0) {
      onAddWhiteboard()
    }
  }, [isOpen, whiteboardsData.whiteboards.length, onAddWhiteboard])

  // Keep a ref to strokes so redraw always uses current data
  const strokesRef = useRef(activeWhiteboard?.strokes || [])
  strokesRef.current = activeWhiteboard?.strokes || []

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    for (const stroke of strokesRef.current) {
      drawStroke(ctx, stroke.points, stroke.color, stroke.size)
    }
  }, [])

  const resizeAndRedraw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const rect = container.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    redrawCanvas()
  }, [redrawCanvas])

  // Resize canvas via ResizeObserver
  useEffect(() => {
    if (!isOpen || !containerRef.current) return

    const timer = setTimeout(resizeAndRedraw, 250)
    const observer = new ResizeObserver(resizeAndRedraw)
    observer.observe(containerRef.current)
    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [isOpen, activeWhiteboard?.id, resizeAndRedraw])

  // Redraw when strokes change
  useEffect(() => {
    if (isOpen) redrawCanvas()
  }, [activeWhiteboard?.strokes, isOpen, redrawCanvas])

  const drawStroke = (ctx, points, strokeColor, strokeSize) => {
    const outlinePoints = getStroke(points, {
      size: strokeSize,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
    })
    const pathData = getSvgPathFromStroke(outlinePoints)
    if (!pathData) return
    const path = new Path2D(pathData)
    ctx.fillStyle = strokeColor
    ctx.fill(path)
  }

  const getCanvasPoint = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return [0, 0, 0.5]
    const rect = canvas.getBoundingClientRect()
    return [
      e.clientX - rect.left,
      e.clientY - rect.top,
      e.pressure || 0.5,
    ]
  }

  const handlePointerDown = (e) => {
    if (!activeWhiteboard) return
    e.preventDefault()
    const point = getCanvasPoint(e)

    if (tool === 'eraser') {
      eraserStartStrokesRef.current = [...activeWhiteboard.strokes]
      eraseAtPoint(point)
      setIsDrawing(true)
      return
    }

    setIsDrawing(true)
    setCurrentPoints([point])
  }

  const handlePointerMove = (e) => {
    if (!isDrawing || !activeWhiteboard) return
    e.preventDefault()
    const point = getCanvasPoint(e)

    if (tool === 'eraser') {
      eraseAtPoint(point)
      return
    }

    setCurrentPoints(prev => {
      const next = [...prev, point]
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        const dpr = window.devicePixelRatio || 1
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
        for (const stroke of activeWhiteboard.strokes) {
          drawStroke(ctx, stroke.points, stroke.color, stroke.size)
        }
        drawStroke(ctx, next, color, size)
      }
      return next
    })
  }

  const handlePointerUp = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    setIsDrawing(false)

    if (tool === 'pen' && currentPoints.length > 0) {
      setUndoStack(prev => [...prev, [...activeWhiteboard.strokes]])
      setRedoStack([])
      onAddStroke({ points: currentPoints, color, size })
      setCurrentPoints([])
    } else if (tool === 'eraser') {
      const before = eraserStartStrokesRef.current
      if (before && before.length !== activeWhiteboard.strokes.length) {
        setUndoStack(prev => [...prev, before])
        setRedoStack([])
      }
      eraserStartStrokesRef.current = null
    }
  }

  const eraseAtPoint = ([x, y]) => {
    if (!activeWhiteboard) return
    const hitRadius = 10
    const remaining = activeWhiteboard.strokes.filter(stroke => {
      return !stroke.points.some(([px, py]) => {
        const dx = px - x
        const dy = py - y
        return dx * dx + dy * dy < hitRadius * hitRadius
      })
    })
    if (remaining.length !== activeWhiteboard.strokes.length) {
      onSetStrokes(remaining)
    }
  }

  const handleUndo = () => {
    if (!activeWhiteboard || undoStack.length === 0) return
    setRedoStack(prev => [...prev, [...activeWhiteboard.strokes]])
    const stack = [...undoStack]
    const prevStrokes = stack.pop()
    setUndoStack(stack)
    onSetStrokes(prevStrokes)
  }

  const handleRedo = () => {
    if (!activeWhiteboard || redoStack.length === 0) return
    setUndoStack(prev => [...prev, [...activeWhiteboard.strokes]])
    const stack = [...redoStack]
    const nextStrokes = stack.pop()
    setRedoStack(stack)
    onSetStrokes(nextStrokes)
  }

  const handleClear = () => {
    if (!activeWhiteboard || activeWhiteboard.strokes.length === 0) return
    setClearConfirmOpen(true)
  }

  const confirmClear = () => {
    setUndoStack(prev => [...prev, [...activeWhiteboard.strokes]])
    setRedoStack([])
    onSetStrokes([])
    setClearConfirmOpen(false)
  }

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      const isMod = e.metaKey || e.ctrlKey
      if (isMod && e.shiftKey && e.key === 'z') {
        e.preventDefault()
        handleRedo()
      } else if (isMod && e.key === 'z') {
        e.preventDefault()
        handleUndo()
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
        e.preventDefault()
        handleClear()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeWhiteboard?.strokes, undoStack, redoStack, onClose])

  // Tile drag-and-drop handlers
  const handleTileDragStart = (e, index) => {
    setDragTileIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleTileDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverTileIndex(index)
  }

  const handleTileDrop = (e, toIndex) => {
    e.preventDefault()
    if (dragTileIndex !== null && dragTileIndex !== toIndex) {
      onReorderWhiteboards(dragTileIndex, toIndex)
    }
    setDragTileIndex(null)
    setDragOverTileIndex(null)
  }

  const handleTileDragEnd = () => {
    setDragTileIndex(null)
    setDragOverTileIndex(null)
  }

  if (!activeWhiteboard) return null

  return (
    <>
      {/* Toolbar */}
      <div className="whiteboard-toolbar">
        <div className="whiteboard-toolbar-group">
          <button
            className={`whiteboard-tool-btn ${tool === 'pen' ? 'active' : ''}`}
            onClick={() => setTool('pen')}
            title="Pen"
          >
            <Pen size={14} />
          </button>
          <button
            className={`whiteboard-tool-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool('eraser')}
            title="Eraser"
          >
            <Eraser size={14} />
          </button>
        </div>

        <div className="whiteboard-toolbar-divider" />

        <div className="whiteboard-toolbar-group">
          <button
            className="whiteboard-tool-btn"
            onClick={handleUndo}
            disabled={!activeWhiteboard.strokes.length}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
          <button
            className="whiteboard-tool-btn"
            onClick={handleRedo}
            disabled={!redoStack.length}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={14} />
          </button>
          <button
            className="whiteboard-tool-btn"
            onClick={handleClear}
            disabled={!activeWhiteboard.strokes.length}
            title="Clear (Delete)"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div className="whiteboard-toolbar-divider" />

        <div className="whiteboard-toolbar-group">
          {WHITEBOARD_COLORS.map(c => (
            <button
              key={c.value}
              className={`whiteboard-color-btn ${color === c.value ? 'active' : ''}`}
              style={{ background: c.value }}
              onClick={() => setColor(c.value)}
              title={c.label}
            />
          ))}
        </div>

        <div className="whiteboard-toolbar-divider" />

        <div className="whiteboard-toolbar-group">
          {WHITEBOARD_SIZES.map(s => (
            <button
              key={s.value}
              className={`whiteboard-size-btn ${size === s.value ? 'active' : ''}`}
              onClick={() => setSize(s.value)}
              title={s.label}
            >
              <div className="whiteboard-size-dot" style={{ width: s.value + 2, height: s.value + 2 }} />
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="whiteboard-canvas-container" ref={containerRef}>
        <canvas
          ref={canvasRef}
          style={{ cursor: tool === 'eraser' ? 'crosshair' : 'crosshair' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      {/* Thumbnail tiles */}
      <div className="whiteboard-tiles">
        {whiteboardsData.whiteboards.map((wb, index) => (
          <WhiteboardTile
            key={wb.id}
            whiteboard={wb}
            isActive={wb.id === activeWhiteboard.id}
            index={index}
            isDragging={dragTileIndex === index}
            isDragOver={dragOverTileIndex === index}
            onClick={() => onSwitchWhiteboard(wb.id)}
            onDelete={() => wb.strokes.length > 0 ? setDeleteConfirmId(wb.id) : onDeleteWhiteboard(wb.id)}
            onDragStart={(e) => handleTileDragStart(e, index)}
            onDragOver={(e) => handleTileDragOver(e, index)}
            onDrop={(e) => handleTileDrop(e, index)}
            onDragEnd={handleTileDragEnd}
          />
        ))}
        <button className="whiteboard-tile-add" onClick={onAddWhiteboard} title="New whiteboard">+</button>
      </div>

      <ConfirmDialog
        isOpen={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        onConfirm={confirmClear}
        title="Clear Whiteboard"
        message="Are you sure you want to clear all drawings on this whiteboard?"
      />

      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          onDeleteWhiteboard(deleteConfirmId)
          setDeleteConfirmId(null)
        }}
        title="Delete Whiteboard"
        message="Are you sure you want to delete this whiteboard? This cannot be undone."
      />
    </>
  )
}

// ============================================
// WHITEBOARD TILE COMPONENT
// ============================================

function WhiteboardTile({
  whiteboard,
  isActive,
  isDragging,
  isDragOver,
  onClick,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  const tileCanvasRef = useRef(null)

  useEffect(() => {
    const canvas = tileCanvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = 96 * dpr
    canvas.height = 72 * dpr
    canvas.style.width = '96px'
    canvas.style.height = '72px'

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, 96, 72)

    if (whiteboard.strokes.length === 0) return

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const stroke of whiteboard.strokes) {
      for (const [x, y] of stroke.points) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }

    const strokeWidth = maxX - minX || 1
    const strokeHeight = maxY - minY || 1
    const padding = 4
    const scaleX = (96 - padding * 2) / strokeWidth
    const scaleY = (72 - padding * 2) / strokeHeight
    const scale = Math.min(scaleX, scaleY)

    ctx.save()
    ctx.translate(padding, padding)
    ctx.scale(scale, scale)
    ctx.translate(-minX, -minY)

    for (const stroke of whiteboard.strokes) {
      const outlinePoints = getStroke(stroke.points, {
        size: stroke.size,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
      })
      const pathData = getSvgPathFromStroke(outlinePoints)
      if (!pathData) continue
      const path = new Path2D(pathData)
      ctx.fillStyle = stroke.color
      ctx.fill(path)
    }

    ctx.restore()
  }, [whiteboard.strokes])

  return (
    <div
      className={`whiteboard-tile ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <canvas ref={tileCanvasRef} />
      <div className="whiteboard-tile-delete" onClick={(e) => { e.stopPropagation(); onDelete() }}>×</div>
    </div>
  )
}

// ============================================
// MEETINGS SECTION COMPONENT
// ============================================

function MeetingsSection({ meetings, onAdd, onEdit, onClear }) {
  return (
    <div className="meetings-section">
      <div className="meetings-header">
        <span className="meetings-label">Schedule</span>
        <button
          className="meetings-clear"
          onClick={onClear}
          title="Clear schedule"
          disabled={meetings.items.length === 0}
        ><Trash2 size={14} /></button>
      </div>
      <div className="meetings-list">
        {meetings.items.map(meeting => (
          <div
            key={meeting.id}
            className="meeting-item"
            onDoubleClick={() => onEdit(meeting)}
          >
            <span className="meeting-time">{meeting.time}</span>
            <span className="meeting-title">{meeting.title}</span>
            {meeting.description && (
              <span className="meeting-description">{meeting.description}</span>
            )}
          </div>
        ))}
        <div className="meeting-item meeting-add" onClick={onAdd}>
          <span className="meeting-add-icon">+</span>
          <span className="meeting-add-text">Add</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// REMINDERS SECTION COMPONENT
// ============================================

function RemindersSection({ reminders, addReminders, deleteReminder, reorderReminders, cycleUrgency, onClear }) {
  const [dragIndex, setDragIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [addModalOpen, setAddModalOpen] = useState(false)

  const handleDragStart = (e, index) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'copyMove'
    e.dataTransfer.setData('text/plain', index)
    e.dataTransfer.setData('application/x-reminder', JSON.stringify(reminders[index]))
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDrop = (e, toIndex) => {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== toIndex) {
      reorderReminders(dragIndex, toIndex)
    }
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="reminders-section">
      <div className="reminders-header">
        <span className="reminders-label">Don't forget</span>
        <button
          className="reminders-clear"
          onClick={onClear}
          title="Clear all items"
          disabled={reminders.length === 0}
        ><Trash2 size={14} /></button>
      </div>
      <div className="reminders-pills">
        {reminders.map((reminder, index) => (
          <span
            key={reminder.id}
            className={`reminder-pill${reminder.urgency ? ` urgency-${reminder.urgency}` : ''}${dragIndex === index ? ' dragging' : ''}${dragOverIndex === index && dragIndex !== index ? ' drag-over' : ''}`}
            draggable
            onClick={() => cycleUrgency(reminder.id)}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            {reminder.text}
            <button
              className="reminder-delete"
              onClick={(e) => { e.stopPropagation(); deleteReminder(reminder.id) }}
            >
              ×
            </button>
          </span>
        ))}
        <span className="reminder-add" onClick={() => setAddModalOpen(true)}>+ Add</span>
      </div>
      <AddRemindersModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={(texts) => addReminders(texts)}
      />
    </div>
  )
}

// ============================================
// ADD REMINDERS MODAL COMPONENT
// ============================================

function AddRemindersModal({ isOpen, onClose, onSave }) {
  const [text, setText] = useState('')

  useEffect(() => {
    if (isOpen) setText('')
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  const modalRef = useRef(null)
  useFocusTrap(modalRef, isOpen)

  const handleSave = () => {
    const items = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    if (items.length === 0) return
    onSave(items)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="modal" ref={modalRef} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Add Items</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">One item per line</label>
            <textarea
              className="form-input form-textarea"
              placeholder={"groceries\ncall dentist\nreply to email"}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleSave() }}
              rows={5}
              autoFocus
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!text.trim()}>Add</button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// CONFIRM DIALOG COMPONENT
// ============================================

function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const modalRef = useRef(null)
  useFocusTrap(modalRef, isOpen)

  if (!isOpen) return null

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="modal confirm-modal" ref={modalRef} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <p className="confirm-message">{message}</p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ALERT DIALOG COMPONENT
// ============================================

function AlertDialog({ isOpen, onClose, title, message }) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const modalRef = useRef(null)
  useFocusTrap(modalRef, isOpen)

  if (!isOpen) return null

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="modal confirm-modal" ref={modalRef} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <p className="confirm-message">{message}</p>
        </div>

        <div className="modal-footer">
          <div className="modal-footer-right">
            <button className="btn btn-primary" onClick={onClose} autoFocus>OK</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// RECORDING MODAL COMPONENT
// ============================================

function RecordingModal({ isOpen, onClose, onDone }) {
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)
  const intervalRef = useRef(null)
  const transcriptRef = useRef('')
  const errorRef = useRef(false)
  const doneRef = useRef(false)
  const onCloseRef = useRef(onClose)
  const onDoneRef = useRef(onDone)
  onCloseRef.current = onClose
  onDoneRef.current = onDone
  const modalRef = useRef(null)
  useFocusTrap(modalRef, isOpen)

  const handleCancel = useCallback(() => {
    clearInterval(intervalRef.current)
    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      recognitionRef.current.abort()
      recognitionRef.current = null
    }
    onCloseRef.current()
  }, [])

  const handleDone = useCallback(() => {
    clearInterval(intervalRef.current)
    doneRef.current = true
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    } else {
      const text = transcriptRef.current
      if (text.trim()) {
        onDoneRef.current(text)
      } else {
        onCloseRef.current()
      }
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return

    setSeconds(0)
    setError(null)
    errorRef.current = false
    doneRef.current = false
    transcriptRef.current = ''

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = navigator.language || 'en-US'
    recognitionRef.current = recognition

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''
      for (let i = 0; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += text + ' '
        } else {
          interimTranscript += text
        }
      }
      transcriptRef.current = (finalTranscript + interimTranscript).trim()
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        errorRef.current = true
        setError('Microphone access denied.')
      } else if (event.error !== 'aborted') {
        errorRef.current = true
        setError(`Recording error: ${event.error}`)
      }
    }

    recognition.onend = () => {
      if (doneRef.current) {
        recognitionRef.current = null
        const text = transcriptRef.current
        if (text.trim()) {
          onDoneRef.current(text)
        } else {
          onCloseRef.current()
        }
        return
      }
      // Browser may stop recognition on its own (e.g. silence timeout)
      // If the modal is still open and no error, restart it
      if (recognitionRef.current && !errorRef.current) {
        try { recognitionRef.current.start() } catch { /* already started or stopped intentionally */ }
      }
    }

    try {
      recognition.start()
    } catch {
      setError('Could not start speech recognition.')
      return
    }

    intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000)

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        clearInterval(intervalRef.current)
        if (recognitionRef.current) {
          recognitionRef.current.onend = null
          recognitionRef.current.abort()
          recognitionRef.current = null
        }
        onCloseRef.current()
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      clearInterval(intervalRef.current)
      if (recognitionRef.current) {
        recognitionRef.current.onend = null
        recognitionRef.current.abort()
        recognitionRef.current = null
      }
    }
  }, [isOpen])

  const formatTime = (totalSeconds) => {
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
    const s = String(totalSeconds % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  if (!isOpen) return null

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={handleCancel}>
      <div className="modal confirm-modal" ref={modalRef} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Speech to Text</h3>
          <button className="modal-close" onClick={handleCancel}>&times;</button>
        </div>

        <div className="modal-body recording-body">
          {error ? (
            <div className="recording-error">{error}</div>
          ) : (
            <>
              <div className="recording-indicator">
                <div className="recording-pulse" />
              </div>
              <div className="recording-timer">{formatTime(seconds)}</div>
              <div className="recording-hint">Recording in progress...</div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-danger" onClick={handleCancel}>Cancel</button>
          <div className="modal-footer-right">
            {!error && (
              <button className="btn btn-primary" onClick={handleDone}>Done</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// SETTINGS MODAL COMPONENT
// ============================================

function SettingsModal({ isOpen, onClose, settings, onSave, onTestSound, defaultBreakActivities, breakActivitySettings, onBreakActivitySettingsChange }) {
  const [dayStartHour, setDayStartHour] = useState('00')
  const [dayStartMinute, setDayStartMinute] = useState('00')
  const [editingTooltip, setEditingTooltip] = useState(null)
  const [tooltipDraft, setTooltipDraft] = useState('')
  const tooltipInputRef = useRef(null)
  const modalRef = useRef(null)
  useFocusTrap(modalRef, isOpen)

  useEffect(() => {
    if (settings?.dayStartsAt) {
      const [h, m] = settings.dayStartsAt.split(':')
      setDayStartHour(h || '00')
      setDayStartMinute(m || '00')
    }
  }, [settings])

  useEffect(() => {
    if (!isOpen) return
    setEditingTooltip(null)
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (editingTooltip) {
          setEditingTooltip(null)
        } else {
          onClose()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose, editingTooltip])

  useEffect(() => {
    if (editingTooltip && tooltipInputRef.current) {
      tooltipInputRef.current.focus()
      tooltipInputRef.current.select()
    }
  }, [editingTooltip])

  const handleSave = () => {
    const hour = Math.max(0, Math.min(23, parseInt(dayStartHour) || 0))
    const minute = Math.max(0, Math.min(59, parseInt(dayStartMinute) || 0))
    const dayStartsAt = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

    onSave({
      ...settings,
      dayStartsAt
    })
    onClose()
  }

  const toggleActivity = (file) => {
    const current = breakActivitySettings[file] || {}
    const updated = { ...breakActivitySettings, [file]: { ...current, enabled: current.enabled === false } }
    onBreakActivitySettingsChange(updated)
  }

  const startEditTooltip = (file) => {
    const custom = breakActivitySettings[file]?.tooltip
    const defaultName = defaultBreakActivities.find(a => a.file === file)?.name || ''
    setTooltipDraft(custom || defaultName)
    setEditingTooltip(file)
  }

  const saveTooltip = () => {
    if (!editingTooltip) return
    const defaultName = defaultBreakActivities.find(a => a.file === editingTooltip)?.name || ''
    const current = breakActivitySettings[editingTooltip] || {}
    const trimmed = tooltipDraft.trim().slice(0, 20)
    const tooltip = (trimmed && trimmed !== defaultName) ? trimmed : undefined
    const updated = { ...breakActivitySettings, [editingTooltip]: { ...current, tooltip } }
    onBreakActivitySettingsChange(updated)
    setEditingTooltip(null)
  }

  const resetTooltip = (file) => {
    const current = breakActivitySettings[file] || {}
    const { tooltip: _, ...rest } = current
    const updated = { ...breakActivitySettings, [file]: rest }
    onBreakActivitySettingsChange(updated)
    if (editingTooltip === file) {
      const defaultName = defaultBreakActivities.find(a => a.file === file)?.name || ''
      setTooltipDraft(defaultName)
    }
  }

  if (!isOpen) return null

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="modal settings-modal" ref={modalRef} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Settings</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Day Starts At</label>
            <div className="time-input-row">
              <input
                type="text"
                className="form-input time-input-field no-spinner"
                maxLength="2"
                value={dayStartHour}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 2)
                  setDayStartHour(val)
                }}
              />
              <span className="time-input-separator">:</span>
              <input
                type="text"
                className="form-input time-input-field no-spinner"
                maxLength="2"
                value={dayStartMinute}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 2)
                  const num = parseInt(val) || 0
                  if (num <= 59) setDayStartMinute(val)
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notification Volume</label>
            <div className="volume-slider-row">
              <input
                type="range"
                className="volume-slider"
                min="0"
                max="1"
                step="0.05"
                value={settings?.notificationVolume ?? 0.5}
                onChange={e => onSave({ ...settings, notificationVolume: parseFloat(e.target.value) })}
              />
              <span className="volume-label">{Math.round((settings?.notificationVolume ?? 0.5) * 100)}%</span>
              <button className="btn btn-secondary sound-test-btn" onClick={onTestSound}>
                <Bell size={16} />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Break Activities</label>
            <div className="settings-break-grid">
              {defaultBreakActivities.map(activity => {
                const enabled = breakActivitySettings[activity.file]?.enabled !== false
                const hasCustomTooltip = !!breakActivitySettings[activity.file]?.tooltip
                const displayName = breakActivitySettings[activity.file]?.tooltip || activity.name
                const isEditing = editingTooltip === activity.file
                return (
                  <div key={activity.file} className={`settings-break-item ${!enabled ? 'disabled' : ''}`}>
                    <button
                      className={`settings-break-icon-btn ${!enabled ? 'disabled' : ''}`}
                      onClick={() => toggleActivity(activity.file)}
                      title={enabled ? `Disable "${displayName}"` : `Enable "${displayName}"`}
                    >
                      <img
                        src={`${import.meta.env.BASE_URL}icons/${activity.file}`}
                        alt={displayName}
                        className="settings-break-icon"
                      />
                    </button>
                    {isEditing ? (
                      <div className="settings-break-tooltip-edit">
                        <input
                          ref={tooltipInputRef}
                          type="text"
                          className="settings-break-tooltip-input"
                          value={tooltipDraft}
                          onChange={e => setTooltipDraft(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveTooltip()
                            if (e.key === 'Escape') setEditingTooltip(null)
                          }}
                          onBlur={saveTooltip}
                          maxLength={20}
                        />
                      </div>
                    ) : (
                      <span
                        className={`settings-break-tooltip-label ${hasCustomTooltip ? 'custom' : ''}`}
                        onClick={() => startEditTooltip(activity.file)}
                        title="Click to edit tooltip"
                      >
                        {displayName}
                        {hasCustomTooltip && (
                          <button
                            className="settings-break-tooltip-reset"
                            onClick={(e) => { e.stopPropagation(); resetTooltip(activity.file) }}
                            title="Reset to default"
                          ><RotateCcw size={8} /></button>
                        )}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ABOUT MODAL COMPONENT
// ============================================

function AboutModal({ isOpen, onClose }) {
  const modalRef = useRef(null)
  useFocusTrap(modalRef, isOpen)

  if (!isOpen) return null

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="modal about-modal" ref={modalRef} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">About</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body about-body">
          <div className="about-title-line">The</div>
          <div className="about-title-main">Touch<span>Task</span></div>
          <div className="about-title-line">App</div>

          <div className="about-subtitle">Structure your day with time blocks, habits, and focused work sessions</div>

          <div className="about-author-line">
            by <a
              href="https://github.com/florianbuetow"
              target="_blank"
              rel="noopener noreferrer"
            >F Buetow</a>
          </div>

          <div className="about-links">
            <a
              href="https://github.com/florianbuetow/touchtask"
              target="_blank"
              rel="noopener noreferrer"
            >Open Source on GitHub</a>
          </div>

          <div className="about-copyright">
            &copy; {new Date().getFullYear()} Florian Buetow. All rights reserved.
          </div>

          <div className="about-credits">
            <span className="about-credits-label">Credits</span>
            Activity icons by <a href="https://icons8.com" target="_blank" rel="noopener noreferrer">Icons8</a>
          </div>

          <div className="about-privacy">
            <span className="about-privacy-label">Privacy</span>
            All data is stored locally in your browser. Speech-to-text uses your browser's Web Speech API — audio may be processed by your browser vendor (e.g. Google for Chrome). TouchTask does not collect or transmit any data. Provided "as is" without warranty.
          </div>

        </div>
      </div>
    </div>
  )
}

// ============================================
// STICKY NOTE COMPONENT
// ============================================

function StickyNoteCard({ note, isEditing, isTop, onStartEdit, onStopEdit, onUpdate, onDelete, onBringToFront, onDragStart, onDragMove, onDragEnd, isDragging }) {
  const noteRef = useRef(null)
  const titleRef = useRef(null)
  const bodyRef = useRef(null)
  const contentRef = useRef(null)


  // Generate stable random rotation from note id
  const rotation = useMemo(() => {
    let hash = 0
    for (let i = 0; i < note.id.length; i++) {
      hash = ((hash << 5) - hash) + note.id.charCodeAt(i)
      hash |= 0
    }
    return ((hash % 5) + 5) % 5 - 2 // -2 to 2 degrees
  }, [note.id])

  // Prevent wheel events from propagating to background (needs non-passive listener)
  useEffect(() => {
    const el = noteRef.current
    if (!el) return
    const handleWheel = (e) => {
      const target = el.querySelector('.sticky-note-body-input') || el.querySelector('.sticky-note-body')
      if (target && target.scrollHeight > target.clientHeight) {
        e.preventDefault()
        e.stopPropagation()
        target.scrollTop += e.deltaY
        onUpdate(note.id, { scrollTop: target.scrollTop })
      }
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [note.id, onUpdate])

  // Restore scroll position
  useEffect(() => {
    if (!note.scrollTop) return
    const target = isEditing
      ? noteRef.current?.querySelector('.sticky-note-body-input')
      : contentRef.current?.querySelector('.sticky-note-body')
    if (target) target.scrollTop = note.scrollTop
  }, [isEditing, note.scrollTop])

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
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      onStopEdit()
    }
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
      ref={noteRef}
      onClick={(e) => { e.stopPropagation(); onBringToFront(note.id) }}
    >
      <div className="sticky-note-actions">
        <button
          className="sticky-note-action"
          onClick={(e) => {
            e.stopPropagation()
            const text = [note.title, note.body].filter(Boolean).join('\n')
            navigator.clipboard.writeText(text)
          }}
          title="Copy to clipboard"
        >
          <Copy size={12} />
        </button>
        <button
          className="sticky-note-action"
          onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
          title="Delete note"
        >
          &times;
        </button>
      </div>

      {isEditing ? (
        <div className="sticky-note-content editing">
          <input
            ref={titleRef}
            className="sticky-note-title-input"
            value={note.title}
            onChange={(e) => onUpdate(note.id, { title: e.target.value }, true)}
            onBlur={() => onUpdate(note.id, { title: titleRef.current?.value ?? note.title })}
            onKeyDown={handleTitleKeyDown}
            placeholder="Title"
          />
          <div className="sticky-note-spacer" />
          <textarea
            ref={bodyRef}
            className="sticky-note-body-input"
            value={note.body}
            onChange={(e) => onUpdate(note.id, { body: e.target.value }, true)}
            onBlur={() => onUpdate(note.id, { body: bodyRef.current?.value ?? note.body })}
            onKeyDown={handleBodyKeyDown}
            placeholder="Type here..."
          />
        </div>
      ) : (
        <div className="sticky-note-content" ref={contentRef}>
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

export default App
