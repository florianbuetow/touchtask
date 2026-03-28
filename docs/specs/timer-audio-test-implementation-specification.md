# Timer Audio Alerts - Test Implementation Specification

## Test Framework & Conventions

- **Stack**: React 18 + Vite
- **Test framework**: Jest with `--experimental-vm-modules` (already configured in `package.json`)
- **Assertion style**: Jest `expect()` assertions
- **DOM environment**: jsdom (for React component rendering)
- **Mocking**: Jest `jest.fn()` for functions, manual mocks for browser APIs (`AudioContext`, `Worker`, `localStorage`, `document.visibilityState`)

## Test Structure

- **File**: `frontend/src/timer-audio.test.js`
- **Grouping**: `describe` blocks by functional area matching the test specification groupings
- **Naming**: `test('TS-XX: scenario title', ...)` — includes scenario ID for traceability

## Test Categories

### Category A: Automated Jest Tests
Scenarios that can be verified with Jest + mocked browser APIs. These test the core timer logic, state transitions, and sound triggering.

### Category B: Manual Browser Tests
Scenarios that require real browser behavior (background tab throttling, real Web Audio API playback, Worker thread behavior). Documented as a manual test checklist.

## Fixtures & Test Data

### Mocked Browser APIs

```
AudioContext mock:
  - state: 'running' | 'suspended'
  - resume(): sets state to 'running', returns Promise
  - decodeAudioData(): returns mock AudioBuffer
  - createBufferSource(): returns mock AudioBufferSourceNode
    - connect(): no-op
    - start(): records call
  - createGain(): returns mock GainNode
    - connect(): no-op
    - gain: { value: 1 }
  - destination: {}

Worker mock:
  - constructor(): stores onmessage handler
  - postMessage(): no-op
  - terminate(): no-op
  - simulateTick(): calls stored onmessage with 'tick'

localStorage mock:
  - getItem/setItem/removeItem: in-memory Map
```

### Timer State Factory

```
createTimerState(overrides = {}):
  returns {
    isRunning: false,
    isBreak: false,
    timeRemaining: 25 * 60,
    totalTime: 25 * 60,
    activeTaskId: null,
    elapsedWhileRunning: 0,
    endTime: null,
    ...overrides
  }
```

## Test Scenario Mapping

| Test Scenario ID | Scenario Title | Test Function | Category |
|------------------|---------------|---------------|----------|
| TS-1 | Work expires, focused | `test_work_timer_plays_sound_on_expiry` | A |
| TS-2 | Work expires, background | Manual: start 1min Pomodoro, switch tabs, listen | B |
| TS-3 | Work expires, page reload | `test_work_timer_plays_sound_on_reload_after_expiry` | A |
| TS-4 | Auto-transition to break | `test_work_expiry_transitions_to_break` | A |
| TS-5 | Break expires, focused | `test_break_timer_plays_sound_on_expiry` | A |
| TS-6 | Break expires, background | Manual: let auto-break run, switch tabs, listen | B |
| TS-7 | Break expires, page reload | `test_break_timer_plays_sound_on_reload_after_expiry` | A |
| TS-8 | Break resets, no loop | `test_break_expiry_resets_to_work_no_loop` | A |
| TS-9 | Break pane expires, focused | `test_break_pane_plays_sound_on_expiry` | A |
| TS-10 | Break pane expires, background | Manual: start break pane, switch tabs, listen | B |
| TS-11 | Break pane expires, page reload | `test_break_pane_plays_sound_on_reload_after_expiry` | A |
| TS-12 | Pomodoro time accurate after refocus | `test_pomodoro_time_correct_after_elapsed` | A |
| TS-13 | Break pane time accurate after refocus | `test_break_pane_time_correct_after_elapsed` | A |
| TS-14 | Progress bar correct after refocus | `test_progress_bar_reflects_elapsed_time` | A |
| TS-15 | Block break when Pomodoro running | `test_break_blocked_while_pomodoro_work_running` | A |
| TS-16 | Allow break during auto-break | `test_break_allowed_during_pomodoro_break` | A |
| TS-17 | Allow break when Pomodoro stopped | `test_break_allowed_when_pomodoro_stopped` | A |
| TS-18 | Single sound per expiry | `test_dedup_prevents_double_sound` | A |
| TS-19 | Test button bypasses dedup | `test_sound_test_button_bypasses_dedup` | A |
| TS-20 | AudioContext used | `test_playNotification_uses_audioContext` | A |
| TS-21 | AudioContext unlocked on gesture | `test_audioContext_created_on_start_click` | A |
| TS-22 | visibilitychange resumes context | `test_visibility_change_resumes_audioContext` | A |
| TS-23 | StrictMode safe | Manual: run dev server, verify timer works after HMR | B |
| TS-24 | endTime persisted | `test_endTime_persisted_to_localStorage` | A |
| TS-25 | Both phases expired on reload | `test_both_phases_expired_plays_single_sound` | A |
| TS-26 | bellEnabled false | `test_no_sound_when_bell_disabled` | A |
| TS-27 | Suspended AudioContext recovery | `test_suspended_audioContext_resumed_on_visibility` | A |
| TS-28 | Audio file load failure | `test_audio_load_failure_logs_error_no_crash` | A |

