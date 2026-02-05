# Pong Game - Linux Desktop Edition (Maven/FXML)

A production-ready Pong game for Ubuntu Linux, featuring FXML architecture, Easy AI, and native Debian/Snap packaging support.

## Prerequisites

- **Java 17+**: `sudo apt install openjdk-17-jdk`
- **Maven**: `sudo apt install maven`
- **Packaging Tools**:
  - `jpackage`: Included in JDK 14+ (binutils package may be needed: `sudo apt install binutils`)
  - `snapcraft`: `sudo snap install snapcraft --classic`

## Build & Run (Development)

1. **Compile & Package JAR**:
   ```bash
   mvn clean package
   ```
2. **Run JAR**:
   ```bash
   java -jar target/ponggame-1.0.jar
   ```
   *Or with Maven:* `mvn javafx:run`

## Create Linux Packages

### 1. Debian Package (.deb)
Create a native `.deb` installer using `jpackage`:

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

**Install**: `sudo dpkg -i ponggame_1.0_amd64.deb`

### 2. Snap Package (.snap)
Build the snap package (requires `snapcraft`):

```bash
snapcraft
```

**Install**: `sudo snap install ponggame_1.0_amd64.snap --dangerous`

## Troubleshooting

- **JavaFX Modules**: If running the JAR manually fails with module errors, use the Fat JAR created by the Shade plugin (config included in pom.xml).
- **Snap Confinement**: `strict` confinement requires proper plugs (`wayland`, `x11`, `opengl`). If graphics fail, try changing confinement to `devmode` in `snapcraft.yaml` for testing.
