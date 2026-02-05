package com.ponggame.controller;

import com.ponggame.MainApp;
import com.ponggame.model.GameConfig;
import com.ponggame.model.GameConfig.GameMode;
import com.ponggame.model.GameConfig.Position;
import javafx.fxml.FXML;
import javafx.scene.control.Label;
import javafx.scene.control.ToggleButton;
import javafx.scene.control.ToggleGroup;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;

import java.util.HashMap;
import java.util.Map;

public class SetupController {

    @FXML
    private StackPane setupRoot;
    @FXML
    private VBox step1, step2, step3, step4, step5, step6;
    @FXML
    private Label compositionLabel, humanCountLabel, aiCountLabel;
    @FXML
    private GridPane positionGrid;
    @FXML
    private VBox keyBindingsDisplay, summaryDisplay;

    private GameConfig config = new GameConfig();
    private Map<Position, ToggleButton> positionToggles = new HashMap<>();

    @FXML
    public void initialize() {
        // Default shown
    }

    // === Step 1: Game Mode ===
    @FXML
    private void selectHumanVsHuman() {
        config.setGameMode(GameMode.HUMAN_VS_HUMAN);
        goToStep2();
    }

    @FXML
    private void selectHumanVsAI() {
        config.setGameMode(GameMode.HUMAN_VS_AI);
        goToStep2();
    }

    @FXML
    private void selectAIvsAI() {
        config.setGameMode(GameMode.AI_VS_AI);
        goToStep2();
    }

    // === Step 2: Player Count ===
    @FXML
    private void select2Players() {
        config.setTotalPlayers(2);
        setupComposition();
        showStep(step3);
    }

    @FXML
    private void select3Players() {
        config.setTotalPlayers(3);
        setupComposition();
        showStep(step3);
    }

    @FXML
    private void select4Players() {
        config.setTotalPlayers(4);
        setupComposition();
        showStep(step3);
    }

    private void setupComposition() {
        int total = config.getTotalPlayers();

        if (config.getGameMode() == GameMode.AI_VS_AI) {
            config.setHumanCount(0);
            config.setAiCount(total);
        } else if (config.getGameMode() == GameMode.HUMAN_VS_HUMAN) {
            config.setHumanCount(total);
            config.setAiCount(0);
        } else {
            config.setHumanCount(1);
            config.setAiCount(total - 1);
        }
        updateCompositionDisplay();
    }

    private void updateCompositionDisplay() {
        compositionLabel.setText("Total Players: " + config.getTotalPlayers());
        humanCountLabel.setText(String.valueOf(config.getHumanCount()));
        aiCountLabel.setText(String.valueOf(config.getAiCount()));
    }

    // === Step 3: Composition ===
    @FXML
    private void increaseHumans() {
        int humans = config.getHumanCount();
        int total = config.getTotalPlayers();
        if (humans < total) {
            config.setHumanCount(humans + 1);
            config.setAiCount(total - humans - 1);
            updateCompositionDisplay();
        }
    }

    @FXML
    private void decreaseHumans() {
        int humans = config.getHumanCount();
        int minHumans = (config.getGameMode() == GameMode.AI_VS_AI) ? 0 : 1;
        if (humans > minHumans) {
            config.setHumanCount(humans - 1);
            config.setAiCount(config.getTotalPlayers() - humans + 1);
            updateCompositionDisplay();
        }
    }

    // === Step 4: Position Assignment ===
    private void setupPositionGrid() {
        positionGrid.getChildren().clear();
        positionToggles.clear();

        Position[] positions = config.getActivePositions();
        int humansToAssign = config.getHumanCount();

        for (int i = 0; i < positions.length; i++) {
            Position pos = positions[i];

            Label posLabel = new Label(pos.name());
            posLabel.setStyle("-fx-text-fill: white; -fx-font-size: 14px;");

            ToggleButton toggle = new ToggleButton(i < humansToAssign ? "HUMAN" : "AI");
            toggle.setSelected(i < humansToAssign);
            toggle.setStyle("-fx-background-color: " + (toggle.isSelected() ? "#00ff00" : "#ff0000")
                    + "; -fx-text-fill: black;");
            toggle.setPrefWidth(100);

            toggle.setOnAction(e -> {
                updatePositionToggle(toggle);
            });

            positionToggles.put(pos, toggle);
            config.setPositionAssignment(pos, toggle.isSelected());

            positionGrid.add(posLabel, 0, i);
            positionGrid.add(toggle, 1, i);
        }
    }

