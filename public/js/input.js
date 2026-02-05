/**
 * Input Handler - State-based continuous movement
 * 
 * KEY FIX: Uses state flags that persist while key is held.
 * Sends input state to server on every change AND on animation frame.
 */

class InputHandler {
    constructor() {
        // Input state - persists while key is held
        this.inputState = {
            up: false,
            down: false,
            left: false,
            right: false
        };

        this.position = null;
        this.onInputChange = null;
        this.isHorizontal = false;
        this.lastSentState = null;
        this.lastSentState = null;

        // Key mappings - primary and secondary keys for each direction
        this.keyMappings = {
            up: ['w', 'W', 'ArrowUp'],
            down: ['s', 'S', 'ArrowDown'],
            left: ['a', 'A', 'ArrowLeft'],
            right: ['d', 'D', 'ArrowRight']
        };

        this.init();
    }

    init() {
        // Keyboard events - set/clear state flags
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Touch controls
        this.setupTouchControls();

        // Continuously send input state at 60Hz for smooth movement
        // Network optimization: Event-based input only
        // this.startInputLoop();
    }

    setPosition(position) {
        this.position = position;
        this.isHorizontal = position === 'top' || position === 'bottom';
    }

    setInputCallback(callback) {
        this.onInputChange = callback;
    }

    handleKeyDown(event) {
        // Check which direction this key maps to
        let stateChanged = false;

        for (const [direction, keys] of Object.entries(this.keyMappings)) {
            if (keys.includes(event.key)) {
                if (!this.inputState[direction]) {
                    this.inputState[direction] = true;
                    stateChanged = true;
                }
                // Prevent default for game keys
                event.preventDefault();
                break;
            }
        }

        // Send immediately on state change for responsiveness
        if (stateChanged) {
            this.sendInputState();
        }
    }

    handleKeyUp(event) {
        let stateChanged = false;

        for (const [direction, keys] of Object.entries(this.keyMappings)) {
            if (keys.includes(event.key)) {
                if (this.inputState[direction]) {
                    this.inputState[direction] = false;
                    stateChanged = true;
                }
                break;
            }
        }

        if (stateChanged) {
            this.sendInputState();
        }
    }

    startInputLoop() {
        // Disabled for LAN optimization - using event-based only
    }

    stopInputLoop() {
        if (this.sendInterval) {
            clearInterval(this.sendInterval);
            this.sendInterval = null;
        }
    }

    hasActiveInput() {
        return this.inputState.up || this.inputState.down ||
            this.inputState.left || this.inputState.right;
    }

    sendInputState() {
        if (!this.onInputChange || !this.position) return;

        // Convert to direction based on paddle position
        let direction = 'stop';

        if (this.isHorizontal) {
            // Horizontal paddle (top/bottom) - left/right movement
            if (this.inputState.left || this.inputState.up) {
                direction = 'left';
            }
            if (this.inputState.right || this.inputState.down) {
                if (direction === 'left') {
                    direction = 'stop'; // Both pressed = stop
                } else {
                    direction = 'right';
                }
            }
        } else {
            // Vertical paddle (left/right) - up/down movement
            if (this.inputState.up) {
                direction = 'up';
            }
            if (this.inputState.down) {
                if (direction === 'up') {
                    direction = 'stop';
                } else {
                    direction = 'down';
                }
            }
        }

        // Always send to ensure server has current state
        this.onInputChange({
            direction: direction,
            timestamp: Date.now()
        });
    }

    setupTouchControls() {
        const touchUp = document.getElementById('touch-up');
        const touchDown = document.getElementById('touch-down');

        if (touchUp) {
            // Touch start - set state
            touchUp.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.inputState.up = true;
                this.sendInputState();
            });
            // Touch end - clear state
            touchUp.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.inputState.up = false;
                this.sendInputState();
            });
            touchUp.addEventListener('touchcancel', (e) => {
                this.inputState.up = false;
                this.sendInputState();
            });
            // Mouse fallback
            touchUp.addEventListener('mousedown', () => {
                this.inputState.up = true;
                this.sendInputState();
            });
            touchUp.addEventListener('mouseup', () => {
                this.inputState.up = false;
                this.sendInputState();
            });
            touchUp.addEventListener('mouseleave', () => {
                if (this.inputState.up) {
                    this.inputState.up = false;
                    this.sendInputState();
                }
            });
        }

        if (touchDown) {
            touchDown.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.inputState.down = true;
                this.sendInputState();
            });
            touchDown.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.inputState.down = false;
                this.sendInputState();
            });
            touchDown.addEventListener('touchcancel', (e) => {
                this.inputState.down = false;
                this.sendInputState();
            });
            touchDown.addEventListener('mousedown', () => {
                this.inputState.down = true;
                this.sendInputState();
            });
            touchDown.addEventListener('mouseup', () => {
                this.inputState.down = false;
                this.sendInputState();
            });
            touchDown.addEventListener('mouseleave', () => {
                if (this.inputState.down) {
                    this.inputState.down = false;
                    this.sendInputState();
                }
            });
        }
    }

    reset() {
        this.inputState = { up: false, down: false, left: false, right: false };
        this.sendInputState();
    }

    destroy() {
        this.stopInputLoop();
    }
}

window.InputHandler = InputHandler;
