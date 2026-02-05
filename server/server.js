/**
 * Multiplayer Pong Server
 * Node.js + Socket.IO backend with server-authoritative game logic
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const GameRoom = require('./game/GameRoom');

const os = require('os');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// LAN IP Detection
function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal and non-IPv4
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const LOCAL_IP = getLocalIpAddress();
let qrCodeDataURL = '';

// Generate QR Code
QRCode.toDataURL(`http://${LOCAL_IP}:${PORT}`, (err, url) => {
    if (!err) {
        qrCodeDataURL = url;
        console.log('QR Code generated for LAN access.');
    }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Room management
const rooms = new Map();

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', rooms: rooms.size });
});

// LAN Info Endpoint
app.get('/api/lan-info', (req, res) => {
    res.json({
        ip: LOCAL_IP,
        port: PORT,
        qrCode: qrCodeDataURL,
        url: `http://${LOCAL_IP}:${PORT}`
    });
});

// Get room info
app.get('/api/room/:id', (req, res) => {
    const room = rooms.get(req.params.id);
    if (room) {
        res.json(room.getInfo());
    } else {
        res.status(404).json({ error: 'Room not found' });
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    let currentRoom = null;
    let playerId = null;

    // Create a new room (Manual)
    socket.on('createRoom', (config) => {
        const room = new GameRoom(io, config);
        rooms.set(room.id, room);

        const result = room.addPlayer(socket, true);
        currentRoom = room;
        playerId = result.playerId;

        socket.emit('roomCreatedManual', result); // Distinct event for manual creation
        console.log(`Room created manually: ${room.id} by ${playerId}`);
    });

    // Join existing room
    socket.on('joinRoom', (roomId) => {
        const room = rooms.get(roomId.toUpperCase());

        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        const result = room.addPlayer(socket, false);
        currentRoom = room;
        playerId = result.playerId;

        socket.emit('roomJoined', result);
        console.log(`Player ${playerId} joined room ${room.id}`);
    });

    // Quick play - create room and start with AI
    socket.on('quickPlay', (config) => {
        const room = new GameRoom(io, {
            mode: config.mode || 'human_vs_ai',
            playerCount: config.playerCount || 2,
            aiDifficulty: config.aiDifficulty || 'medium'
        });
        rooms.set(room.id, room);

        const result = room.addPlayer(socket, true);
        currentRoom = room;
        playerId = result.playerId;

        socket.emit('roomCreated', result);

        // Auto-start with AI
        setTimeout(() => {
            if (currentRoom && currentRoom.id === room.id) {
                room.startGame();
            }
        }, 500);

        console.log(`Quick play started: ${room.id}`);
    });

    // Start game (host only)
    socket.on('startGame', () => {
        if (!currentRoom) return;

        const player = currentRoom.players.get(playerId);
        if (player && player.isHost) {
            currentRoom.startGame();
            console.log(`Game started in room ${currentRoom.id}`);
        }
    });

    // Pause game (host only)
    socket.on('pauseGame', () => {
        if (!currentRoom) return;

        const player = currentRoom.players.get(playerId);
        if (player && player.isHost) {
            currentRoom.pauseGame();
        }
    });

    // Resume game (host only)
    socket.on('resumeGame', () => {
        if (!currentRoom) return;

        const player = currentRoom.players.get(playerId);
        if (player && player.isHost) {
            currentRoom.resumeGame();
        }
    });

    // Restart game (host only)
    socket.on('restartGame', () => {
        if (!currentRoom) return;

        const player = currentRoom.players.get(playerId);
        if (player && player.isHost) {
            currentRoom.restartGame();
        }
    });

    // Toggle Ready State
    socket.on('toggleReady', () => {
        if (!currentRoom || !playerId) return;
        currentRoom.toggleReady(playerId);
    });

    // Player input
    socket.on('input', (data) => {
        if (!currentRoom || !playerId) return;

        currentRoom.handleInput(playerId, data.direction);
    });

    // Disconnect handling
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);

        if (currentRoom && playerId) {
            currentRoom.removePlayer(playerId);

            // Clean up empty rooms
            if (currentRoom.isEmpty()) {
                if (currentRoom.gameLoop) {
                    currentRoom.gameLoop.stop();
                }
                rooms.delete(currentRoom.id);
                console.log(`Room ${currentRoom.id} removed (empty)`);
            }
        }
    });

    // Get room list for debugging
    socket.on('getRooms', () => {
        const roomList = Array.from(rooms.values()).map(r => r.getInfo());
        socket.emit('roomList', roomList);
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`🏓 Multiplayer Pong Server running at http://localhost:${PORT}`);
    console.log(`   Open this URL in your browser to play!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down...');
    rooms.forEach(room => {
        if (room.gameLoop) room.gameLoop.stop();
    });
    server.close();
    process.exit(0);
});
