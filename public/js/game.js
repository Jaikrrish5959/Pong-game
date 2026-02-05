/**
 * Game Renderer - HTML5 Canvas rendering for the Pong game
 */

class GameRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.arenaSize = 800;
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;

        // Visual settings
        this.colors = {
            background: '#0a0a1a',
            arena: '#12122a',
            ball: '#ffffff',
            ballGlow: '#00f0ff',
            paddles: {
                left: '#00f0ff',
                right: '#ff00aa',
                top: '#ffcc00',
                bottom: '#00ff88'
            },
            grid: 'rgba(255, 255, 255, 0.03)',
            border: 'rgba(255, 255, 255, 0.2)'
        };

        // State
        this.gameState = null;
        this.interpolatedBall = { x: 400, y: 400 };
        this.lastServerState = null;
        this.animationFrame = null;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth - 20;
        const containerHeight = container.clientHeight - 20;

        // Calculate scale to fit arena
        this.scale = Math.min(containerWidth / this.arenaSize, containerHeight / this.arenaSize);

        // Set canvas size
        this.canvas.width = this.arenaSize * this.scale;
        this.canvas.height = this.arenaSize * this.scale;

        // Center offset (arena is always square)
        this.offsetX = 0;
        this.offsetY = 0;
    }

    updateState(state) {
        this.lastServerState = this.gameState;
        this.gameState = state;
    }

    startRenderLoop() {
        const render = () => {
            this.render();
            this.animationFrame = requestAnimationFrame(render);
        };
        render();
    }

    stopRenderLoop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    render() {
        if (!this.gameState) return;

        const ctx = this.ctx;
        const s = this.scale;

        // Clear canvas
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw arena background
        ctx.fillStyle = this.colors.arena;
        ctx.fillRect(15 * s, 15 * s, 770 * s, 770 * s);

        // Draw grid pattern
        this.drawGrid(ctx, s);

        // Draw arena border
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2 * s;
        ctx.strokeRect(15 * s, 15 * s, 770 * s, 770 * s);

        // Draw center line
        ctx.setLineDash([10 * s, 10 * s]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(400 * s, 20 * s);
        ctx.lineTo(400 * s, 780 * s);
        ctx.moveTo(20 * s, 400 * s);
        ctx.lineTo(780 * s, 400 * s);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw paddles
        this.drawPaddles(ctx, s);

        // Draw ball with interpolation
        this.drawBall(ctx, s);
    }

    drawGrid(ctx, s) {
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;

        const gridSize = 40;
        for (let x = 15; x <= 785; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x * s, 15 * s);
            ctx.lineTo(x * s, 785 * s);
            ctx.stroke();
        }
        for (let y = 15; y <= 785; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(15 * s, y * s);
            ctx.lineTo(785 * s, y * s);
            ctx.stroke();
        }
    }

    drawPaddles(ctx, s) {
        const paddles = this.gameState.paddles;

        for (const [position, paddle] of Object.entries(paddles)) {
            if (!paddle) continue;

            const color = this.colors.paddles[position] || '#ffffff';

            // Draw glow
            ctx.shadowColor = color;
            ctx.shadowBlur = 15 * s;

            // Draw paddle
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(
                paddle.x * s,
                paddle.y * s,
                paddle.width * s,
                paddle.height * s,
                5 * s
            );
            ctx.fill();

            // Reset shadow
            ctx.shadowBlur = 0;
        }
    }

    drawBall(ctx, s) {
        const ball = this.gameState.ball;

        // Interpolate ball position for smooth rendering
        this.interpolatedBall.x += (ball.x - this.interpolatedBall.x) * 0.3;
        this.interpolatedBall.y += (ball.y - this.interpolatedBall.y) * 0.3;

        const x = this.interpolatedBall.x * s;
        const y = this.interpolatedBall.y * s;
        const radius = 10 * s;

        // Draw outer glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
        gradient.addColorStop(0, this.colors.ballGlow);
        gradient.addColorStop(0.3, 'rgba(0, 240, 255, 0.3)');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw ball
        ctx.shadowColor = this.colors.ballGlow;
        ctx.shadowBlur = 20 * s;
        ctx.fillStyle = this.colors.ball;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
    }

    resetInterpolation() {
        if (this.gameState && this.gameState.ball) {
            this.interpolatedBall.x = this.gameState.ball.x;
            this.interpolatedBall.y = this.gameState.ball.y;
        }
    }
}

// Export as global
window.GameRenderer = GameRenderer;
