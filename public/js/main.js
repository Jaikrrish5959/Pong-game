/**
 * Main Application - Socket.IO client and game orchestration
 */

class GameApp {
    constructor() {
        this.socket = null;
        this.renderer = null;
        this.inputHandler = null;
        this.lobbyManager = null;

        this.playerId = null;
        this.roomId = null;
        this.position = null;
        this.isHost = false;
        this.roomPositions = []; // Available positions in current room
        this.gameState = 'menu'; // menu, lobby, playing, ended

        this.init();
    }

    init() {
        // Initialize components
        this.lobbyManager = new LobbyManager();
        this.inputHandler = new InputHandler();

        // Connect to server
        this.connect();
    }

    connect() {
        const serverUrl = window.location.origin;
        this.socket = io(serverUrl);

        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.showScreen('menu-screen');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.showScreen('loading-screen');
        });

        this.socket.on('error', (data) => {
            console.error('Server error:', data.message);
            alert(data.message);
        });

        // Room events
        this.socket.on('roomCreated', (data) => this.handleQuickPlayStarted(data)); // Quick Play (Auto-start)
        this.socket.on('roomCreatedManual', (data) => this.handleManualRoomCreated(data)); // Manual (Show Lobby)
        this.socket.on('roomJoined', (data) => this.handleRoomJoined(data));
        this.socket.on('readyUpdate', (data) => this.handleReadyUpdate(data));

        // Game events
        this.socket.on('gameMessage', (msg) => this.handleGameMessage(msg));
    }

    // Room Management
    quickPlay(config) {
        this.socket.emit('quickPlay', config);
    }

    toggleReady() {
        this.socket.emit('toggleReady');
    }

    createRoom(config) {
        this.socket.emit('createRoom', config);
    }

    joinRoom(roomId) {
        this.socket.emit('joinRoom', roomId);
    }

    handleManualRoomCreated(data) {
        console.log('Manual Room created:', data);
        this.setupRoom(data);

        // Show lobby and code
        this.showScreen('lobby-screen');
        this.lobbyManager.updateRoomCode(data.roomId);
        this.lobbyManager.enableStartButton(data.isHost);
        this.lobbyManager.updatePlayerSlots(data.players, data.positions);
    }

    handleQuickPlayStarted(data) {
        console.log('Quick Play started:', data);
        this.setupRoom(data);

        // Auto-start wait screen or game screen
        this.showScreen('game-screen');
        this.initGame();
    }

    handleRoomJoined(data) {
        console.log('Joined room:', data);
        this.setupRoom(data);
        this.showScreen('lobby-screen');
        this.lobbyManager.updateRoomCode(data.roomId);
        // Only host sees Start, others see Ready
        this.updateLobbyButtons(data.isHost, false); // Intially not ready to start
        this.lobbyManager.updatePlayerSlots(data.players, data.positions);
    }

    handleReadyUpdate(data) {
        console.log('Ready update:', data);
        // Update slots visuals
        if (data.players) {
            this.lobbyManager.updatePlayerSlots(data.players, this.roomPositions);
        }

        // Update Host Start Button
        if (this.isHost) {
            this.lobbyManager.enableStartButton(data.allReady);
        }
    }

    updateLobbyButtons(isHost, allReady) {
        const btnStart = document.getElementById('btn-start-game');
        const btnReady = document.getElementById('btn-ready');

        if (btnStart && btnReady) {
            if (isHost) {
                btnStart.style.display = 'inline-block';
                btnReady.style.display = 'none';
                this.lobbyManager.enableStartButton(allReady);
            } else {
                btnStart.style.display = 'none';
                btnReady.style.display = 'inline-block';
            }
        }
    }

    setupRoom(data) {
        this.playerId = data.playerId;
        this.roomId = data.roomId;
        this.position = data.position;
        this.isHost = data.isHost;
        this.roomPositions = data.positions || ['left', 'right'];

        // Setup input handler for this position
        this.inputHandler.setPosition(this.position);
        this.inputHandler.setInputCallback((input) => {
            this.socket.emit('input', input);
        });

        // Setup lobby controls
        this.setupLobbyControls();
    }

    setupLobbyControls() {
        // Start game button
        document.getElementById('btn-start-game')?.addEventListener('click', () => {
            if (this.isHost) {
                this.socket.emit('startGame');
            }
        });

        // Leave room button
        document.getElementById('btn-leave-room')?.addEventListener('click', () => {
            location.reload();
        });
    }

    // Game Messages
    handleGameMessage(msg) {
        switch (msg.type) {
            case 'playerJoined':
                console.log('Player joined:', msg);
                // Update lobby if visible
                if (this.gameState === 'lobby' && msg.players) {
                    this.lobbyManager.updatePlayerSlots(msg.players, this.roomPositions);
                }
                break;

            case 'playerLeft':
                console.log('Player left:', msg);
                if (this.gameState === 'lobby' && msg.players) {
                    this.lobbyManager.updatePlayerSlots(msg.players, this.roomPositions);
                }
                break;

            case 'gameStarted':
                console.log('Game started!');
                this.handleGameStarted(msg);
                break;

            case 'state':
                this.handleStateUpdate(msg);
                break;

            case 'gamePaused':
                this.updateGameStatus('PAUSED');
                break;

            case 'gameResumed':
                this.updateGameStatus('');
                break;

            case 'gameEnded':
                this.handleGameEnded(msg);
                break;
        }
    }

    handleGameStarted(data) {
        this.gameState = 'playing';
        this.showScreen('game-screen');
        this.initGame();

        if (data.initialState) {
            this.renderer.updateState(data.initialState);
            this.renderer.resetInterpolation();
        }

        this.updateScores(data.initialState?.scores || {});
    }

    handleStateUpdate(state) {
        if (this.renderer) {
            this.renderer.updateState(state);
            this.updateScores(state.scores);
        }
    }

    handleGameEnded(data) {
        this.gameState = 'ended';
        this.showGameOver(data.winner, data.scores);
    }

    // Game UI
    initGame() {
        const canvas = document.getElementById('game-canvas');
        this.renderer = new GameRenderer(canvas);
        this.renderer.startRenderLoop();

        // Show game controls for host
        if (this.isHost) {
            document.getElementById('game-controls')?.classList.remove('hidden');
            this.setupGameControls();
        }

        // Show touch controls on mobile
        if (window.innerWidth <= 600) {
            document.getElementById('touch-controls')?.classList.remove('hidden');
        }
    }

    setupGameControls() {
        document.getElementById('btn-pause')?.addEventListener('click', () => {
            this.socket.emit('pauseGame');
        });

        document.getElementById('btn-restart')?.addEventListener('click', () => {
            this.socket.emit('restartGame');
            this.renderer.resetInterpolation();
        });

        document.getElementById('btn-exit-game')?.addEventListener('click', () => {
            if (confirm('Exit game? This will end the match for all players.')) {
                location.reload();
            }
        });
    }

    updateScores(scores) {
        const container = document.getElementById('scores-container');
        if (!container || !scores) return;

        container.innerHTML = '';

        Object.entries(scores).forEach(([position, score]) => {
            const item = document.createElement('div');
            item.className = `score-item ${position}`;
            item.innerHTML = `${position.toUpperCase()}: ${score}`;
            container.appendChild(item);
        });
    }

    updateGameStatus(text) {
        const status = document.getElementById('game-status');
        if (status) {
            status.textContent = text;
        }
    }

    showGameOver(winner, scores) {
        const overlay = document.getElementById('game-over-overlay');
        const winnerText = document.getElementById('winner-text');
        const finalScores = document.getElementById('final-scores');

        if (winnerText) {
            winnerText.textContent = `${winner.toUpperCase()} Wins!`;
        }

        if (finalScores && scores) {
            finalScores.innerHTML = Object.entries(scores)
                .map(([pos, score]) => `<div class="score-item ${pos}">${pos.toUpperCase()}: ${score}</div>`)
                .join('');
        }

        overlay?.classList.remove('hidden');

        // Setup overlay buttons
        document.getElementById('btn-play-again')?.addEventListener('click', () => {
            this.socket.emit('restartGame');
            overlay?.classList.add('hidden');
            this.renderer.resetInterpolation();
        });

        document.getElementById('btn-back-to-menu')?.addEventListener('click', () => {
            location.reload();
        });
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenId)?.classList.remove('hidden');

        // Track game state
        if (screenId === 'menu-screen') this.gameState = 'menu';
        else if (screenId === 'lobby-screen') this.gameState = 'lobby';
        else if (screenId === 'game-screen') this.gameState = 'playing';
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new GameApp();
});
