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

Located at top of script in CONFIG object:
- `verbosity`: 0=none, 1=minimal, 2=detailed, 3=debug spam
- `minDurationSeconds`: Only notify if generation takes longer than this
- `onlyIfNotInFocus`: Only show notifications when tab not active
- `enabledNotificationModes`: Array of ['desktop_notif', 'bell']

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

**Key State Transitions to Monitor:**
- 🚀 AI generation started (Run → Stop button)
- ✅ AI generation completed (Stop → Run button)
- 🔔 Showing notifications (after completion + duration check)

