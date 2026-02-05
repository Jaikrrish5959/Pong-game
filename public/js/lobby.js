/**
 * Lobby Manager - Handles room creation, joining, and setup UI
 */

class LobbyManager {
    constructor() {
        this.config = {
            mode: 'human_vs_ai',
            playerCount: 2,
            aiDifficulty: 'medium'
        };

        this.initEventListeners();
    }

    initEventListeners() {
        // Quick Play buttons
        document.getElementById('btn-quick-2p')?.addEventListener('click', () => {
            this.quickPlay(2);
        });

        document.getElementById('btn-quick-4p')?.addEventListener('click', () => {
            this.quickPlay(4);
        });

        // Create/Join room
        document.getElementById('btn-create-room')?.addEventListener('click', () => {
            this.createRoom();
        });

        document.getElementById('btn-ready')?.addEventListener('click', () => {
            this.toggleReady();
        });

        document.getElementById('btn-join-room')?.addEventListener('click', () => {
            const code = document.getElementById('room-code-input')?.value;
            if (code) this.joinRoom(code);
        });

        // Advanced setup
        document.getElementById('btn-advanced')?.addEventListener('click', () => {
            this.showScreen('setup-screen');
        });

        document.getElementById('btn-back-menu')?.addEventListener('click', () => {
            this.showScreen('menu-screen');
        });

        // Setup options
        document.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.config.mode = btn.dataset.mode;
                this.updateAIDifficultyVisibility();
            });
        });

        document.querySelectorAll('[data-players]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-players]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.config.playerCount = parseInt(btn.dataset.players);
            });
        });

        document.querySelectorAll('[data-difficulty]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-difficulty]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.config.aiDifficulty = btn.dataset.difficulty;
            });
        });

        // Start custom game
        document.getElementById('btn-start-custom')?.addEventListener('click', () => {
            this.startCustomGame();
        });

        // Room code input formatting
        const roomInput = document.getElementById('room-code-input');
        if (roomInput) {
            roomInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            });
        }
    }

    updateAIDifficultyVisibility() {
        const section = document.getElementById('ai-difficulty-section');
        if (section) {
            section.style.display = this.config.mode === 'human_vs_human' ? 'none' : 'block';
        }
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenId)?.classList.remove('hidden');
    }

    quickPlay(playerCount) {
        this.config.playerCount = playerCount;
        this.config.mode = 'human_vs_ai';

        if (window.gameApp) {
            window.gameApp.quickPlay(this.config);
        }
    }

    createRoom() {
        if (window.gameApp) {
            // Create room always opens lobby for multiplayer
            const config = {
                ...this.config,
                mode: 'human_vs_human' // Force multiplayer mode for room creation
            };
            window.gameApp.createRoom(config);
        }
    }

    joinRoom(code) {
        if (window.gameApp) {
            window.gameApp.joinRoom(code);
        }
    }

    startCustomGame() {
        if (window.gameApp) {
            window.gameApp.quickPlay(this.config);
        }
    }

    updatePlayerSlots(players, positions) {
        const container = document.getElementById('player-slots');
        if (!container) return;

        container.innerHTML = '';

        positions.forEach(pos => {
            const player = players.find(p => p.position === pos);
            const slot = document.createElement('div');
            slot.className = 'player-slot' + (player ? ' filled' : '') + (player?.isAI ? ' ai' : '');

            const statusText = player
                ? (player.isAI ? '🤖 AI' : (player.isHost ? '👑 Host' : '🎮 Player'))
                : 'Waiting...';

            const readyStatus = (player && !player.isAI && player.isReady) ? ' ✅' : '';

            slot.innerHTML = `
                <div class="position">${pos}</div>
                <div class="status">${statusText}${readyStatus}</div>
            `;

            container.appendChild(slot);
        });
    }

    updateRoomCode(code) {
        const display = document.getElementById('display-room-code');
        if (display) {
            display.textContent = code;
            this.fetchLanInfo();
        }
    }

    enableStartButton(enabled) {
        const btn = document.getElementById('btn-start-game');
        if (btn) {
            btn.disabled = !enabled;
            if (!enabled) {
                btn.title = "Waiting for players to get Ready...";
            } else {
                btn.title = "Start Game";
            }
        }
    }

    toggleReady() {
        if (window.gameApp) {
            window.gameApp.toggleReady();
        }
    }

    async fetchLanInfo() {
        try {
            const response = await fetch('/api/lan-info');
            const data = await response.json();

            const qrImg = document.getElementById('qr-code-img');
            const urlText = document.getElementById('lan-url-text');
            const container = document.getElementById('lan-join-info');

            if (data.qrCode && qrImg) {
                qrImg.src = data.qrCode;
                container.classList.remove('hidden');
            }
            if (data.url && urlText) {
                urlText.textContent = data.url;
            }
        } catch (e) {
            console.error('Failed to fetch LAN info:', e);
        }
    }
}

// Export as global
window.LobbyManager = LobbyManager;
