package com.ponggame.model;

import javafx.scene.shape.Circle;
import java.util.Random;

public class Ball {
    private Circle view;
    private double velocityX;
    private double velocityY;
    private double speedMultiplier = 1.5;
    private int lastTouchedPlayerId = -1; // -1 = none, 1-4 = player ID

    // Constants
    private static final double BASE_SPEED = 4.0;
    private static final double MAX_SPEED_MULTIPLIER = 2.5;

    private Random random = new Random();

    public Ball(Circle view, double width, double height) {
        this.view = view;
        reset(width, height);
    }

    public void reset(double width, double height) {
        view.setCenterX(width / 2);
        view.setCenterY(height / 2);
        speedMultiplier = 1.5;
        lastTouchedPlayerId = -1;

        // Random direction
        double angle = random.nextDouble() * 2 * Math.PI;
        velocityX = Math.cos(angle) * BASE_SPEED;
        velocityY = Math.sin(angle) * BASE_SPEED;

        // Ensure ball doesn't start moving too vertically or horizontally
        if (Math.abs(velocityX) < 2)
            velocityX = (velocityX >= 0 ? 1 : -1) * 2;
        if (Math.abs(velocityY) < 2)
            velocityY = (velocityY >= 0 ? 1 : -1) * 2;
    }

    public void update() {
        view.setCenterX(view.getCenterX() + velocityX * speedMultiplier);
        view.setCenterY(view.getCenterY() + velocityY * speedMultiplier);
        // No boundary collision - ball goes off screen to trigger scoring
    }

    public void reverseX() {
        velocityX = -velocityX;
        increaseSpeed();
    }

    public void reverseY() {
        velocityY = -velocityY;
        increaseSpeed();
    }

    public void setVelocityX(double val) {
        this.velocityX = val;
    }

    public void setVelocityY(double val) {
        this.velocityY = val;
    }

    private void increaseSpeed() {
        if (speedMultiplier < MAX_SPEED_MULTIPLIER) {
            speedMultiplier += 0.05;
        }
    }

    public double getX() {
        return view.getCenterX();
    }

    public double getY() {
        return view.getCenterY();
    }

    public double getRadius() {
        return view.getRadius();
    }

    public double getVelocityX() {
        return velocityX;
    }

    public double getVelocityY() {
        return velocityY;
    }

    public int getLastTouchedPlayerId() {
        return lastTouchedPlayerId;
    }

    public void setLastTouchedPlayerId(int id) {
        this.lastTouchedPlayerId = id;
    }
}
