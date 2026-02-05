/**
 * AI Controller - Server-side AI paddle logic
 * Tracks ball movement and moves paddle to intercept
 */

class AIController {
    constructor(position, difficulty = 'medium') {
        this.position = position; // 'left', 'right', 'top', 'bottom'
        this.difficulty = difficulty;
        this.reactionDelay = this.getReactionDelay();
        this.frameCounter = 0;
        this.targetY = 400; // Center of arena
        this.targetX = 400;
        this.errorMargin = this.getErrorMargin();
    }

    getReactionDelay() {
        switch (this.difficulty) {
            case 'easy': return 15;
            case 'medium': return 8;
            case 'hard': return 3;
            default: return 8;
        }
    }

    getErrorMargin() {
        switch (this.difficulty) {
            case 'easy': return 60;
            case 'medium': return 30;
            case 'hard': return 10;
            default: return 30;
        }
    }

    getSpeed() {
        switch (this.difficulty) {
            case 'easy': return 4;
            case 'medium': return 6;
            case 'hard': return 8;
            default: return 6;
        }
    }

    update(paddle, ball, arenaSize) {
        this.frameCounter++;

        // Only update target every N frames (reaction delay)
        if (this.frameCounter >= this.reactionDelay) {
            this.frameCounter = 0;
            this.calculateTarget(paddle, ball, arenaSize);
        }

        // Move paddle toward target
        return this.moveTowardTarget(paddle, arenaSize);
    }

    calculateTarget(paddle, ball, arenaSize) {
        const isHorizontal = this.position === 'top' || this.position === 'bottom';
        const speed = this.getSpeed();

        if (isHorizontal) {
            // Horizontal paddle - track ball's X position
            const ballApproaching = (this.position === 'bottom' && ball.vy > 0) ||
                (this.position === 'top' && ball.vy < 0);

            if (ballApproaching) {
                // Predict where ball will be
                this.targetX = ball.x + (Math.random() - 0.5) * this.errorMargin;
            } else {
                // Return to center
                this.targetX = arenaSize / 2;
            }
        } else {
            // Vertical paddle - track ball's Y position
            const ballApproaching = (this.position === 'right' && ball.vx > 0) ||
                (this.position === 'left' && ball.vx < 0);

            if (ballApproaching) {
                // Predict where ball will be
                this.targetY = ball.y + (Math.random() - 0.5) * this.errorMargin;
            } else {
                // Return to center
                this.targetY = arenaSize / 2;
            }
        }
    }

    moveTowardTarget(paddle, arenaSize) {
        const speed = this.getSpeed();
        const isHorizontal = this.position === 'top' || this.position === 'bottom';
        let newPosition;

        if (isHorizontal) {
            const paddleCenter = paddle.x + paddle.width / 2;
            const diff = this.targetX - paddleCenter;

            if (Math.abs(diff) > speed) {
                newPosition = paddle.x + (diff > 0 ? speed : -speed);
            } else {
                newPosition = paddle.x;
            }

            // Clamp to arena bounds
            const minX = 30;
            const maxX = arenaSize - 30 - paddle.width;
            newPosition = Math.max(minX, Math.min(maxX, newPosition));

            return { x: newPosition };
        } else {
            const paddleCenter = paddle.y + paddle.height / 2;
            const diff = this.targetY - paddleCenter;

            if (Math.abs(diff) > speed) {
                newPosition = paddle.y + (diff > 0 ? speed : -speed);
            } else {
                newPosition = paddle.y;
            }

            // Clamp to arena bounds
            const minY = 30;
            const maxY = arenaSize - 30 - paddle.height;
            newPosition = Math.max(minY, Math.min(maxY, newPosition));

            return { y: newPosition };
        }
    }
}

module.exports = AIController;
