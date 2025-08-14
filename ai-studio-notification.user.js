// ==UserScript==
// @name         AI Studio Response Notifications
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Show notifications when AI Studio finishes responding
// @author       You
// @match        https://aistudio.google.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ============ CONFIGURATION ============
    const CONFIG = {
        verbosity: 1,                                    // 0=none, 1=minimal, 2=detailed, 3=very detailed
        onlyIfNotInFocus: false,                         // Only show notification if tab is not in focus
        // Notification modes based on minimum duration thresholds
        // Format: { durationSeconds: ['mode1', 'mode2', {speech: 'text'}] }
        // Available modes: 'desktop_notif', 'bell', {speech: 'text to speak'}
        notificationModesByDuration: {
            0: ['bell', {speech: 'Gemini Ready!'}],
            10: ['bell', 'desktop_notif'],
        }
    };

    // ============ GLOBALS ============
    let isGenerating = false;
    let observer;
    let checkCount = 0;
    let generationStartTime = null;

    // ============ LOGGING ============
    function log(level, message) {
        if (CONFIG.verbosity >= level) {
            console.log(`[AI Studio Notification] ${message}`);
        }
    }

    log(1, 'Script loaded');

    // Request notification permission on load
    log(2, `Current notification permission: ${Notification.permission}`);
    if (Notification.permission === 'default') {
        log(2, 'Requesting notification permission');
        Notification.requestPermission().then(permission => {
            log(2, `Permission result: ${permission}`);
        });
    }

    // ============ NOTIFICATION FUNCTIONS ============
    function getNotificationModesForDuration(durationSeconds) {
        // Find the exact duration threshold that matches
        const thresholds = Object.keys(CONFIG.notificationModesByDuration)
            .map(Number)
            .sort((a, b) => b - a); // Sort descending
        
        for (const threshold of thresholds) {
            if (durationSeconds >= threshold) {
                log(2, `Duration ${durationSeconds.toFixed(1)}s matches threshold ${threshold}s`);
                return CONFIG.notificationModesByDuration[threshold];
            }
        }
        
        // If no threshold matches, return empty array (no notifications)
        log(2, `Duration ${durationSeconds.toFixed(1)}s matches no thresholds`);
        return [];
    }

    function shouldShowNotification(durationSeconds) {
        // Check if tab is in focus (only show if not in focus when configured)
        if (CONFIG.onlyIfNotInFocus && document.hasFocus()) {
            log(2, 'Not showing notification: tab is in focus');
            return { show: false, modes: [] };
        }

        // Get notification modes for this duration
        const modes = getNotificationModesForDuration(durationSeconds);
        
        if (modes.length === 0) {
            log(2, 'Not showing notification: no modes configured for this duration');
            return { show: false, modes: [] };
        }

        return { show: true, modes };
    }

    function playNotificationSound() {
        try {
            // Create a simple beep sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            
            log(2, 'Bell notification played');
        } catch (error) {
            log(1, `Error playing sound: ${error.message}`);
        }
    }

    function playSpeechNotification(text) {
        try {
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.volume = 1.0;
                utterance.rate = 1.2;
                utterance.pitch = 1.0;
                speechSynthesis.speak(utterance);
                log(2, `Speech notification spoken: "${text}"`);
            } else {
                log(1, 'Speech synthesis not supported in this browser');
            }
        } catch (error) {
            log(1, `Error playing speech: ${error.message}`);
        }
    }

    function showDesktopNotification() {
        if (Notification.permission === 'granted') {
            log(2, 'Creating desktop notification');
            try {
                const notification = new Notification('AI Studio Response Complete', {
                    body: 'The AI model has finished responding',
                    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjNEY5NkZGIi8+Cjwvc3ZnPgo=',
                    requireInteraction: false,
                    silent: false
                });
                log(2, 'Desktop notification created successfully');
            } catch (error) {
                log(1, `Error creating desktop notification: ${error.message}`);
            }
        } else {
            log(2, 'Cannot show desktop notification: permission not granted');
        }
    }

    function showNotification(durationSeconds) {
        log(2, `showNotification called, permission: ${Notification.permission}`);
        
        const { show, modes } = shouldShowNotification(durationSeconds);
        if (!show) {
            return;
        }

        const modeDescriptions = modes.map(mode => 
            typeof mode === 'object' && mode.speech ? `speech:"${mode.speech}"` : mode
        );
        log(1, `🔔 Showing notifications for duration ${durationSeconds.toFixed(1)}s: [${modeDescriptions.join(', ')}]`);
        
        modes.forEach(mode => {
            if (mode === 'desktop_notif') {
                showDesktopNotification();
            } else if (mode === 'bell') {
                playNotificationSound();
            } else if (typeof mode === 'object' && mode.speech) {
                playSpeechNotification(mode.speech);
            } else {
                log(1, `Unknown notification mode: ${JSON.stringify(mode)}`);
            }
        });
    }

    // ============ STATE MONITORING ============
    function checkResponseState() {
        checkCount++;
        log(3, `Check #${checkCount} - Current state: isGenerating=${isGenerating}`);

        // Look for all buttons and log them
        const allButtons = Array.from(document.querySelectorAll('button'));
        log(3, `Found ${allButtons.length} buttons`);

        // Look for buttons with "Run" or "Stop" text
        const runButtons = allButtons.filter(btn => {
            const text = btn.textContent.trim();
            const hasRun = text.includes('Run') || text === 'Run';
            const hasStop = text.includes('Stop') || text === 'Stop';
            if (hasRun || hasStop) {
                log(3, `Found button: "${text}", disabled: ${btn.disabled}`);
            }
            return hasRun || hasStop;
        });

        log(3, `Found ${runButtons.length} Run/Stop buttons`);

        // Check for Stop button (indicates generating)
        const stopButton = allButtons.find(btn => {
            const text = btn.textContent.trim();
            return text === 'Stop' || text.includes('Stop');
        });

        // EXPLICIT DEBUG - test the exact same variable
        log(3, `Stop button found: ${stopButton ? 'YES' : 'NO'}`);
        log(3, `stopButton === undefined: ${stopButton === undefined}`);
        log(3, `stopButton === null: ${stopButton === null}`);
        log(3, `stopButton !== null: ${stopButton !== null}`);
        log(3, `typeof stopButton: ${typeof stopButton}`);
        
        // Test with a fresh variable to rule out scoping issues
        const testVar = stopButton;
        log(3, `testVar !== null: ${testVar !== null}`);
        
        if (stopButton) {
            log(3, `Stop button text: "${stopButton.textContent.trim()}"`);
        }

        // Check for disabled Run button (indicates completion)
        const disabledRunButton = allButtons.find(btn => {
            const text = btn.textContent.trim();
            return (text === 'Run' || text.includes('Run')) && btn.disabled;
        });

        log(3, `Disabled Run button found: ${disabledRunButton ? 'YES' : 'NO'}`);

        // Logic: AI is generating when button text shows "Stop" (stopButton exists)
        // AI finished when no Stop button found (stopButton is undefined)
        const currentlyGenerating = stopButton !== undefined;
        log(3, `currentlyGenerating variable: ${currentlyGenerating}`);
        
        // Log button states more clearly
        runButtons.forEach((btn, index) => {
            log(3, `Button ${index}: text="${btn.textContent.trim()}", disabled=${btn.disabled}`);
        });
        
        log(3, `Final result - Currently generating: ${currentlyGenerating}`);

        // Handle state transitions
        if (!isGenerating && currentlyGenerating) {
            // Started generating
            generationStartTime = Date.now();
            log(1, '🚀 AI generation started');
        } else if (isGenerating && !currentlyGenerating) {
            // Finished generating
            const duration = generationStartTime ? (Date.now() - generationStartTime) / 1000 : 0;
            log(1, `✅ AI generation completed in ${duration.toFixed(1)}s`);
            showNotification(duration);
        }

        isGenerating = currentlyGenerating;
        log(3, `Updated isGenerating to: ${isGenerating}`);
    }

    // ============ MONITORING SETUP ============
    function startMonitoring() {
        const configuredThresholds = Object.keys(CONFIG.notificationModesByDuration).sort((a, b) => Number(a) - Number(b));
        log(1, `Starting monitoring with config: verbosity=${CONFIG.verbosity}, onlyIfNotInFocus=${CONFIG.onlyIfNotInFocus}, thresholds=${configuredThresholds.join('s, ')}s`);
        
        // Reset state on startup
        isGenerating = false;
        generationStartTime = null;
        log(1, 'Reset state to initial values');
        
        // Check state every 500ms
        const intervalId = setInterval(checkResponseState, 500);
        log(2, `Interval started with ID: ${intervalId}`);

        // Also use MutationObserver for more responsive detection
        observer = new MutationObserver((mutations) => {
            log(3, `MutationObserver triggered with ${mutations.length} mutations`);
            let shouldCheck = false;
            mutations.forEach((mutation, index) => {
                log(3, `Mutation ${index}: type=${mutation.type}, target=${mutation.target.tagName}, attribute=${mutation.attributeName}`);
                // Check if any button text or disabled state changed
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'disabled' || mutation.attributeName === 'aria-label')) {
                    shouldCheck = true;
                    log(3, 'Should check due to attribute change');
                }
                // Check if any text content changed (button text changing from Run to Stop)
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    shouldCheck = true;
                    log(3, 'Should check due to content change');
                }
            });

            if (shouldCheck) {
                log(3, 'Triggering state check from MutationObserver');
                setTimeout(checkResponseState, 100); // Small delay to ensure DOM is updated
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['disabled', 'aria-label'],
            characterData: true
        });

        log(2, 'MutationObserver started');
        log(1, 'Monitor started successfully');
    }

    // Wait for page to load, then start monitoring
    log(2, `Document readyState: ${document.readyState}`);
    if (document.readyState === 'loading') {
        log(2, 'Waiting for DOMContentLoaded');
        document.addEventListener('DOMContentLoaded', () => {
            log(2, 'DOMContentLoaded fired');
            startMonitoring();
        });
    } else {
        log(2, 'Document already loaded, starting immediately');
        startMonitoring();
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        log(2, 'Page unloading, cleaning up');
        if (observer) {
            observer.disconnect();
        }
    });

})();
