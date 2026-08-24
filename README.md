# Pong Game Suite

A feature-rich multi-platform implementation of the classic Pong game, including a **Node.js/Socket.IO Web Multiplayer Edition** (2–4 players, LAN support, AI integration), a **JavaFX Linux Desktop Edition** (FXML architecture, native `.deb` & Snap packaging), and an **Android Edition**.

---

## 🎮 Game Editions & Features

### 1. 🌐 Web Multiplayer Edition (`/server` & `/public`)
Real-time, server-authoritative multiplayer Pong engine running at 60Hz.
* **Modes**:
  * **2-Player & 4-Player Arena** (Human vs Human, Human vs AI, AI vs AI)
  * **Quick Play** (Instant match with computer opponents)
  * **Custom / Private Rooms** with host controls (Start, Pause, Resume, Restart)
* **LAN Support**:
  * Automatic local IP detection and QR code generation for mobile devices on the same network
* **Controls & Features**:
  * Keyboard & Touch controls (for mobile screens)
  * Server-side physics engine (60 FPS) with smooth client interpolation
  * Dynamic ball spin depending on collision point on paddles

### 2. 🐧 Linux Desktop Edition (JavaFX / Maven)
A native desktop Pong game built with Java 17 and JavaFX.
* **Architecture**: Model-View-Controller (MVC) using FXML layout (`game.fxml`) and CSS styling.
* **AI Opponent**: Reactionary tracking algorithm with humanized frame-delay and error margins.
* **Packaging**: Built-in scripts for building native Debian (`.deb`) installers via `jpackage` and Linux `.snap` packages via Snapcraft.

### 3. 📱 Android Edition (`/android-pong`)
A native Android version configured with Kotlin and Gradle.

---

## 🚀 Getting Started

### Running the Web Multiplayer Server

1. **Install dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Start the Server**:
   ```bash
   PORT=3001 npm start
   ```

3. **Play in Browser**:
   * Open `http://localhost:3001` in your browser.
   * To play on mobile devices connected to the same Wi-Fi network, navigate to `http://<your-lan-ip>:3001` or scan the QR code displayed in the room lobby / `/api/lan-info`.

---

### Running the JavaFX Desktop Edition

1. **Prerequisites**:
   ```bash
   sudo apt install openjdk-17-jdk maven binutils snapcraft
   ```

2. **Compile & Run**:
   ```bash
   mvn clean package
   mvn javafx:run
   ```
   *Or run the Fat JAR:*
   ```bash
   java -jar target/ponggame-1.0.jar
   ```

3. **Package as Debian (`.deb`) Package**:
   ```bash
   jpackage \
     --type deb \
     --input target \
     --main-jar ponggame-1.0.jar \
     --main-class com.ponggame.MainApp \
     --name ponggame \
     --app-version 1.0 \
     --vendor "PongStudios" \
     --description "Classic Pong Game" \
     --linux-shortcut
   ```

4. **Package as Snap (`.snap`)**:
   ```bash
   snapcraft
   ```

---

## 🕹️ Controls

### Web Multiplayer
* **Player 1 (Left Paddle)**: `W` (Up), `S` (Down)
* **Player 2 (Right Paddle)**: `Up Arrow` (Up), `Down Arrow` (Down)
* **Player 3 (Top Paddle)**: `A` (Left), `D` (Right)
* **Player 4 (Bottom Paddle)**: `Left Arrow` (Left), `Right Arrow` (Right)
* **Mobile**: On-screen directional buttons (`▲` / `▼`)

### JavaFX Desktop
* **Left Paddle**: `W` / `S`
* **Right Paddle**: `Up Arrow` / `Down Arrow`

---

## 📁 Repository Structure

```
.
├── server/               # Node.js + Express + Socket.IO backend & game rooms logic
│   ├── game/             # Server-authoritative physics, GameLoop, AIController, GameRoom
│   └── server.js         # HTTP & WebSockets entrypoint
├── public/               # Web client UI (HTML5 Canvas, CSS glassmorphism UI, JS client logic)
├── src/                  # JavaFX desktop application source code (Java 17 / FXML)
├── android-pong/         # Native Android app project source
├── snapcraft.yaml        # Linux Snap package configuration
├── TECHNICAL_OVERVIEW.md # Deep-dive into algorithms, AI mechanics & physics model
└── README.md             # Repository documentation
```