## Automated Test Implementations (Category A)

### Sound Playback on Expiry

```
test_work_timer_plays_sound_on_expiry:
  Given: timerState = { isRunning: true, isBreak: false, endTime: Date.now() - 1000, totalTime: 1500, timeRemaining: 1 }
  When: heartbeat handler fires
  Then: playNotification was called once

test_break_timer_plays_sound_on_expiry:
  Given: timerState = { isRunning: true, isBreak: true, endTime: Date.now() - 1000, totalTime: 300, timeRemaining: 1 }
  When: heartbeat handler fires
  Then: playNotification was called once

test_break_pane_plays_sound_on_expiry:
  Given: breakEndTimeRef.current = Date.now() - 1000, breakTimerRunning = true
  When: heartbeat handler fires
  Then: playNotification was called once
  And: breakTimerRunning is false
```

### Sound on Page Reload

```
test_work_timer_plays_sound_on_reload_after_expiry:
  Given: localStorage contains { isRunning: true, endTime: Date.now() - 60000, isBreak: false }
  When: component mounts and first heartbeat fires
  Then: playNotification is called
  And: timerState.isRunning is false or break mode started

test_break_timer_plays_sound_on_reload_after_expiry:
  Given: localStorage contains { isRunning: true, endTime: Date.now() - 60000, isBreak: true }
  When: component mounts and first heartbeat fires
  Then: playNotification is called
  And: timerState.isRunning is false, isBreak is false

test_break_pane_plays_sound_on_reload_after_expiry:
  Given: localStorage BREAK_TIMER contains { running: true, endTime: Date.now() - 60000 }
  When: component mounts and first heartbeat fires
  Then: playNotification is called
  And: breakTimerRunning is false
```

### State Transitions

```
test_work_expiry_transitions_to_break:
  Given: timerState = { isRunning: true, isBreak: false, endTime: Date.now() - 1000, totalTime: 1500 }
  And: activePresetIndex preset has break = 5
  When: heartbeat handler fires
  Then: timerState.isBreak is true
  And: timerState.isRunning is true
  And: timerState.endTime is approximately Date.now() + 300000
  And: timerState.timeRemaining is 300
  And: timerState.totalTime is 300

test_break_expiry_resets_to_work_no_loop:
  Given: timerState = { isRunning: true, isBreak: true, endTime: Date.now() - 1000, totalTime: 300 }
  And: activePresetIndex preset has work = 25
  When: heartbeat handler fires
  Then: timerState.isRunning is false
  And: timerState.isBreak is false
  And: timerState.endTime is null
  And: timerState.timeRemaining is 1500 (25 * 60)
  When: heartbeat handler fires again
  Then: timerState remains unchanged (no new break started)
```

### Timer Accuracy

```
test_pomodoro_time_correct_after_elapsed:
  Given: timerState = { isRunning: true, endTime: Date.now() + 180000, totalTime: 300, timeRemaining: 300 }
  When: heartbeat handler fires (now = Date.now())
  Then: timerState.timeRemaining is approximately 180 (ceil((endTime - now) / 1000))

test_break_pane_time_correct_after_elapsed:
  Given: breakEndTimeRef.current = Date.now() + 420000
  When: heartbeat handler fires
  Then: breakTimeRemaining is approximately 420
```

