# Style and Conventions

- Language: Plain JavaScript targeting modern browsers (userscript context).
- Organization: CONFIG at top controls verbosity, thresholds, focus behavior, and notification modes.
- Patterns: Simple state machine (isGenerating), MutationObserver + periodic polling; strict `!== undefined` checks for DOM find results.
- Notifications: Modes include desktop notifications (`Notification` API), Web Audio beeps/chimes, optional speech synthesis.
- Logging: Console logs prefixed with `[AI Studio Notification]` with levels controlled by `verbosity` (0-3).
- No formal lint/format config is present; follow readable, consistent JS with descriptive names.