# Timer Audio Alerts - Behavioral Specification

## Objective

Pomodoro and break timers must reliably play an audible alert sound the moment they expire, regardless of whether the browser tab is focused, backgrounded, or was closed and reopened. The current implementation silently fails to play sounds because it uses `HTMLAudioElement.play()` which browsers block in inactive tabs, and `setInterval` which browsers throttle in background tabs.

## User Stories & Acceptance Criteria

### US-1: As a user, I want to hear an alert sound when my Pomodoro work phase ends, so that I know it's time to take a break.

- AC-1.1: When the Pomodoro work timer reaches zero while the tab is focused, an audible bell sound plays within 1 second.
- AC-1.2: When the Pomodoro work timer reaches zero while the tab is in the background (user is on another tab), an audible bell sound plays within 2 seconds.
- AC-1.3: When the Pomodoro work timer reaches zero while the browser window was closed and reopened, an audible bell sound plays within 2 seconds of page load.
- AC-1.4: After the work phase alert plays, the Pomodoro automatically transitions to break mode and a break countdown begins.

### US-2: As a user, I want to hear an alert sound when my Pomodoro break phase ends, so that I know it's time to resume work.

- AC-2.1: When the Pomodoro break timer reaches zero (focused tab), an audible bell sound plays within 1 second.
- AC-2.2: When the Pomodoro break timer reaches zero (background tab), an audible bell sound plays within 2 seconds.
- AC-2.3: When the Pomodoro break timer reaches zero (page reload after expiry), an audible bell sound plays within 2 seconds of page load.
- AC-2.4: After the break phase ends, the timer resets to work mode (stopped, showing the preset work duration). The break does NOT restart.

### US-3: As a user, I want to hear an alert sound when my break pane timer ends, so that I know my break activity is over.

- AC-3.1: When the break pane timer reaches zero (focused tab), an audible bell sound plays within 1 second.
- AC-3.2: When the break pane timer reaches zero (background tab), an audible bell sound plays within 2 seconds.
- AC-3.3: When the break pane timer reaches zero (page reload after expiry), an audible bell sound plays within 2 seconds of page load.

### US-4: As a user, I want timers to continue counting down accurately when the tab is in the background, so that the progress bar and time display are correct when I return.

- AC-4.1: When a running Pomodoro timer's tab loses focus and regains focus, the displayed remaining time is correct to within 1 second of the actual elapsed time.
- AC-4.2: When a running break pane timer's tab loses focus and regains focus, the displayed remaining time is correct to within 1 second.
- AC-4.3: Progress bars reflect the correct elapsed proportion after tab refocus.

### US-5: As a user, I want to be prevented from starting a break pane timer while a Pomodoro work phase is running, so that I don't lose track of my work session.

- AC-5.1: Clicking a break activity icon while the Pomodoro work timer is running shows a warning modal with the message "Stop the current Pomodoro before starting a break."
- AC-5.2: Clicking a break activity icon while the Pomodoro is in break mode (auto-break after work) is allowed.
- AC-5.3: Clicking a break activity icon while the Pomodoro is stopped is allowed.

### US-6: As a user, I want only one alert sound per timer expiry event, so that I am not bombarded with repeated sounds.

- AC-6.1: When a timer expires, exactly one bell sound plays. Multiple triggers for the same expiry event (e.g., heartbeat tick + visibility change) do not produce multiple sounds.
- AC-6.2: The sound test button in settings always plays the sound regardless of the dedup window.

## Constraints

### Technical
- C-1: Audio must use the Web Audio API (`AudioContext`) rather than `HTMLAudioElement.play()`. Browsers allow `AudioContext` playback in background tabs when the context was unlocked by a prior user gesture.
- C-2: The `AudioContext` must be created or resumed on a user gesture (e.g., clicking Start or a break activity) to comply with browser autoplay policies.
- C-3: A `visibilitychange` event handler must resume a suspended `AudioContext` when the tab regains focus and play any pending alarm.
- C-4: Timer countdown must use absolute timestamps (`Date.now()` or `endTime`) rather than decrementing counters, to survive background tab throttling.
- C-5: Timer ticks must originate from a Web Worker (not the main thread) to avoid browser throttling of `setInterval` in background tabs.
- C-6: The Web Worker must be stateless (a simple heartbeat pulse) so that React StrictMode double-mounting does not break timer state.
- C-7: The existing bell sound file (`audio/notification-bell.mp3`) must be loaded into an `AudioBuffer` for Web Audio API playback.
- C-8: Timer state (`endTime`) must be persisted to `localStorage` so timers survive page refresh.

### Compatibility
- C-9: Must work in Chrome, Firefox, and Safari on desktop.
- C-10: Late sound playback (up to 1 hour after expiry) on page reopen is acceptable. No sound is NOT acceptable.

## Edge Cases

- EC-1: User starts a Pomodoro, closes the browser, reopens the page 2 hours later. The work phase and auto-break have both expired. One bell sound plays. Timer shows work mode, stopped.
- EC-2: User starts a break pane timer, switches to another tab for 30 minutes. The break expired 25 minutes ago. Bell plays immediately (background) or within 2 seconds of tab refocus.
- EC-3: User has `bellEnabled` set to false. No sound plays for any timer expiry.
- EC-4: User starts a Pomodoro and a break pane timer would overlap. The break pane click is blocked with a warning (AC-5.1).
- EC-5: User rapidly clicks the sound test button. Each click plays the sound (bypasses dedup).
- EC-6: `AudioContext` is suspended by the browser (e.g., Safari after extended background). On visibility change, the context is resumed and the pending alarm plays.
- EC-7: The audio file fails to load (network error, missing file). `playNotification` logs an error but does not crash the app.

## Non-Goals

- NG-1: This feature does NOT implement the Notifications API (desktop notifications). That is a separate future enhancement.
- NG-2: This feature does NOT change the bell sound file or add new sounds.
- NG-3: This feature does NOT add visual indicators (flashing title, favicon badge) for timer expiry.
- NG-4: This feature does NOT support iOS Safari background audio (iOS suspends all tab activity including Workers).

## Open Questions

None — all requirements clarified during debugging sessions.
