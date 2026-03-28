# Timer Audio Alerts - Test Specification

## Coverage Matrix

| Spec Requirement | Test Scenario(s) |
|------------------|-------------------|
| AC-1.1: Work expires, tab focused | TS-1 |
| AC-1.2: Work expires, tab background | TS-2 |
| AC-1.3: Work expires, page reload | TS-3 |
| AC-1.4: Auto-transition to break | TS-4 |
| AC-2.1: Break expires, tab focused | TS-5 |
| AC-2.2: Break expires, tab background | TS-6 |
| AC-2.3: Break expires, page reload | TS-7 |
| AC-2.4: Break resets to work mode, no loop | TS-8 |
| AC-3.1: Break pane expires, focused | TS-9 |
| AC-3.2: Break pane expires, background | TS-10 |
| AC-3.3: Break pane expires, page reload | TS-11 |
| AC-4.1: Pomodoro time accurate after refocus | TS-12 |
| AC-4.2: Break pane time accurate after refocus | TS-13 |
| AC-4.3: Progress bars correct after refocus | TS-14 |
| AC-5.1: Block break when Pomodoro running | TS-15 |
| AC-5.2: Allow break during Pomodoro auto-break | TS-16 |
| AC-5.3: Allow break when Pomodoro stopped | TS-17 |
| AC-6.1: Single sound per expiry | TS-18 |
| AC-6.2: Test button bypasses dedup | TS-19 |
| C-1: Web Audio API used | TS-20 |
| C-2: AudioContext unlocked on gesture | TS-21 |
| C-3: visibilitychange resumes AudioContext | TS-22 |
| C-6: StrictMode safe | TS-23 |
| C-8: endTime persisted to localStorage | TS-24 |
| EC-1: Both phases expired on reload | TS-25 |
| EC-3: bellEnabled false | TS-26 |
| EC-6: Suspended AudioContext recovery | TS-27 |
| EC-7: Audio file load failure | TS-28 |

## Test Scenarios

### Sound Playback — Focused Tab

```
TS-1: Pomodoro work timer sounds on expiry (focused)
  Given a Pomodoro work timer is running with 1 second remaining
  And the tab is focused
  When the timer reaches zero
  Then a bell sound plays within 1 second

TS-5: Pomodoro break timer sounds on expiry (focused)
  Given a Pomodoro break timer is running with 1 second remaining
  And the tab is focused
  When the timer reaches zero
  Then a bell sound plays within 1 second

TS-9: Break pane timer sounds on expiry (focused)
  Given a break pane timer is running with 1 second remaining
  And the tab is focused
  When the timer reaches zero
  Then a bell sound plays within 1 second
```

### Sound Playback — Background Tab

```
TS-2: Pomodoro work timer sounds on expiry (background)
  Given a Pomodoro work timer is running
  And the user switches to another tab
  When the timer reaches zero while the tab is backgrounded
  Then a bell sound plays within 2 seconds

TS-6: Pomodoro break timer sounds on expiry (background)
  Given a Pomodoro break timer is running
  And the user switches to another tab
  When the timer reaches zero while the tab is backgrounded
  Then a bell sound plays within 2 seconds

TS-10: Break pane timer sounds on expiry (background)
  Given a break pane timer is running
  And the user switches to another tab
  When the timer reaches zero while the tab is backgrounded
  Then a bell sound plays within 2 seconds
```

### Sound Playback — Page Reload

```
TS-3: Pomodoro work timer sounds after page reload
  Given a Pomodoro work timer was running and has since expired
  When the user reopens the page
  Then a bell sound plays within 2 seconds of page load

TS-7: Pomodoro break timer sounds after page reload
  Given a Pomodoro break timer was running and has since expired
  When the user reopens the page
  Then a bell sound plays within 2 seconds of page load

TS-11: Break pane timer sounds after page reload
  Given a break pane timer was running and has since expired
  When the user reopens the page
  Then a bell sound plays within 2 seconds of page load
```

### State Transitions

