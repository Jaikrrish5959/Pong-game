/**
 * GameRoom - Manages a single game room with players
 */

const GameLoop = require('./GameLoop');
const { v4: uuidv4 } = require('uuid');

class GameRoom {
    constructor(io, config) {
        this.io = io;
        this.id = this.generateRoomId();
        this.config = {
            mode: config.mode || 'human_vs_ai', // human_vs_human, human_vs_ai, ai_vs_ai
            playerCount: config.playerCount || 2,
            aiDifficulty: config.aiDifficulty || 'medium',
            ...config
        };

        this.players = new Map(); // playerId -> { id, socket, position, isAI, isHost }
        this.spectators = new Map();
        this.positions = this.getPositionSlots();
        this.gameLoop = null;
        this.hostId = null;
    }

    generateRoomId() {
        // Generate a short, human-readable room ID
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let id = '';
        for (let i = 0; i < 6; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }

    getPositionSlots() {
        switch (this.config.playerCount) {
            case 2: return ['left', 'right'];
            case 3: return ['left', 'right', 'top'];
            case 4: return ['left', 'right', 'top', 'bottom'];
            default: return ['left', 'right'];
        }
    }

    addPlayer(socket, isHost = false) {
        const playerId = uuidv4();
        const position = this.getNextAvailablePosition();

        if (!position) {
            // Room is full, add as spectator
            return this.addSpectator(socket);
        }

        const player = {
            id: playerId,
            socket: socket,
            position: position,
            position: position,
            isAI: false,
            isHost: isHost || this.players.size === 0,
            isReady: false
        };

        this.players.set(playerId, player);
        socket.join(this.id);

        if (player.isHost) {
            this.hostId = playerId;
        }

        // Notify room
        const roomInfo = this.getInfo();
        this.broadcast({
            type: 'playerJoined',
            playerId: playerId,
            position: position,
            isHost: player.isHost,
            isReady: player.isReady,
            playerCount: this.players.size,
            players: roomInfo.players
        });

        return {
            success: true,
            playerId: playerId,
            position: position,
            isHost: player.isHost,
            roomId: this.id,
            config: this.config,
            players: roomInfo.players,
            positions: roomInfo.positions
        };
    }

    addSpectator(socket) {
        const spectatorId = uuidv4();
        this.spectators.set(spectatorId, { id: spectatorId, socket: socket });
        socket.join(this.id);
        const roomInfo = this.getInfo();

        return {
            success: true,
            playerId: spectatorId,
            position: null,
            isSpectator: true,
            roomId: this.id,
            config: this.config,
            players: roomInfo.players,
            positions: roomInfo.positions
        };
    }

    addAIPlayer(position) {
        if (this.positions.indexOf(position) === -1) return false;

        // Check if position is already taken
        for (const player of this.players.values()) {
            if (player.position === position) return false;
        }

        const aiId = `ai_${position}`;
        const aiPlayer = {
            id: aiId,
            socket: null,
            position: position,
            isAI: true,
            isHost: false
        };

        this.players.set(aiId, aiPlayer);

        // Notify room about AI player
        const roomInfo = this.getInfo();
        this.broadcast({
            type: 'playerJoined',
            playerId: aiId,
            position: position,
            isHost: false,
            playerCount: this.players.size,
            players: roomInfo.players
        });

        return true;
    }

    getNextAvailablePosition() {
        const takenPositions = new Set();
        for (const player of this.players.values()) {
            takenPositions.add(player.position);
        }

        for (const pos of this.positions) {
            if (!takenPositions.has(pos)) {
                return pos;
            }
        }
        return null;
    }

    getPlayerAtPosition(position) {
        for (const player of this.players.values()) {
            if (player.position === position) {
                return player;
            }
        }
        return null;
    }

    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (!player) {
            this.spectators.delete(playerId);
            return;
        }

        this.players.delete(playerId);

        // If host left, end the game immediately (LAN Mode Rule)
        if (player.isHost) {
            console.log(`Host left room ${this.id}. Ending game.`);
            this.endGame('aborted');
            this.broadcast({
                type: 'gameEnded',
                reason: 'host_disconnected',
                winner: null
            });
            // Clear all players essentially closing the room
            this.players.clear();
            this.spectators.clear();
            return;
        }

        const roomInfo = this.getInfo();
        this.broadcast({
            type: 'playerLeft',
            playerId: playerId,
            position: player.position,
            playerCount: this.players.size,
            players: roomInfo.players
        });

        // If game is running, pause or end it
        if (this.gameLoop && this.gameLoop.gameState === 'playing') {
            if (!player.isAI) {
                // Spec: No AI takeover in online mode
                if (this.config.mode === 'human_vs_human') {
                    console.log(`Player left in Human Mode. Pausing game.`);
                    this.pauseGame();
                    this.broadcast({
                        type: 'gameMessage',
                        message: 'Player disconnected. Game Paused.'
                    });
                } else {
                    // Replace with AI (only for non-human modes)
                    this.addAIPlayer(player.position);
                }
            }
        }
    }

