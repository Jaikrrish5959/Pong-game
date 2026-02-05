package com.ponggame.model;

import javafx.scene.input.KeyCode;
import java.util.HashMap;
import java.util.Map;

public class GameConfig {

    public enum GameMode {
        HUMAN_VS_HUMAN, HUMAN_VS_AI, AI_VS_AI
    }

    public enum Position {
        LEFT, RIGHT, TOP, BOTTOM
    }

    private GameMode gameMode = GameMode.HUMAN_VS_AI;
    private int totalPlayers = 2;
    private int humanCount = 1;
    private int aiCount = 1;

    // Position -> isHuman (true = human, false = AI)
    private Map<Position, Boolean> positionAssignments = new HashMap<>();

    // Position -> control keys (up/left key, down/right key)
    private Map<Position, KeyCode[]> keyBindings = new HashMap<>();

    public GameConfig() {
        // Default key bindings
        keyBindings.put(Position.LEFT, new KeyCode[] { KeyCode.W, KeyCode.S });
        keyBindings.put(Position.RIGHT, new KeyCode[] { KeyCode.UP, KeyCode.DOWN });
        keyBindings.put(Position.TOP, new KeyCode[] { KeyCode.A, KeyCode.D });
        keyBindings.put(Position.BOTTOM, new KeyCode[] { KeyCode.J, KeyCode.L });
    }

    public Position[] getActivePositions() {
        return switch (totalPlayers) {
            case 2 -> new Position[] { Position.LEFT, Position.RIGHT };
            case 3 -> new Position[] { Position.LEFT, Position.RIGHT, Position.TOP };
            case 4 -> new Position[] { Position.LEFT, Position.RIGHT, Position.TOP, Position.BOTTOM };
            default -> new Position[] { Position.LEFT, Position.RIGHT };
        };
    }

    // Getters and Setters
    public GameMode getGameMode() {
        return gameMode;
    }

    public void setGameMode(GameMode mode) {
        this.gameMode = mode;
    }

    public int getTotalPlayers() {
        return totalPlayers;
    }

    public void setTotalPlayers(int count) {
        this.totalPlayers = count;
    }

    public int getHumanCount() {
        return humanCount;
    }

    public void setHumanCount(int count) {
        this.humanCount = count;
    }

    public int getAiCount() {
        return aiCount;
    }

    public void setAiCount(int count) {
        this.aiCount = count;
    }

    public Map<Position, Boolean> getPositionAssignments() {
        return positionAssignments;
    }

    public void setPositionAssignment(Position pos, boolean isHuman) {
        positionAssignments.put(pos, isHuman);
    }

    public KeyCode[] getKeyBinding(Position pos) {
        return keyBindings.get(pos);
    }

    public boolean isHuman(Position pos) {
        return positionAssignments.getOrDefault(pos, false);
    }
}
