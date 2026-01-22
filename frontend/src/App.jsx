import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, BellOff, Eye, EyeOff, Menu, Pencil, Recycle, StickyNote, Timer, Columns4, CalendarCheck, LayoutList } from 'lucide-react'
import './App.css'

// ============================================
// UTILITY FUNCTIONS
// ============================================

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const getTodayString = () => new Date().toISOString().split('T')[0]

// Days: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const getToday = () => new Date().getDay()

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
}

const getDefaultSettings = () => ({
  dayStartsAt: '00:00',
  use24HourFormat: true
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
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Pomodoro state
  const [presets, setPresets] = useState([
    { work: 10, break: 20 },
    { work: 25, break: 5 },
    { work: 50, break: 10 },
    { work: 90, break: 15 }
  ])
  const [activePresetIndex, setActivePresetIndex] = useState(1)
  const [editingPresetIndex, setEditingPresetIndex] = useState(null)
  const [editingPresetValues, setEditingPresetValues] = useState({ work: 0, break: 0 })
  const [bellEnabled, setBellEnabled] = useState(true)
  const [timerState, setTimerState] = useState({
    isRunning: false,
    isBreak: false,
    timeRemaining: 25 * 60,
    totalTime: 25 * 60,
    activeTaskId: null,
    elapsedWhileRunning: 0
  })
  const timerRef = useRef(null)

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

  // Drag state
  const [draggedTaskId, setDraggedTaskId] = useState(null)

  // Section visibility state
  const [showReminders, setShowReminders] = useState(true)
  const [showPomodoro, setShowPomodoro] = useState(true)
  const [showKanban, setShowKanban] = useState(true)
  const [showMeetings, setShowMeetings] = useState(true)
  const [showTimeBlocks, setShowTimeBlocks] = useState(true)

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
      const kanban = loadKanbanTasks()
      console.log('TouchTask: Kanban tasks loaded', kanban)
      const appSettings = loadSettings()
      console.log('TouchTask: Settings loaded', appSettings)
      const loadedReminders = loadReminders()
      console.log('TouchTask: Reminders loaded', loadedReminders)
      const loadedMeetings = loadMeetings()
      console.log('TouchTask: Meetings loaded', loadedMeetings)

      setMasterBlocks(master)
      setDailyState(daily)
      setKanbanTasks(kanban)
      setReminders(loadedReminders)
      setMeetings(loadedMeetings)
      setSettings(appSettings)
      setTimerState(prev => ({
        ...prev,
        timeRemaining: presets[activePresetIndex].work * 60,
        totalTime: presets[activePresetIndex].work * 60
      }))
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
      id: generateId(),
      ...taskData,
      time_logged_minutes: taskData.time_logged_minutes || 0,
      created_at: new Date().toISOString(),
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
      meetings: meetings.items
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
    const loadedKanbanTasks = { tasks: pendingLoadData.kanbanTasks }

    saveMasterBlocks(loadedMasterBlocks)
    setMasterBlocks(loadedMasterBlocks)

    // Always treat as a new day - copy all master blocks to daily state
    const newDaily = initializeDailyState(loadedMasterBlocks, null)
    setDailyState(newDaily)

    saveKanbanTasks(loadedKanbanTasks)
    setKanbanTasks(loadedKanbanTasks)

    // Load reminders
    const loadedReminders = pendingLoadData.reminders || []
    saveReminders(loadedReminders)
    setReminders(loadedReminders)

    // Load meetings
    const loadedMeetings = { date: getTodayString(), items: pendingLoadData.meetings || [] }
    saveMeetings(loadedMeetings)
    setMeetings(loadedMeetings)

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

  const addReminder = (text) => {
    if (!text.trim()) return
    const newReminder = {
      id: generateId(),
      text: text.trim()
    }
    const updated = [...reminders, newReminder]
    setReminders(updated)
    saveReminders(updated)
  }

  const deleteReminder = (id) => {
    const updated = reminders.filter(r => r.id !== id)
    setReminders(updated)
    saveReminders(updated)
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
  // POMODORO HANDLERS
  // ============================================

  const selectPreset = (index) => {
    setActivePresetIndex(index)
    setTimerState(prev => ({
      ...prev,
      timeRemaining: presets[index].work * 60,
      totalTime: presets[index].work * 60,
      isRunning: false,
      isBreak: false
    }))
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const playNotification = useCallback(() => {
    if (!bellEnabled) return
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.connect(g)
      g.connect(ctx.destination)
      osc.frequency.value = 800
      g.gain.setValueAtTime(0.3, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
      osc.start()
      osc.stop(ctx.currentTime + 0.5)
    } catch (e) {
      console.error('Audio notification failed:', e)
    }
  }, [bellEnabled])

  const startBreakMode = useCallback(() => {
    const breakTime = presets[activePresetIndex].break * 60
    setTimerState(prev => ({
      ...prev,
      isBreak: true,
      isRunning: true,
      timeRemaining: breakTime,
      totalTime: breakTime,
      elapsedWhileRunning: 0
    }))

    timerRef.current = setInterval(() => {
      setTimerState(prev => {
        if (prev.timeRemaining <= 1) {
          clearInterval(timerRef.current)
          playNotification()
          return {
            ...prev,
            isRunning: false,
            isBreak: false,
            timeRemaining: presets[activePresetIndex].work * 60,
            totalTime: presets[activePresetIndex].work * 60
          }
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 }
      })
    }, 1000)
  }, [activePresetIndex, presets, playNotification])

  const toggleTimer = useCallback(() => {
    if (timerState.isBreak) {
      // Skip break
      clearInterval(timerRef.current)
      setTimerState(prev => ({
        ...prev,
        isRunning: false,
        isBreak: false,
        timeRemaining: presets[activePresetIndex].work * 60,
        totalTime: presets[activePresetIndex].work * 60
      }))
      return
    }

    if (!timerState.activeTaskId) {
      showAlert('No Task Selected', 'Drag a task to the timer first!')
      return
    }

    if (timerState.isRunning) {
      // Stop timer
      clearInterval(timerRef.current)
      setTimerState(prev => ({
        ...prev,
        isRunning: false
      }))
    } else {
      // Start timer
      setTimerState(prev => ({ ...prev, isRunning: true }))

      timerRef.current = setInterval(() => {
        setTimerState(prev => {
          const newElapsed = prev.elapsedWhileRunning + 1

          // Increment task time every 60 seconds
          if (newElapsed % 60 === 0 && prev.activeTaskId) {
            incrementTaskTime(prev.activeTaskId, 1)
          }

          if (prev.timeRemaining <= 1) {
            clearInterval(timerRef.current)
            playNotification()
            startBreakMode()
            return {
              ...prev,
              timeRemaining: 0,
              elapsedWhileRunning: newElapsed
            }
          }

          return {
            ...prev,
            timeRemaining: prev.timeRemaining - 1,
            elapsedWhileRunning: newElapsed
          }
        })
      }, 1000)
    }
  }, [timerState.isBreak, timerState.activeTaskId, timerState.isRunning, activePresetIndex, presets, playNotification, startBreakMode, incrementTaskTime])

  const resetTimer = () => {
    clearInterval(timerRef.current)
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      isBreak: false,
      timeRemaining: presets[activePresetIndex].work * 60,
      totalTime: presets[activePresetIndex].work * 60,
      elapsedWhileRunning: 0
    }))
  }

  const setActiveTask = (taskId) => {
    if (timerState.isRunning) {
      clearInterval(timerRef.current)
    }
    setTimerState(prev => ({
      ...prev,
      activeTaskId: taskId,
      isRunning: false,
      isBreak: false,
      timeRemaining: presets[activePresetIndex].work * 60,
      totalTime: presets[activePresetIndex].work * 60,
      elapsedWhileRunning: 0
    }))
  }

  const clearActiveTask = () => {
    if (timerState.isRunning) {
      clearInterval(timerRef.current)
    }
    setTimerState(prev => ({
      ...prev,
      activeTaskId: null,
      isRunning: false,
      isBreak: false,
      timeRemaining: presets[activePresetIndex].work * 60,
      totalTime: presets[activePresetIndex].work * 60,
      elapsedWhileRunning: 0
    }))
  }

  // ============================================
  // DRAG AND DROP
  // ============================================

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDropOnColumn = (e, column) => {
    e.preventDefault()
    if (draggedTaskId) {
      moveKanbanTask(draggedTaskId, column)
      setDraggedTaskId(null)
    }
  }

  const handleDropOnTimer = (e) => {
    e.preventDefault()
    if (draggedTaskId) {
      setActiveTask(draggedTaskId)
      setDraggedTaskId(null)
    }
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
          <div className="topbar-date">{dateString}</div>
          <div className="topbar-menu">
            <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
              <Menu size={20} />
            </button>
            {menuOpen && (
              <>
                <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
                <div className="menu-dropdown">
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
        <section className="habits-section">
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

        {/* Right Column - Kanban */}
        <aside className="kanban-section">
          <header className="section-header">
            <h2 className="section-title">Project <span>Tracking</span></h2>
            <div className="section-meta">
              <span className="section-subtitle">Kanban board</span>
              <div className="section-meta-buttons">
                <button
                  className={`focus-toggle ${!showReminders ? 'disabled' : ''}`}
                  onClick={() => setShowReminders(!showReminders)}
                  title={showReminders ? 'Hide reminders' : 'Show reminders'}
                >
                  <StickyNote size={14} />
                </button>
                <button
                  className={`focus-toggle ${!showPomodoro ? 'disabled' : ''}`}
                  onClick={() => setShowPomodoro(!showPomodoro)}
                  title={showPomodoro ? 'Hide pomodoro timer' : 'Show pomodoro timer'}
                >
                  <Timer size={14} />
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

          {/* Reminders Section */}
          <div className={!showReminders ? 'hidden' : ''}>
            <RemindersSection
              reminders={reminders}
              addReminder={addReminder}
              deleteReminder={deleteReminder}
            />
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
                className={`drop-zone ${activeTask ? 'has-task' : ''} ${timerState.isBreak ? 'break-mode' : ''}`}
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
                className={`timer-progress-bar ${timerState.isBreak ? 'break-time' : ''}`}
                style={{ width: `${((timerState.totalTime - timerState.timeRemaining) / timerState.totalTime) * 100}%` }}
              />
            </div>
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
      </main>

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
      />

      {/* Add/Edit Meeting Modal */}
      <AddMeetingModal
        isOpen={meetingModalOpen}
        onClose={closeMeetingModal}
        onSave={editingMeeting ? (data) => updateMeeting(editingMeeting.id, data) : addMeeting}
        onDelete={editingMeeting ? () => deleteMeeting(editingMeeting.id) : null}
        editingMeeting={editingMeeting}
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

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSave={updateSettings}
      />

      {/* About Modal */}
      <AboutModal
        isOpen={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
      />

      {/* Edit Preset Modal */}
      {editingPresetIndex !== null && (
        <div className="modal-overlay active" onClick={() => setEditingPresetIndex(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
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
                        totalTime: workVal * 60
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
    <div className="kanban-column">
      <div className="column-header">
        <span className="column-title">{columnNames[column]}</span>
        <span className={`column-count ${column === 'done' ? 'done-count' : ''}`}>{tasks.length}</span>
      </div>

      <div
        className="column-tasks"
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, column)}
      >
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
      <div className="modal" onClick={e => e.stopPropagation()}>
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

function AddTaskModal({ isOpen, onClose, onSave, onDelete, editingTask }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('normal')
  const [hoursSpent, setHoursSpent] = useState('')
  const [minutesSpent, setMinutesSpent] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // Initialize form when editing
  useEffect(() => {
    if (editingTask) {
      setName(editingTask.title || '')
      setCategory(editingTask.category || '')
      setPriority(editingTask.priority || 'normal')
      const hours = Math.floor((editingTask.time_logged_minutes || 0) / 60)
      const mins = (editingTask.time_logged_minutes || 0) % 60
      setHoursSpent(hours > 0 ? String(hours) : '')
      setMinutesSpent(mins > 0 ? String(mins) : '')
    } else {
      // Reset form for new task
      setName('')
      setCategory('')
      setPriority('normal')
      setHoursSpent('')
      setMinutesSpent('')
    }
  }, [editingTask, isOpen])

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a task name')
      return
    }

    const totalMinutes = (parseInt(hoursSpent) || 0) * 60 + (parseInt(minutesSpent) || 0)

    onSave({
      title: name.trim(),
      category: category.trim() || 'Task',
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
      <div className="modal" onClick={e => e.stopPropagation()}>
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
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Project"
              value={category}
              onChange={e => setCategory(e.target.value)}
            />
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
      <div className="modal" onClick={e => e.stopPropagation()}>
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
// MEETINGS SECTION COMPONENT
// ============================================

function MeetingsSection({ meetings, onAdd, onEdit }) {
  return (
    <div className="meetings-section">
      <div className="meetings-header">
        <span className="meetings-label">Schedule</span>
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

function RemindersSection({ reminders, addReminder, deleteReminder }) {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      addReminder(inputValue)
      setInputValue('')
    }
  }

  return (
    <div className="reminders-section">
      <div className="reminders-header">
        <span className="reminders-label">Reminders</span>
      </div>
      <div className="reminders-pills">
        {reminders.length === 0 ? (
          <span className="reminders-empty">No reminders yet</span>
        ) : (
          reminders.map(reminder => (
            <span key={reminder.id} className="reminder-pill">
              {reminder.text}
              <button
                className="reminder-delete"
                onClick={() => deleteReminder(reminder.id)}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>
      <input
        type="text"
        className="reminders-input"
        placeholder="Add a reminder and press Enter..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
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

  if (!isOpen) return null

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
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

  if (!isOpen) return null

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
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
// SETTINGS MODAL COMPONENT
// ============================================

function SettingsModal({ isOpen, onClose, settings, onSave }) {
  const [dayStartHour, setDayStartHour] = useState('00')
  const [dayStartMinute, setDayStartMinute] = useState('00')

  useEffect(() => {
    if (settings?.dayStartsAt) {
      const [h, m] = settings.dayStartsAt.split(':')
      setDayStartHour(h || '00')
      setDayStartMinute(m || '00')
    }
  }, [settings])

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

  if (!isOpen) return null

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="modal settings-modal" onClick={e => e.stopPropagation()}>
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
  if (!isOpen) return null

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="modal about-modal" onClick={e => e.stopPropagation()}>
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
              href="https://github.com/florianbuetow/touchtask"
              target="_blank"
              rel="noopener noreferrer"
            >F Buetow</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
