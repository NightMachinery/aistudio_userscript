# Post-Task Checklist

- Sanity check syntax: open `ai-studio-notification.user.js` and ensure no obvious errors.
- Manual test: install/update in Tampermonkey, open https://aistudio.google.com/, run a prompt, confirm notifications/alerts.
- Permissions: ensure Notification permission is granted; test audio and speech.
- Logging: set `CONFIG.verbosity = 3` and verify state transitions and timings in console.
- No formal lints/tests configured; keep changes minimal and focused. Revert if regressions observed.