package com.ponggame;

import com.ponggame.model.GameConfig;
import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;

import java.io.IOException;

public class MainApp extends Application {

    private static Stage primaryStage;
    private static GameConfig gameConfig;

    @Override
    public void start(Stage stage) throws IOException {
        primaryStage = stage;
        showSetupMenu();
    }

    private static void showSetupMenu() throws IOException {
        FXMLLoader loader = new FXMLLoader(MainApp.class.getResource("/fxml/setup.fxml"));
        Parent root = loader.load();

        Scene scene = new Scene(root, 800, 600);
        scene.setOnMouseClicked(event -> root.requestFocus());

        primaryStage.setTitle("Pong - Setup");
        primaryStage.setScene(scene);
        primaryStage.setResizable(true);
        primaryStage.show();
        root.requestFocus();
    }

    public static void startGame(GameConfig config) {
        gameConfig = config;
        try {
            FXMLLoader loader = new FXMLLoader(MainApp.class.getResource("/fxml/game.fxml"));
            Parent root = loader.load();

            // Pass config to GameController
            com.ponggame.controller.GameController controller = loader.getController();
            controller.setGameConfig(config);

            Scene scene = new Scene(root, 800, 800);
            scene.setOnMouseClicked(event -> root.requestFocus());

            primaryStage.setTitle("Pong - " + config.getTotalPlayers() + " Players");
            primaryStage.setScene(scene);
            root.requestFocus();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        launch(args);
    }
}
