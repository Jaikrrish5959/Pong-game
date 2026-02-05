/**
 * GameLoop - Server-authoritative physics and game logic
 * 
 * KEY FIX: Stores player input states and applies movement every tick
 * for smooth continuous movement while keys are held.
 */

const AIController = require('./AIController');

class GameLoop {
    constructor(room) {
        this.room = room;
        this.arenaSize = 800;
        this.ballRadius = 10;
        this.paddleSpeed = 8; // Increased for better responsiveness
        this.winScore = 10;
        this.tickRate = 60; // Increased to 60 Hz for smoother movement
        this.tickInterval = 1000 / this.tickRate;
        this.intervalId = null;

        // Game state
        this.ball = { x: 400, y: 400, vx: 0, vy: 0 };
        this.paddles = {};
        this.scores = {};
        this.gameState = 'waiting';
        this.lastTouchedBy = null;

        // Player input states - KEY FIX: stored per player, applied every tick
        this.playerInputs = {}; // playerId -> { direction: 'up'|'down'|'left'|'right'|'stop' }

        // AI controllers
        this.aiControllers = {};

        this.initializePaddles();
    }

    initializePaddles() {
        const positions = this.getActivePositions();
        const paddleSize = { width: 100, height: 15 };
        const paddleSizeV = { width: 15, height: 100 };

        positions.forEach(pos => {
            switch (pos) {
                case 'left':
                    this.paddles[pos] = { x: 15, y: 350, ...paddleSizeV };
                    break;
                case 'right':
                    this.paddles[pos] = { x: 770, y: 350, ...paddleSizeV };
                    break;
                case 'top':
                    this.paddles[pos] = { x: 350, y: 15, ...paddleSize };
                    break;
                case 'bottom':
                    this.paddles[pos] = { x: 350, y: 770, ...paddleSize };
                    break;
            }
            this.scores[pos] = 0;
        });
    }

    getActivePositions() {
        switch (this.room.config.playerCount) {
            case 2: return ['left', 'right'];
            case 3: return ['left', 'right', 'top'];
            case 4: return ['left', 'right', 'top', 'bottom'];
            default: return ['left', 'right'];
        }
    }

    setupAI() {
        const positions = this.getActivePositions();
        positions.forEach(pos => {
            const player = this.room.getPlayerAtPosition(pos);
            if (!player || player.isAI) {
                this.aiControllers[pos] = new AIController(pos, this.room.config.aiDifficulty || 'medium');
            }
        });
    }

    start() {
        this.gameState = 'playing';
        this.setupAI();
        this.resetBall();

        // Clear any existing interval
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        this.intervalId = setInterval(() => {
            this.tick();
        }, this.tickInterval);

        console.log(`Game started with ${this.tickRate}Hz tick rate`);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.gameState = 'ended';
    }