```
TS-4: Work phase transitions to break automatically
  Given a Pomodoro work timer is running
  When the work timer reaches zero
  Then the Pomodoro enters break mode
  And a break countdown begins with the preset break duration
  And the timer display shows the break time

TS-8: Break phase resets to work mode without looping
  Given a Pomodoro break timer is running (auto-break after work)
  When the break timer reaches zero
  Then the Pomodoro resets to work mode (stopped)
  And the timer display shows the preset work duration
  And no new break starts
  And the timer is not running
```

### Timer Accuracy After Tab Switch

```
TS-12: Pomodoro time is correct after tab refocus
  Given a Pomodoro timer is running with 5 minutes remaining
  And the user switches to another tab for 2 minutes
  When the user returns to the tab
  Then the displayed remaining time is approximately 3 minutes (within 1 second)

TS-13: Break pane time is correct after tab refocus
  Given a break pane timer is running with 10 minutes remaining
  And the user switches to another tab for 3 minutes
  When the user returns to the tab
  Then the displayed remaining time is approximately 7 minutes (within 1 second)

TS-14: Progress bar reflects correct proportion after refocus
  Given a Pomodoro timer is running with a 10-minute total duration
  And 6 minutes have elapsed (4 minutes remain)
  When the user returns to the tab after being away
  Then the progress bar shows approximately 60% completion
```

### Mutual Exclusion

```
TS-15: Break activity blocked while Pomodoro work is running
  Given a Pomodoro work timer is running
  When the user clicks a break activity icon
  Then a warning modal appears with text "Stop the current Pomodoro before starting a break."
  And no break timer starts

TS-16: Break activity allowed during Pomodoro auto-break
  Given a Pomodoro timer is in break mode (auto-break after work)
  When the user clicks a break activity icon
  Then the break overlay opens
  And the break pane timer starts

TS-17: Break activity allowed when Pomodoro is stopped
  Given the Pomodoro timer is stopped
  When the user clicks a break activity icon
  Then the break overlay opens
  And the break pane timer starts
```

### Sound Deduplication

```
TS-18: Single sound per expiry event
  Given a timer expires
  And both the heartbeat handler and a visibility change event detect the expiry
  When both attempt to play the bell sound
  Then exactly one bell sound is audible (dedup window prevents double-play)

TS-19: Sound test button bypasses dedup
  Given a timer alert sound just played
  When the user clicks the sound test button in settings within 3 seconds
  Then the bell sound plays again
```

### Web Audio API

```
TS-20: AudioContext is used for playback
  Given the playNotification function is called
  When it plays the bell sound
  Then it uses AudioContext (Web Audio API), not HTMLAudioElement.play()

TS-21: AudioContext is created on user gesture
  Given no AudioContext exists
  When the user clicks the Pomodoro Start button
  Then an AudioContext is created or resumed

TS-22: visibilitychange resumes suspended AudioContext
  Given an AudioContext exists but is suspended
  When the tab becomes visible
  Then the AudioContext is resumed
  And any pending alarm sound plays

TS-27: Suspended AudioContext recovery plays pending alarm
  Given a timer expired while the AudioContext was suspended
  When the tab becomes visible and the AudioContext resumes
  Then the bell sound plays
```

### Infrastructure

```
TS-23: Timer survives React StrictMode double-mount
  Given React StrictMode is enabled (dev mode)
  When the component mounts, unmounts, and remounts
  Then the heartbeat Worker continues ticking
  And running timers continue counting down correctly

TS-24: endTime is persisted to localStorage
  Given a Pomodoro timer is started
  When the timer state is saved to localStorage
  Then the saved object contains an endTime field with a numeric timestamp

TS-25: Both work and break expired on page reload
  Given a Pomodoro work timer was running
  And both the work phase and auto-break have expired (e.g., user closed browser 2 hours ago)
  When the user reopens the page
  Then one bell sound plays
  And the timer shows work mode, stopped
```

### Edge Cases

```
TS-26: No sound when bell is disabled
  Given bellEnabled is set to false
  When any timer expires
  Then no sound plays

TS-28: Audio file load failure is handled gracefully
  Given the bell audio file fails to load
  When a timer expires
  Then an error is logged
  And the app does not crash
```

## Traceability

Every acceptance criterion (AC-1.1 through AC-6.2), constraint (C-1 through C-8), and edge case (EC-1 through EC-7) from the behavioral specification is covered by at least one test scenario. No orphan tests exist — every scenario traces back to a spec requirement.