    private void updatePositionToggle(ToggleButton toggle) {
        // Count current humans
        long currentHumans = positionToggles.values().stream().filter(ToggleButton::isSelected).count();
        int requiredHumans = config.getHumanCount();

        if (toggle.isSelected() && currentHumans > requiredHumans) {
            toggle.setSelected(false);
        } else if (!toggle.isSelected() && currentHumans < requiredHumans) {
            toggle.setSelected(true);
        }

        toggle.setText(toggle.isSelected() ? "HUMAN" : "AI");
        toggle.setStyle(
                "-fx-background-color: " + (toggle.isSelected() ? "#00ff00" : "#ff0000") + "; -fx-text-fill: black;");

        // Update config
        for (var entry : positionToggles.entrySet()) {
            config.setPositionAssignment(entry.getKey(), entry.getValue().isSelected());
        }
    }

    // === Step 5: Key Bindings ===
    private void setupKeyBindingsDisplay() {
        keyBindingsDisplay.getChildren().clear();

        for (Position pos : config.getActivePositions()) {
            if (config.isHuman(pos)) {
                var keys = config.getKeyBinding(pos);
                String keyText = pos.name() + ": " + keys[0].getName() + " / " + keys[1].getName();
                Label label = new Label(keyText);
                label.setStyle("-fx-text-fill: #00ff00; -fx-font-size: 16px;");
                keyBindingsDisplay.getChildren().add(label);
            }
        }

        if (keyBindingsDisplay.getChildren().isEmpty()) {
            Label label = new Label("AI vs AI - No key bindings needed");
            label.setStyle("-fx-text-fill: #ffff00; -fx-font-size: 16px;");
            keyBindingsDisplay.getChildren().add(label);
        }
    }

    // === Step 6: Summary ===
    private void setupSummary() {
        summaryDisplay.getChildren().clear();

        addSummaryLine("Mode: " + config.getGameMode().name().replace("_", " "));
        addSummaryLine("Players: " + config.getTotalPlayers());
        addSummaryLine("Humans: " + config.getHumanCount() + " | AIs: " + config.getAiCount());
        addSummaryLine("");
        addSummaryLine("Positions:");

        for (Position pos : config.getActivePositions()) {
            String type = config.isHuman(pos) ? "HUMAN" : "AI";
            String color = config.isHuman(pos) ? "#00ff00" : "#ff0000";
            Label posLabel = new Label("  " + pos.name() + ": " + type);
            posLabel.setStyle("-fx-text-fill: " + color + "; -fx-font-size: 14px;");
            summaryDisplay.getChildren().add(posLabel);
        }
    }

    private void addSummaryLine(String text) {
        Label label = new Label(text);
        label.setStyle("-fx-text-fill: white; -fx-font-size: 14px;");
        summaryDisplay.getChildren().add(label);
    }

    // === Navigation ===
    private void showStep(VBox step) {
        step1.setVisible(false);
        step2.setVisible(false);
        step3.setVisible(false);
        step4.setVisible(false);
        step5.setVisible(false);
        step6.setVisible(false);
        step.setVisible(true);
    }

    @FXML
    private void goToStep1() {
        showStep(step1);
    }

    @FXML
    private void goToStep2() {
        showStep(step2);
    }

    @FXML
    private void goToStep3() {
        showStep(step3);
    }

    @FXML
    private void goToStep4() {
        setupPositionGrid();
        showStep(step4);
    }

    @FXML
    private void goToStep5() {
        setupKeyBindingsDisplay();
        showStep(step5);
    }

    @FXML
    private void goToStep6() {
        setupSummary();
        showStep(step6);
    }

    // === Step 7: Start Game ===
    @FXML
    private void startGame() {
        MainApp.startGame(config);
    }
}
