# Project Overview

- Purpose: Userscript to add desktop/audio notifications when AI generation completes in Google AI Studio.
- Scope: Detect Run/Stop state transitions, measure run duration, and trigger configurable notification modes.
- Tech Stack: Plain JavaScript (Tampermonkey/Greasemonkey userscript), Web APIs (MutationObserver, Notification, Web Audio, SpeechSynthesis).
- Runtime: Browser (installed as a userscript via Tampermonkey/Greasemonkey). No build system.
- Repo Highlights: Single main script `ai-studio-notification.user.js`; docs in `CLAUDE.md` and `AGENTS.md`.
- Platform: macOS (Darwin).