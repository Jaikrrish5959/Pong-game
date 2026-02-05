package com.ponggame.model;

import javafx.scene.shape.Rectangle;
import java.util.Random;

public class AIController {
    private Rectangle paddle;
    private Ball ball;
    private boolean isHorizontal; // true = moves left/right, false = moves up/down
    private double minPos, maxPos; // Movement bounds

    private static final double MAX_SPEED = 4.0;
    private static final double ERROR_MARGIN = 30.0;
    private static final int REACTION_DELAY = 8;

    private int frameCounter = 0;
    private double targetPos;
    private Random random = new Random();

    public AIController(Rectangle paddle, Ball ball, boolean isHorizontal, double minPos, double maxPos) {
        this.paddle = paddle;
        this.ball = ball;
        this.isHorizontal = isHorizontal;
        this.minPos = minPos;
        this.maxPos = maxPos;
        this.targetPos = isHorizontal ? paddle.getX() : paddle.getY();
    }

    public void update() {
        frameCounter++;
        if (frameCounter >= REACTION_DELAY) {
            decideTarget();
            frameCounter = 0;
        }
        movePaddle();
    }

    private void decideTarget() {
        if (ball == null)
            return;

        double error = (random.nextDouble() - 0.5) * 2 * ERROR_MARGIN;

        if (isHorizontal) {
            // Horizontal paddle (top/bottom) - track ball X
            double paddleWidth = paddle.getWidth();
            targetPos = ball.getX() - paddleWidth / 2 + error;
        } else {
            // Vertical paddle (left/right) - track ball Y
            double paddleHeight = paddle.getHeight();
            targetPos = ball.getY() - paddleHeight / 2 + error;
        }

        // Clamp to bounds
        double paddleSize = isHorizontal ? paddle.getWidth() : paddle.getHeight();
        targetPos = Math.max(minPos, Math.min(maxPos - paddleSize, targetPos));
    }

    private void movePaddle() {
        double currentPos = isHorizontal ? paddle.getX() : paddle.getY();
        double diff = targetPos - currentPos;

        double move = Math.signum(diff) * Math.min(Math.abs(diff), MAX_SPEED);

        if (isHorizontal) {
            paddle.setX(currentPos + move);
        } else {
            paddle.setY(currentPos + move);
        }
    }
}