    fillWithAI() {
        for (const pos of this.positions) {
            if (!this.getPlayerAtPosition(pos)) {
                this.addAIPlayer(pos);
            }
        }
    }

    toggleReady(playerId) {
        const player = this.players.get(playerId);
        if (!player || player.isAI) return;

        player.isReady = !player.isReady;

        // Notify room
        const roomInfo = this.getInfo();
        this.broadcast({
            type: 'readyUpdate',
            playerId: playerId,
            isReady: player.isReady,
            allReady: this.areAllPlayersReady(),
            players: roomInfo.players
        });
    }

    areAllPlayersReady() {
        for (const player of this.players.values()) {
            if (!player.isAI && !player.isReady) return false;
        }
        return true;
    }

    startGame() {
        // Validation: All players must be ready (or be host forcing it? Spec says "Host starts", implies check).
        // Spec: "Host starts the match" after "Each player confirms readiness".
        if (!this.areAllPlayersReady()) {
            // Optional: Emit error or just fail silently/log.
            // But let's allow single player testing or if host just wants to go? 
            // Strict spec: "Each player confirms readiness".
            // Let's enforce it for Human vs Human.
            if (this.config.mode === 'human_vs_human') {
                return false; // Indicate failure
            }
        }

        // Fill remaining slots with AI
        this.fillWithAI();

        this.gameLoop = new GameLoop(this);
        this.gameLoop.start();

        this.broadcast({
            type: 'gameStarted',
            config: this.config,
            initialState: this.gameLoop.getState()
        });
    }

    pauseGame() {
        if (this.gameLoop) {
            this.gameLoop.pause();
            this.broadcast({ type: 'gamePaused' });
        }
    }

    resumeGame() {
        if (this.gameLoop) {
            this.gameLoop.resume();
            this.broadcast({ type: 'gameResumed' });
        }
    }

    endGame(winner) {
        if (this.gameLoop) {
            this.gameLoop.stop();
        }

        this.broadcast({
            type: 'gameEnded',
            winner: winner,
            scores: this.gameLoop ? this.gameLoop.scores : {}
        });
    }

    restartGame() {
        if (this.gameLoop) {
            this.gameLoop.stop();
        }
        this.startGame();
    }

    handleInput(playerId, direction) {
        const player = this.players.get(playerId);
        if (!player || player.isAI) return;

        if (this.gameLoop) {
            this.gameLoop.handleInput(playerId, direction);
        }
    }

    broadcast(message) {
        this.io.to(this.id).emit('gameMessage', message);
    }

    getInfo() {
        return {
            id: this.id,
            config: this.config,
            playerCount: this.players.size,
            positions: this.positions,
            players: Array.from(this.players.values()).map(p => ({
                id: p.id,
                position: p.position,
                isAI: p.isAI,
                isHost: p.isHost,
                isReady: p.isReady
            })),
            gameState: this.gameLoop ? this.gameLoop.gameState : 'waiting'
        };
    }

    isEmpty() {
        // Check if any non-AI players remain
        for (const player of this.players.values()) {
            if (!player.isAI) return false;
        }
        return this.spectators.size === 0;
    }
}

module.exports = GameRoom;
