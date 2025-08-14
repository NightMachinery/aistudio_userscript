# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains a userscript that provides notification functionality for Google AI Studio. The script detects when AI model responses are completed and shows desktop notifications and/or plays audio alerts.

## Architecture

### Core Components

**ai-studio-notification.user.js** - A Tampermonkey/Greasemonkey userscript with these main sections:

- **Configuration System**: CONFIG object at the top controls verbosity (0-3), minimum duration thresholds, focus detection, and notification modes
- **State Machine**: Tracks `isGenerating` state by monitoring DOM button text changes (Run ↔ Stop transitions)
- **Notification System**: Supports multiple modes - desktop notifications and audio bells using Web Audio API
- **DOM Monitoring**: Uses both MutationObserver and periodic polling to detect UI state changes

### Key Detection Logic

The script monitors Google AI Studio's Run/Stop button to determine generation state:
- **AI Generating**: When button text contains "Stop" (`stopButton !== undefined`)
- **AI Finished**: When no Stop button found and previously was generating
- **Critical**: Uses `!== undefined` comparison since `.find()` returns `undefined` when no match found

### Configuration Options

Located at the top of the script in the `CONFIG` object:
- `verbosity`: 0=none, 1=minimal, 2=detailed, 3=very detailed
- `onlyIfNotInFocus`: When true, suppress notifications while the tab has focus
- `notificationModesByDuration`: Map of minimum duration (seconds) → array of notification modes to trigger when the run lasts at least that long
  - Supported modes:
    - `desktop_notif`: Browser desktop notification (requires permission)
    - Bell names from `BELL_FUNCTIONS`: `simple-beep`, `double-beep`, `triple-beep`, `chime`
    - Bell names from embedded `BELLS`: e.g., `bell-hp3-star-pickup`
    - Speech object: `{speech: 'Text to speak'}` (uses `speechSynthesis`)
  - Example (current default):
    - `0: ['simple-beep', {speech: 'Gemini Ready!'}]`
    - `10: ['bell-hp3-star-pickup', 'desktop_notif']`

Notes:
- Desktop notifications require user permission; the script requests it on load if in `default` state.
- You can define as many thresholds as you like; the highest threshold less than or equal to the elapsed time applies.

## Common Development Tasks

**Testing the Script:**
1. Install in Tampermonkey/Greasemonkey
2. Open Google AI Studio (https://aistudio.google.com/)
3. Send a message to trigger AI response
4. Check browser console for `[AI Studio Notification]` logs

**Debugging:**
- Set `verbosity: 3` for detailed logging
- Monitor console for state transitions and button detection
- Check notification permissions in browser settings
- Adjust `notificationModesByDuration` to test different notification mixes and thresholds

**Key State Transitions to Monitor:**
- 🚀 AI generation started (Run → Stop button)
- ✅ AI generation completed (Stop → Run button)
- 🔔 Showing notifications (after completion + duration check)

## Notification Implementation Details

- **Audio:** Programmatic tones are generated via the Web Audio API (`OscillatorNode` + `GainNode`). The script also includes an embedded base64 WAV (`BELLS['bell-hp3-star-pickup']`).
- **Speech:** Uses `window.speechSynthesis` with a slightly faster rate for clarity.
- **Desktop Notifications:** Created via the `Notification` API when permission is `granted`.