    pause() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.gameState = 'paused';
    }

    resume() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.intervalId = setInterval(() => {
                this.tick();
            }, this.tickInterval);
        }
    }

    resetBall() {
        this.ball.x = this.arenaSize / 2;
        this.ball.y = this.arenaSize / 2;

        const angle = (Math.random() * Math.PI / 2) - Math.PI / 4;
        const direction = Math.random() > 0.5 ? 1 : -1;
        // Increased initial speed for faster gameplay
        const speed = 9;

        this.ball.vx = speed * direction * Math.cos(angle);
        this.ball.vy = speed * Math.sin(angle);
        this.lastTouchedBy = null;
    }

    tick() {
        if (this.gameState !== 'playing') return;

        // KEY FIX: Apply stored input states every tick
        this.applyPlayerInputs();

        // Update AI paddles
        this.updateAI();

        // Update ball
        this.updateBall();

        // Collisions
        this.checkPaddleCollisions();
        this.checkWallCollisions();

        // Scoring
        this.checkScoring();

        // Broadcast state
        this.broadcastState();
    }

    /**
     * KEY FIX: Apply stored input states for continuous movement
     */
    applyPlayerInputs() {
        for (const [playerId, inputState] of Object.entries(this.playerInputs)) {
            const player = this.room.players.get(playerId);
            if (!player || player.isAI) continue;

            const paddle = this.paddles[player.position];
            if (!paddle) continue;

            const isHorizontal = player.position === 'top' || player.position === 'bottom';
            const minBound = 30;
            const maxBound = this.arenaSize - 30;

            if (isHorizontal) {
                // Horizontal paddle
                if (inputState.direction === 'left') {
                    paddle.x = Math.max(minBound, paddle.x - this.paddleSpeed);
                } else if (inputState.direction === 'right') {
                    paddle.x = Math.min(maxBound - paddle.width, paddle.x + this.paddleSpeed);
                }
            } else {
                // Vertical paddle
                if (inputState.direction === 'up') {
                    paddle.y = Math.max(minBound, paddle.y - this.paddleSpeed);
                } else if (inputState.direction === 'down') {
                    paddle.y = Math.min(maxBound - paddle.height, paddle.y + this.paddleSpeed);
                }
            }
        }
    }

    /**
     * Called when player sends input - stores state for continuous application
     */
    handleInput(playerId, direction) {
        this.playerInputs[playerId] = { direction: direction };
    }

    updateAI() {
        for (const [pos, ai] of Object.entries(this.aiControllers)) {
            const paddle = this.paddles[pos];
            if (!paddle) continue;

            const movement = ai.update(paddle, this.ball, this.arenaSize);
            if (movement.x !== undefined) paddle.x = movement.x;
            if (movement.y !== undefined) paddle.y = movement.y;
        }
    }

    updateBall() {
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;
    }

    checkPaddleCollisions() {
        const positions = this.getActivePositions();

        for (const pos of positions) {
            const paddle = this.paddles[pos];
            if (!paddle) continue;

            let hit = false;

            switch (pos) {
                case 'bottom':
                    if (this.ball.y + this.ballRadius >= paddle.y &&
                        this.ball.y - this.ballRadius <= paddle.y + paddle.height &&
                        this.ball.x >= paddle.x && this.ball.x <= paddle.x + paddle.width &&
                        this.ball.vy > 0) {
                        this.ball.vy = -Math.abs(this.ball.vy);
                        this.addSpin(paddle, true);
                        hit = true;
                    }
                    break;
                case 'top':
                    if (this.ball.y - this.ballRadius <= paddle.y + paddle.height &&
                        this.ball.y + this.ballRadius >= paddle.y &&
                        this.ball.x >= paddle.x && this.ball.x <= paddle.x + paddle.width &&
                        this.ball.vy < 0) {
                        this.ball.vy = Math.abs(this.ball.vy);
                        this.addSpin(paddle, true);
                        hit = true;
                    }
                    break;
                case 'left':
                    if (this.ball.x - this.ballRadius <= paddle.x + paddle.width &&
                        this.ball.x + this.ballRadius >= paddle.x &&
                        this.ball.y >= paddle.y && this.ball.y <= paddle.y + paddle.height &&
                        this.ball.vx < 0) {
                        this.ball.vx = Math.abs(this.ball.vx);
                        this.addSpin(paddle, false);
                        hit = true;
                    }
                    break;
                case 'right':
                    if (this.ball.x + this.ballRadius >= paddle.x &&
                        this.ball.x - this.ballRadius <= paddle.x + paddle.width &&
                        this.ball.y >= paddle.y && this.ball.y <= paddle.y + paddle.height &&
                        this.ball.vx > 0) {
                        this.ball.vx = -Math.abs(this.ball.vx);
                        this.addSpin(paddle, false);
                        hit = true;
                    }
                    break;
            }

            if (hit) {
                this.lastTouchedBy = pos;
                this.ball.vx *= 1.05; // Slightly faster acceleration
                this.ball.vy *= 1.05;
                const maxSpeed = 18; // Increased max speed cap
                this.ball.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.ball.vx));
                this.ball.vy = Math.max(-maxSpeed, Math.min(maxSpeed, this.ball.vy));
            }
        }
    }

    addSpin(paddle, isHorizontal) {
        if (isHorizontal) {
            const paddleCenter = paddle.x + paddle.width / 2;
            const hitOffset = (this.ball.x - paddleCenter) / (paddle.width / 2);
            this.ball.vx += hitOffset * 1.5;
        } else {
            const paddleCenter = paddle.y + paddle.height / 2;
            const hitOffset = (this.ball.y - paddleCenter) / (paddle.height / 2);
            this.ball.vy += hitOffset * 1.5;
        }
    }

    checkWallCollisions() {
        const positions = new Set(this.getActivePositions());

        if (!positions.has('top')) {
            if (this.ball.y - this.ballRadius <= 15) {
                this.ball.vy = Math.abs(this.ball.vy);
                this.ball.y = 15 + this.ballRadius;
            }
        }
        if (!positions.has('bottom')) {
            if (this.ball.y + this.ballRadius >= 785) {
                this.ball.vy = -Math.abs(this.ball.vy);
                this.ball.y = 785 - this.ballRadius;
            }
        }
        if (!positions.has('left')) {
            if (this.ball.x - this.ballRadius <= 15) {
                this.ball.vx = Math.abs(this.ball.vx);
                this.ball.x = 15 + this.ballRadius;
            }
        }
        if (!positions.has('right')) {
            if (this.ball.x + this.ballRadius >= 785) {
                this.ball.vx = -Math.abs(this.ball.vx);
                this.ball.x = 785 - this.ballRadius;
            }
        }
    }

    checkScoring() {
        let missedBy = null;

        if (this.ball.y > this.arenaSize + 30) {
            missedBy = 'bottom';
        } else if (this.ball.y < -30) {
            missedBy = 'top';
        } else if (this.ball.x < -30) {
            missedBy = 'left';
        } else if (this.ball.x > this.arenaSize + 30) {
            missedBy = 'right';
        }

        if (missedBy && this.scores[missedBy] !== undefined) {
            if (this.lastTouchedBy && this.lastTouchedBy !== missedBy && this.scores[this.lastTouchedBy] !== undefined) {
                this.scores[this.lastTouchedBy]++;

                if (this.scores[this.lastTouchedBy] >= this.winScore) {
                    this.gameState = 'ended';
                    this.room.endGame(this.lastTouchedBy);
                    return;
                }
            }
            this.resetBall();
        }
    }

    broadcastState() {
        const state = {
            type: 'state',
            ball: { ...this.ball },
            paddles: { ...this.paddles },
            scores: { ...this.scores },
            gameState: this.gameState,
            timestamp: Date.now()
        };

        this.room.broadcast(state);
    }

    getState() {
        return {
            ball: { ...this.ball },
            paddles: { ...this.paddles },
            scores: { ...this.scores },
            gameState: this.gameState
        };
    }
}

module.exports = GameLoop;
