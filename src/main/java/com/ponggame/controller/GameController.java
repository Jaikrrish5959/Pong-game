package com.ponggame.controller;

import com.ponggame.model.AIController;
import com.ponggame.model.Ball;
import com.ponggame.model.GameConfig;
import com.ponggame.model.GameConfig.Position;
import com.ponggame.model.GameState;
import javafx.animation.AnimationTimer;
import javafx.fxml.FXML;
import javafx.scene.Group;
import javafx.scene.control.Label;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import javafx.scene.layout.AnchorPane;
import javafx.scene.layout.StackPane;
import javafx.scene.paint.Color;
import javafx.scene.shape.Circle;
import javafx.scene.shape.Rectangle;
import javafx.scene.transform.Scale;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class GameController {

    @FXML
    private StackPane gameRoot;
    @FXML
    private AnchorPane gamePane;
    @FXML
    private Group gameGroup;
    @FXML
    private Circle ballCircle;
    @FXML
    private Label player1Score, player2Score, player3Score, player4Score;
    @FXML
    private Label statusLabel;
    @FXML
    private Rectangle paddle1, paddle2, paddle3, paddle4;

    private Ball ball;
    private Map<Position, Rectangle> paddles = new HashMap<>();
    private Map<Position, AIController> aiControllers = new HashMap<>();
    private AnimationTimer gameLoop;
    private GameState gameState = GameState.MENU;
    private GameConfig config;

    private Set<KeyCode> activeKeys = new HashSet<>();
    private Map<Position, Integer> scores = new HashMap<>();

    private final int WIN_SCORE = 10;
    private final double PADDLE_SPEED = 6.0;
    private final double ARENA_SIZE = 800;

    @FXML
    public void initialize() {
        // Wait for setGameConfig to be called
    }

    public void setGameConfig(GameConfig config) {
        this.config = config;
        setupGame();
    }

    private void setupGame() {
        ball = new Ball(ballCircle, ARENA_SIZE, ARENA_SIZE);

        // Map paddles to positions
        paddles.put(Position.BOTTOM, paddle1);
        paddles.put(Position.TOP, paddle2);
        paddles.put(Position.LEFT, paddle3);
        paddles.put(Position.RIGHT, paddle4);

        // Initialize scores and hide unused paddles/scores
        Position[] activePositions = config.getActivePositions();
        Set<Position> activeSet = Set.of(activePositions);

        for (Position pos : Position.values()) {
            Rectangle paddle = paddles.get(pos);
            if (paddle == null)
                continue;

            if (activeSet.contains(pos)) {
                paddle.setVisible(true);
                scores.put(pos, 0);

                // Create AI controller if not human
                if (!config.isHuman(pos)) {
                    boolean isHorizontal = (pos == Position.TOP || pos == Position.BOTTOM);
                    aiControllers.put(pos, new AIController(paddle, ball, isHorizontal, 30, 770));
                }

                // Set paddle colors
                paddle.setFill(config.isHuman(pos) ? Color.LIMEGREEN : Color.RED);
            } else {
                paddle.setVisible(false);
            }
        }

        // Hide unused score labels
        updateScoreVisibility();

        // Setup listeners
        gameRoot.widthProperty().addListener((obs, oldVal, newVal) -> scaleAndCenterGame());
        gameRoot.heightProperty().addListener((obs, oldVal, newVal) -> scaleAndCenterGame());

        setupGameLoop();
        setupKeyHandlers();

        // Auto-start for AI vs AI
        if (config.getGameMode() == GameConfig.GameMode.AI_VS_AI) {
            startGame();
        }
    }

    private void updateScoreVisibility() {
        Position[] active = config.getActivePositions();
        Set<Position> activeSet = Set.of(active);

        player1Score.setVisible(activeSet.contains(Position.BOTTOM));
        player2Score.setVisible(activeSet.contains(Position.TOP));
        player3Score.setVisible(activeSet.contains(Position.LEFT));
        player4Score.setVisible(activeSet.contains(Position.RIGHT));
    }

    private void scaleAndCenterGame() {
        double scaleX = gameRoot.getWidth() / ARENA_SIZE;
        double scaleY = gameRoot.getHeight() / ARENA_SIZE;
        double scale = Math.min(scaleX, scaleY);

        gameGroup.getTransforms().clear();
        gameGroup.getTransforms().add(new Scale(scale, scale, 0, 0));

        double scaledSize = ARENA_SIZE * scale;
        double offsetX = (gameRoot.getWidth() - scaledSize) / 2;
        double offsetY = (gameRoot.getHeight() - scaledSize) / 2;

        gameGroup.setLayoutX(offsetX);
        gameGroup.setLayoutY(offsetY);
    }

    private void setupGameLoop() {
        gameLoop = new AnimationTimer() {
            @Override
            public void handle(long now) {
                if (gameState == GameState.PLAYING) {
                    update();
                }
            }
        };
    }

    private void setupKeyHandlers() {
        gameRoot.setOnKeyPressed(this::handleKeyPressed);
        gameRoot.setOnKeyReleased(this::handleKeyReleased);
        gameRoot.setFocusTraversable(true);
    }

    private void handleKeyPressed(KeyEvent event) {
        activeKeys.add(event.getCode());

        if (event.getCode() == KeyCode.SPACE && gameState == GameState.MENU) {
            startGame();
        } else if (event.getCode() == KeyCode.R && gameState == GameState.WIN) {
            resetGame();
        } else if (event.getCode() == KeyCode.ESCAPE) {
            System.exit(0);
        }
    }

    private void handleKeyReleased(KeyEvent event) {
        activeKeys.remove(event.getCode());
    }

    private void startGame() {
        gameState = GameState.PLAYING;
        statusLabel.setVisible(false);
        gameLoop.start();
    }

    private void resetGame() {
        for (Position pos : scores.keySet()) {
            scores.put(pos, 0);
        }
        updateAllScores();
        ball.reset(ARENA_SIZE, ARENA_SIZE);
        gameState = GameState.MENU;
        statusLabel.setText("Press SPACE to Start");
        statusLabel.setVisible(true);
    }

    private void update() {
        // Human paddle movement
        for (Position pos : config.getActivePositions()) {
            if (config.isHuman(pos)) {
                moveHumanPaddle(pos);
            }
        }

        // AI movement
        for (var entry : aiControllers.entrySet()) {
            entry.getValue().update();
        }

        // Ball movement
        ball.update();

        // Collision detection
        checkPaddleCollisions();

        // Wall collision for inactive edges (edges without paddles)
        checkWallCollisions();

        // Scoring
        checkScoring();
    }

    private void moveHumanPaddle(Position pos) {
        Rectangle paddle = paddles.get(pos);
        KeyCode[] keys = config.getKeyBinding(pos);
        if (keys == null || paddle == null)
            return;

        boolean isHorizontal = (pos == Position.TOP || pos == Position.BOTTOM);

        if (isHorizontal) {
            if (activeKeys.contains(keys[0])) { // Left/Up key
                paddle.setX(Math.max(30, paddle.getX() - PADDLE_SPEED));
            }
            if (activeKeys.contains(keys[1])) { // Right/Down key
                paddle.setX(Math.min(770 - paddle.getWidth(), paddle.getX() + PADDLE_SPEED));
            }
        } else {
            if (activeKeys.contains(keys[0])) { // Up key
                paddle.setY(Math.max(30, paddle.getY() - PADDLE_SPEED));
            }
            if (activeKeys.contains(keys[1])) { // Down key
                paddle.setY(Math.min(770 - paddle.getHeight(), paddle.getY() + PADDLE_SPEED));
            }
        }
    }

    private void checkPaddleCollisions() {
        double ballX = ball.getX();
        double ballY = ball.getY();
        double ballR = ball.getRadius();

        for (Position pos : config.getActivePositions()) {
            Rectangle paddle = paddles.get(pos);
            if (paddle == null || !paddle.isVisible())
                continue;

            boolean hit = false;

            switch (pos) {
                case BOTTOM:
                    if (ballY + ballR >= paddle.getY() &&
                            ballY - ballR <= paddle.getY() + paddle.getHeight() &&
                            ballX >= paddle.getX() && ballX <= paddle.getX() + paddle.getWidth() &&
                            ball.getVelocityY() > 0) {
                        ball.reverseY();
                        hit = true;
                    }
                    break;
                case TOP:
                    if (ballY - ballR <= paddle.getY() + paddle.getHeight() &&
                            ballY + ballR >= paddle.getY() &&
                            ballX >= paddle.getX() && ballX <= paddle.getX() + paddle.getWidth() &&
                            ball.getVelocityY() < 0) {
                        ball.reverseY();
                        hit = true;
                    }
                    break;
                case LEFT:
                    if (ballX - ballR <= paddle.getX() + paddle.getWidth() &&
                            ballX + ballR >= paddle.getX() &&
                            ballY >= paddle.getY() && ballY <= paddle.getY() + paddle.getHeight() &&
                            ball.getVelocityX() < 0) {
                        ball.reverseX();
                        hit = true;
                    }
                    break;
                case RIGHT:
                    if (ballX + ballR >= paddle.getX() &&
                            ballX - ballR <= paddle.getX() + paddle.getWidth() &&
                            ballY >= paddle.getY() && ballY <= paddle.getY() + paddle.getHeight() &&
                            ball.getVelocityX() > 0) {
                        ball.reverseX();
                        hit = true;
                    }
                    break;
            }

            if (hit) {
                ball.setLastTouchedPlayerId(positionToPlayerId(pos));
            }
        }
    }

    private void checkWallCollisions() {
        double ballX = ball.getX();
        double ballY = ball.getY();
        double ballR = ball.getRadius();

        Set<Position> activeSet = Set.of(config.getActivePositions());

        // Bottom wall (if no paddle there)
        if (!activeSet.contains(Position.BOTTOM)) {
            if (ballY + ballR >= 785 && ball.getVelocityY() > 0) {
                ball.reverseY();
                ballCircle.setCenterY(785 - ballR);
            }
        }

        // Top wall (if no paddle there)
        if (!activeSet.contains(Position.TOP)) {
            if (ballY - ballR <= 15 && ball.getVelocityY() < 0) {
                ball.reverseY();
                ballCircle.setCenterY(15 + ballR);
            }
        }

        // Left wall (if no paddle there)
        if (!activeSet.contains(Position.LEFT)) {
            if (ballX - ballR <= 15 && ball.getVelocityX() < 0) {
                ball.reverseX();
                ballCircle.setCenterX(15 + ballR);
            }
        }

        // Right wall (if no paddle there)
        if (!activeSet.contains(Position.RIGHT)) {
            if (ballX + ballR >= 785 && ball.getVelocityX() > 0) {
                ball.reverseX();
                ballCircle.setCenterX(785 - ballR);
            }
        }
    }

    private int positionToPlayerId(Position pos) {
        return switch (pos) {
            case BOTTOM -> 1;
            case TOP -> 2;
            case LEFT -> 3;
            case RIGHT -> 4;
        };
    }

    private Position playerIdToPosition(int id) {
        return switch (id) {
            case 1 -> Position.BOTTOM;
            case 2 -> Position.TOP;
            case 3 -> Position.LEFT;
            case 4 -> Position.RIGHT;
            default -> null;
        };
    }

    private void checkScoring() {
        double ballX = ball.getX();
        double ballY = ball.getY();
        int lastTouched = ball.getLastTouchedPlayerId();
        Position lastTouchedPos = playerIdToPosition(lastTouched);

        Position missedBy = null;

        // Check which edge ball exited
        if (ballY > ARENA_SIZE + 20) {
            missedBy = Position.BOTTOM;
        } else if (ballY < -20) {
            missedBy = Position.TOP;
        } else if (ballX < -20) {
            missedBy = Position.LEFT;
        } else if (ballX > ARENA_SIZE + 20) {
            missedBy = Position.RIGHT;
        }

        if (missedBy != null && scores.containsKey(missedBy)) {
            // Award point to last toucher if they're not the one who missed
            if (lastTouchedPos != null && lastTouchedPos != missedBy && scores.containsKey(lastTouchedPos)) {
                scores.put(lastTouchedPos, scores.get(lastTouchedPos) + 1);
                updateScoreLabel(lastTouchedPos);
            }
            resetBall();
        }
    }

    private void resetBall() {
        checkWin();
        ball.reset(ARENA_SIZE, ARENA_SIZE);
    }

    private void updateScoreLabel(Position pos) {
        int score = scores.getOrDefault(pos, 0);
        switch (pos) {
            case BOTTOM -> player1Score.setText("P1: " + score);
            case TOP -> player2Score.setText("P2: " + score);
            case LEFT -> player3Score.setText("P3: " + score);
            case RIGHT -> player4Score.setText("P4: " + score);
        }
    }

    private void updateAllScores() {
        for (Position pos : scores.keySet()) {
            updateScoreLabel(pos);
        }
    }

    private void checkWin() {
        for (var entry : scores.entrySet()) {
            if (entry.getValue() >= WIN_SCORE) {
                gameState = GameState.WIN;
                gameLoop.stop();
                String winner = entry.getKey().name();
                statusLabel.setText(winner + " Wins! Press R to Restart");
                statusLabel.setVisible(true);
                return;
            }
        }
    }
}
