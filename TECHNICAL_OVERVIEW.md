# Technical Overview: Pong Game

This document provides a technical breakdown of the components, architecture, and algorithms used in this JavaFX-based Pong game implementation.

## 1. Components & Technologies

### Core Technologies
*   **Language:** Java 17
*   **UI Framework:** JavaFX (Version 17.0.6)
    *   `javafx-controls`: Standard UI components.
    *   `javafx-fxml`: XML-based UI layout.
    *   `javafx-graphics`: Scene graph and shape rendering.
*   **Build System:** Maven
    *   Used for dependency management and build lifecycle.

### Architecture Pattern: MVC (Model-View-Controller)
The application follows the Model-View-Controller design pattern to separate concerns:

*   **Model (`com.ponggame.model`):**
    *   `Ball.java`: Manages ball position, velocity, and boundary checking.
    *   `AIController.java`: Encapsulates the logic for the computer opponent.
    *   `GameState.java`: An enumeration managing the game flow (`MENU`, `PLAYING`, `WIN`).
*   **View (`/resources/fxml/game.fxml`):**
    *   Defines the visual layout using FXML.
    *   Contains the definition of the `AnchorPane`, `Rectangle` (paddles), `Circle` (ball), and `Label` (scores/messages).
    *   Uses CSS-like styling within FXML.
*   **Controller (`com.ponggame.controller.GameController`):**
    *   Acts as the bridge between the View and Model.
    *   Handles user input (Keyboard events).
    *   Runs the main game loop (`AnimationTimer`).
    *   Updates UI elements based on model state.

## 2. Algorithms & Logic

### Game Loop
The game utilizes the `javafx.animation.AnimationTimer` class. This provides a loop that is called once per frame (typically 60 times per second), ensuring smooth rendering and consistent physics updates.

### Physics & Collision Detection

1.  **Movement:**
    *   The ball follows a simple 2D velocity vector system: `Position = Position + Velocity`.
    *   Paddle movement is linear, constrained by the window bounds.

2.  **Collision Detection:**
    *   **AABB (Axis-Aligned Bounding Box):** The game uses JavaFX's built-in `getBoundsInParent().intersects()` method to detect overlaps between the Ball (Circle) and Paddles (Rectangles).

3.  **Reflection & Angle Adjustment:**
    *   **Wall Bouncing:** When the ball hits the top or bottom wall, its Y-velocity is inverted (`vy = -vy`).
    *   **Paddle Bouncing:** When hitting a paddle, the X-velocity is inverted (`vx = -vx`).
    *   **"Spin" Effect:** To make the game dynamic, the return angle depends on where the ball hits the paddle.
        *   **Formula:** `hitOffset = (ballY - paddleCenterY) / (paddleHalfHeight)`
        *   This offset (ranging from -1.0 to 1.0) is added to the Y-velocity, allowing players to "steer" the ball by hitting it with the edge of the paddle.

### Artificial Intelligence (AI)
The computer opponent uses a **Reactionary Tracking Algorithm** with humanizing imperfections:

1.  **State Tracking:** The AI constantly monitors the ball's position relative to its own paddle.
2.  **Reaction Delay:** The AI does not react instantly. It utilizes a frame counter to update its target decision only every `N` frames (simulating human reaction time).
3.  **Predictive vs. Idle:**
    *   **Approaching:** If the ball is moving towards the AI (Velocity X > 0) and is past the screen center, the AI calculates a target Y position to intercept it.
    *   **Retreating:** If the ball is moving away, the AI returns to the center of the screen to prepare for the next volley.
4.  **Error Margin:** A random "jitter" or error margin is added to the target calculation so the AI is not perfect and can be defeated.

### Input Handling
*   **Event Driven:** Key presses are stored in a `Set<KeyCode>`. This allows for smooth multi-key processing (e.g., moving a paddle while the other player moves theirs) without the "stutter" typical of standard typing delays.