### Mutual Exclusion

```
test_break_blocked_while_pomodoro_work_running:
  Given: timerState = { isRunning: true, isBreak: false }
  When: user clicks a break activity icon
  Then: showAlert is called with 'Pomodoro Running'
  And: breakTimerRunning remains false

test_break_allowed_during_pomodoro_break:
  Given: timerState = { isRunning: true, isBreak: true }
  When: user clicks a break activity icon
  Then: break overlay opens
  And: breakTimerRunning becomes true

test_break_allowed_when_pomodoro_stopped:
  Given: timerState = { isRunning: false, isBreak: false }
  When: user clicks a break activity icon
  Then: break overlay opens
  And: breakTimerRunning becomes true
```

### Web Audio API

```
test_playNotification_uses_audioContext:
  Given: AudioContext mock is available
  When: playNotification is called
  Then: AudioContext.createBufferSource or equivalent is called
  And: HTMLAudioElement.play() is NOT called

test_audioContext_created_on_start_click:
  Given: no AudioContext exists
  When: user clicks Start on Pomodoro
  Then: new AudioContext() is constructed or existing one is resumed

test_visibility_change_resumes_audioContext:
  Given: AudioContext exists with state 'suspended'
  When: visibilitychange fires with document.hidden = false
  Then: AudioContext.resume() is called

test_suspended_audioContext_resumed_on_visibility:
  Given: AudioContext is suspended
  And: a timer expired (endTime in the past)
  When: tab becomes visible
  Then: AudioContext.resume() is called
  And: playNotification fires
```

### Deduplication

```
test_dedup_prevents_double_sound:
  Given: playNotification was just called (lastSoundPlayedRef.current ~ Date.now())
  When: playNotification is called again within 3 seconds
  Then: the second call is a no-op (no audio played)

test_sound_test_button_bypasses_dedup:
  Given: playNotification was just called
  When: playNotification(true) is called (force = true)
  Then: audio plays again
```

### Persistence

```
test_endTime_persisted_to_localStorage:
  Given: user starts a Pomodoro timer
  When: timerState changes and persistence effect fires
  Then: localStorage POMODORO_TIMER contains endTime as a numeric timestamp
```

### Edge Cases

```
test_both_phases_expired_plays_single_sound:
  Given: localStorage contains { isRunning: true, endTime: Date.now() - 7200000, isBreak: false }
  When: component mounts and heartbeat fires
  Then: playNotification is called exactly once (dedup prevents work + break sounds)
  And: timer shows work mode, stopped

test_no_sound_when_bell_disabled:
  Given: bellEnabled is false
  When: playNotification is called
  Then: no audio is played

test_audio_load_failure_logs_error_no_crash:
  Given: AudioContext.decodeAudioData rejects with an error
  When: playNotification is called
  Then: console.error is called
  And: no exception is thrown
```

## Manual Browser Test Checklist (Category B)

These scenarios require a real browser and cannot be automated with Jest:

- [ ] **TS-2**: Start 1/1 Pomodoro, switch tabs, verify bell sounds ~60s later while on other tab
- [ ] **TS-6**: Let auto-break start after work expires, switch tabs, verify bell sounds when break expires
- [ ] **TS-10**: Set 1-min break in break pane, click activity, switch tabs, verify bell sounds
- [ ] **TS-23**: With dev server running (StrictMode ON), start and complete a full Pomodoro cycle, verify sounds play and break doesn't loop

## Alignment Check

**Status: Full alignment.** Every test scenario (TS-1 through TS-28) is mapped to either an automated Jest test (Category A) or a manual browser test (Category B). No gaps exist.

**Design concerns:**
- TS-20 and TS-21 test AudioContext usage, which requires mocking the Web Audio API. These tests verify the integration boundary but cannot confirm real browser audio playback.
- TS-23 (StrictMode safety) is architectural — it verifies that the stateless heartbeat Worker design survives double-mounting. This is best verified by manual testing in dev mode.
