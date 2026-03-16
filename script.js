// ============================================================
// JOGO LABIRINTO v2.0 — Rewrite completo
// ============================================================

// ============ CONFIGURACAO ============

const DIFFICULTY = {
    easy:   { rows: 12, cols: 12, maxMoves: 300, monsterDelay: 1200, choiceEvery: 3, fogRadius: null, label: 'Facil',   multiplier: 1 },
    medium: { rows: 16, cols: 16, maxMoves: 200, monsterDelay: 900,  choiceEvery: 3, fogRadius: null, label: 'Medio',   multiplier: 2 },
    hard:   { rows: 22, cols: 22, maxMoves: 120, monsterDelay: 600,  choiceEvery: 4, fogRadius: 5,    label: 'Dificil', multiplier: 3 },
};

const MOVE_NAMES = { 1: 'Cima', 2: 'Baixo', 3: 'Direita', 4: 'Esquerda' };

const COLORS = {
    wall: '#1e293b',
    path: '#0f172a',
    player: '#a855f7',
    monster: '#ef4444',
    goal: '#22c55e',
    goalGlow: 'rgba(34, 197, 94, 0.3)',
    fog: '#0a0a0f',
    gridLine: 'rgba(30, 41, 59, 0.3)',
};

// ============ SOUND MANAGER ============

class SoundManager {
    constructor() {
        this.enabled = true;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch {
            this.enabled = false;
        }
    }

    _play(freq, duration, type = 'square', volume = 0.08) {
        if (!this.enabled) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.value = volume;
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch { /* ignore audio errors */ }
    }

    move()    { this._play(440, 0.08, 'square', 0.05); }
    monster() { this._play(180, 0.15, 'sawtooth', 0.04); }
    choice()  { this._play(660, 0.1, 'sine', 0.06); this._play(880, 0.1, 'sine', 0.04); }
    hit()     { this._play(120, 0.4, 'sawtooth', 0.1); }

    win() {
        [523, 659, 784, 1047].forEach((f, i) => {
            setTimeout(() => this._play(f, 0.2, 'sine', 0.08), i * 150);
        });
    }

    lose() {
        [400, 350, 300, 200].forEach((f, i) => {
            setTimeout(() => this._play(f, 0.25, 'sawtooth', 0.06), i * 180);
        });
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
}

// ============ MAZE GENERATOR ============

function generateMaze(rows, cols) {
    const maze = Array.from({ length: rows }, () => Array(cols).fill(0));

    function carve(row, col) {
        maze[row][col] = 1;
        const dirs = [[0, 2], [2, 0], [0, -2], [-2, 0]];
        dirs.sort(() => Math.random() - 0.5);

        for (const [dr, dc] of dirs) {
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && maze[nr][nc] === 0) {
                maze[row + dr / 2][col + dc / 2] = 1;
                carve(nr, nc);
            }
        }
    }

    carve(0, 0);
    return maze;
}

function randomOpenCell(maze, rows, cols, exclude = []) {
    let x, y;
    do {
        x = Math.floor(Math.random() * cols);
        y = Math.floor(Math.random() * rows);
    } while (
        maze[y][x] === 0 ||
        exclude.some(p => p.x === x && p.y === y)
    );
    return { x, y };
}

// ============ GENERATE RANDOM MOVE LIST ============

function generateMoveList(size) {
    const moves = [];
    const available = [1, 2, 3, 4];
    // Shuffle and pick 'size' unique moves
    available.sort(() => Math.random() - 0.5);
    for (let i = 0; i < size && i < available.length; i++) {
        moves.push(available[i]);
    }
    return moves;
}

// ============ GAME CLASS ============

class Game {
    constructor(difficulty) {
        this.difficulty = difficulty;
        this.config = DIFFICULTY[difficulty];
        this.maze = generateMaze(this.config.rows, this.config.cols);

        // Place entities
        this.player = randomOpenCell(this.maze, this.config.rows, this.config.cols);
        this.goal = randomOpenCell(this.maze, this.config.rows, this.config.cols, [this.player]);
        this.monster = randomOpenCell(this.maze, this.config.rows, this.config.cols, [this.player, this.goal]);

        // State
        this.movesLeft = this.config.maxMoves;
        this.score = 0;
        this.turn = 'player'; // 'player' | 'monster' | 'choosing' | 'ended'
        this.moveCount = 0;
        this.choiceType = null; // 'stack' | 'queue'
        this.currentMoves = generateMoveList(this.config.choiceEvery);
        this.nextMoves = generateMoveList(this.config.choiceEvery);
        this.startTime = Date.now();
        this.movesUsedFromList = 0;
    }

    canMove(x, y) {
        return (
            x >= 0 && x < this.config.cols &&
            y >= 0 && y < this.config.rows &&
            this.maze[y][x] === 1
        );
    }

    movePlayer(dx, dy) {
        if (this.turn !== 'player') return false;
        const nx = this.player.x + dx;
        const ny = this.player.y + dy;
        if (!this.canMove(nx, ny)) return false;

        this.player.x = nx;
        this.player.y = ny;
        this.movesLeft--;
        this.moveCount++;
        this.score += 5;

        // Check win
        if (this.player.x === this.goal.x && this.player.y === this.goal.y) {
            this.turn = 'ended';
            return 'win';
        }

        // Check collision with monster
        if (this.player.x === this.monster.x && this.player.y === this.monster.y) {
            this.turn = 'ended';
            return 'lose_monster';
        }

        // Check out of moves
        if (this.movesLeft <= 0) {
            this.turn = 'ended';
            return 'lose_moves';
        }

        this.turn = 'monster';
        return 'moved';
    }

    needsChoice() {
        return this.movesUsedFromList >= this.currentMoves.length;
    }

    applyChoice(type) {
        this.choiceType = type;
        // Rotate lists
        this.currentMoves = [...this.nextMoves];
        this.nextMoves = generateMoveList(this.config.choiceEvery);
        this.movesUsedFromList = 0;
    }

    getNextMonsterMove() {
        if (this.movesUsedFromList >= this.currentMoves.length) return null;

        let move;
        if (this.choiceType === 'stack') {
            // LIFO: remove from end (pop)
            move = this.currentMoves.pop();
        } else {
            // FIFO: remove from beginning (shift)
            move = this.currentMoves.shift();
        }
        this.movesUsedFromList++;
        return move;
    }

    executeMonsterMove(move) {
        let nx = this.monster.x;
        let ny = this.monster.y;

        if (move === 1) ny--;       // Cima
        else if (move === 2) ny++;   // Baixo
        else if (move === 3) nx++;   // Direita
        else if (move === 4) nx--;   // Esquerda

        if (this.canMove(nx, ny)) {
            this.monster.x = nx;
            this.monster.y = ny;
        }
        // If can't move, monster "loses" the turn

        // Check collision
        if (this.player.x === this.monster.x && this.player.y === this.monster.y) {
            this.turn = 'ended';
            return 'lose_monster';
        }

        this.turn = 'player';
        return 'moved';
    }

    getElapsedSeconds() {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    calculateFinalScore() {
        const timeBonus = Math.max(0, 300 - this.getElapsedSeconds()) * 2;
        const moveBonus = this.movesLeft * 10;
        return (this.score + moveBonus + timeBonus) * this.config.multiplier;
    }
}

// ============ RENDERER ============

class Renderer {
    constructor(canvas, wrapper) {
        this.canvas = canvas;
        this.wrapper = wrapper;
        this.ctx = canvas.getContext('2d');
        this.animating = false;
    }

    resize(game) {
        const size = Math.min(this.wrapper.clientWidth, this.wrapper.clientHeight);
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = size * dpr;
        this.canvas.height = size * dpr;
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.cellSize = size / game.config.cols;
    }

    render(game) {
        const { ctx, cellSize } = this;
        const { rows, cols, fogRadius } = game.config;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw maze
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // Fog of war check
                if (fogRadius !== null) {
                    const dist = Math.abs(game.player.x - c) + Math.abs(game.player.y - r);
                    if (dist > fogRadius) {
                        ctx.fillStyle = COLORS.fog;
                        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
                        continue;
                    }
                }

                ctx.fillStyle = game.maze[r][c] === 0 ? COLORS.wall : COLORS.path;
                ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            }
        }

        // Grid lines
        ctx.strokeStyle = COLORS.gridLine;
        ctx.lineWidth = 0.5;
        for (let r = 0; r <= rows; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * cellSize);
            ctx.lineTo(cols * cellSize, r * cellSize);
            ctx.stroke();
        }
        for (let c = 0; c <= cols; c++) {
            ctx.beginPath();
            ctx.moveTo(c * cellSize, 0);
            ctx.lineTo(c * cellSize, rows * cellSize);
            ctx.stroke();
        }

        // Goal (with glow)
        if (this._isVisible(game, game.goal.x, game.goal.y)) {
            const gx = game.goal.x * cellSize + cellSize / 2;
            const gy = game.goal.y * cellSize + cellSize / 2;
            const glowRadius = cellSize * 0.8;

            const gradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, glowRadius);
            gradient.addColorStop(0, COLORS.goalGlow);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.fillRect(gx - glowRadius, gy - glowRadius, glowRadius * 2, glowRadius * 2);

            ctx.fillStyle = COLORS.goal;
            this._drawRoundedRect(game.goal.x * cellSize + 2, game.goal.y * cellSize + 2, cellSize - 4, cellSize - 4, 3);

            // Star icon
            ctx.fillStyle = '#fff';
            ctx.font = `${cellSize * 0.5}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', gx, gy);
        }

        // Monster
        if (this._isVisible(game, game.monster.x, game.monster.y)) {
            ctx.fillStyle = COLORS.monster;
            this._drawRoundedRect(game.monster.x * cellSize + 2, game.monster.y * cellSize + 2, cellSize - 4, cellSize - 4, 3);

            ctx.fillStyle = '#fff';
            ctx.font = `${cellSize * 0.55}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('👾', game.monster.x * cellSize + cellSize / 2, game.monster.y * cellSize + cellSize / 2);
        }

        // Player
        ctx.fillStyle = COLORS.player;
        this._drawRoundedRect(game.player.x * cellSize + 1, game.player.y * cellSize + 1, cellSize - 2, cellSize - 2, 4);

        ctx.fillStyle = '#fff';
        ctx.font = `${cellSize * 0.55}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧙', game.player.x * cellSize + cellSize / 2, game.player.y * cellSize + cellSize / 2);
    }

    _isVisible(game, x, y) {
        if (game.config.fogRadius === null) return true;
        const dist = Math.abs(game.player.x - x) + Math.abs(game.player.y - y);
        return dist <= game.config.fogRadius;
    }

    _drawRoundedRect(x, y, w, h, r) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + w - r, y);
        this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        this.ctx.lineTo(x + w, y + h - r);
        this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.ctx.lineTo(x + r, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
        this.ctx.fill();
    }
}

// ============ HIGH SCORE MANAGER ============

class HighScoreManager {
    constructor() {
        this.key = 'labirinto_scores';
    }

    getScores() {
        try {
            return JSON.parse(localStorage.getItem(this.key)) || [];
        } catch {
            return [];
        }
    }

    addScore(score, difficulty) {
        const scores = this.getScores();
        const entry = {
            score,
            difficulty,
            label: DIFFICULTY[difficulty].label,
            date: new Date().toLocaleDateString('pt-BR'),
        };
        scores.push(entry);
        scores.sort((a, b) => b.score - a.score);
        const top = scores.slice(0, 5);
        localStorage.setItem(this.key, JSON.stringify(top));
        return top.findIndex(s => s === entry) !== -1;
    }
}

// ============ UI CONTROLLER ============

class UIController {
    constructor() {
        // Screens
        this.startScreen = document.getElementById('startScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.choiceModal = document.getElementById('choiceModal');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.victoryScreen = document.getElementById('victoryScreen');

        // HUD
        this.hudMoves = document.getElementById('hudMoves');
        this.hudScore = document.getElementById('hudScore');
        this.hudLevel = document.getElementById('hudLevel');

        // Monster info
        this.monsterMovesList = document.getElementById('monsterMovesList');
        this.modalMovesList = document.getElementById('modalMovesList');

        // Score list
        this.scoreList = document.getElementById('scoreList');
    }

    showScreen(screen) {
        [this.startScreen, this.gameScreen].forEach(s => s.classList.remove('active'));
        screen.classList.add('active');
    }

    showModal(modal) {
        modal.classList.add('active');
    }

    hideModal(modal) {
        modal.classList.remove('active');
    }

    hideAllModals() {
        [this.choiceModal, this.gameOverScreen, this.victoryScreen].forEach(m => m.classList.remove('active'));
    }

    updateHUD(game) {
        this.hudMoves.textContent = game.movesLeft;
        this.hudScore.textContent = game.score;
        this.hudLevel.textContent = game.config.label;

        // Color code moves remaining
        if (game.movesLeft <= 20) {
            this.hudMoves.style.color = '#ef4444';
        } else if (game.movesLeft <= 50) {
            this.hudMoves.style.color = '#f59e0b';
        } else {
            this.hudMoves.style.color = '';
        }
    }

    updateMonsterMoves(moves) {
        this.monsterMovesList.innerHTML = moves
            .map(m => `<span class="move-tag">${MOVE_NAMES[m]}</span>`)
            .join('');
    }

    showChoiceModal(moves) {
        this.modalMovesList.innerHTML = moves
            .map(m => `<span class="move-tag">${MOVE_NAMES[m]}</span>`)
            .join('');
        this.showModal(this.choiceModal);
    }

    showGameOver(reason, game) {
        document.getElementById('gameOverReason').textContent =
            reason === 'lose_monster' ? 'Voce foi pego pelo monstro!' : 'Seus movimentos acabaram!';

        document.getElementById('gameOverStats').innerHTML = `
            <div class="result-stat">
                <div class="result-stat-value" style="color:#f59e0b">${game.config.maxMoves - game.movesLeft}</div>
                <div class="result-stat-label">Movimentos</div>
            </div>
            <div class="result-stat">
                <div class="result-stat-value" style="color:#94a3b8">${game.getElapsedSeconds()}s</div>
                <div class="result-stat-label">Tempo</div>
            </div>
        `;
        this.showModal(this.gameOverScreen);
    }

    showVictory(game, finalScore, isNewRecord) {
        document.getElementById('victoryStats').innerHTML = `
            ${isNewRecord ? '<span class="new-record">Novo Recorde!</span>' : ''}
            <div class="result-stat">
                <div class="result-stat-value" style="color:#22c55e">${finalScore}</div>
                <div class="result-stat-label">Pontuacao</div>
            </div>
            <div class="result-stat">
                <div class="result-stat-value" style="color:#f59e0b">${game.movesLeft}</div>
                <div class="result-stat-label">Movs restantes</div>
            </div>
            <div class="result-stat">
                <div class="result-stat-value" style="color:#94a3b8">${game.getElapsedSeconds()}s</div>
                <div class="result-stat-label">Tempo</div>
            </div>
        `;
        this.showModal(this.victoryScreen);
    }

    renderHighScores(scores) {
        if (scores.length === 0) {
            this.scoreList.innerHTML = '<p class="no-scores">Nenhuma pontuacao ainda</p>';
            return;
        }

        this.scoreList.innerHTML = scores.map((s, i) => `
            <div class="score-entry">
                <span class="score-rank">#${i + 1}</span>
                <span class="score-points">${s.score}</span>
                <span class="score-difficulty">${s.label}</span>
            </div>
        `).join('');
    }

    shakeCanvas() {
        const wrapper = document.getElementById('canvasWrapper');
        wrapper.classList.add('shake');
        setTimeout(() => wrapper.classList.remove('shake'), 400);
    }
}

// ============ INPUT HANDLER ============

class InputHandler {
    constructor(onMove) {
        this.onMove = onMove;
        this.enabled = true;

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (!this.enabled) return;
            const keyMap = {
                'ArrowUp': [0, -1], 'ArrowDown': [0, 1], 'ArrowLeft': [-1, 0], 'ArrowRight': [1, 0],
                'w': [0, -1], 's': [0, 1], 'a': [-1, 0], 'd': [1, 0],
                'W': [0, -1], 'S': [0, 1], 'A': [-1, 0], 'D': [1, 0],
            };
            const dir = keyMap[e.key];
            if (dir) {
                e.preventDefault();
                this.onMove(dir[0], dir[1]);
            }
        });

        // Touch buttons
        document.querySelectorAll('.touch-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.enabled) return;
                const dirMap = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
                const dir = dirMap[btn.dataset.dir];
                if (dir) this.onMove(dir[0], dir[1]);
            });
        });

        // Swipe detection on canvas
        this._setupSwipe();
    }

    _setupSwipe() {
        const canvas = document.getElementById('mazeCanvas');
        let startX, startY;

        canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        }, { passive: true });

        canvas.addEventListener('touchend', (e) => {
            if (!this.enabled) return;
            const touch = e.changedTouches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            const minSwipe = 30;

            if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

            if (Math.abs(dx) > Math.abs(dy)) {
                this.onMove(dx > 0 ? 1 : -1, 0);
            } else {
                this.onMove(0, dy > 0 ? 1 : -1);
            }
        }, { passive: true });
    }
}

// ============ APP (MAIN CONTROLLER) ============

class App {
    constructor() {
        this.sound = new SoundManager();
        this.scores = new HighScoreManager();
        this.ui = new UIController();
        this.renderer = new Renderer(
            document.getElementById('mazeCanvas'),
            document.getElementById('canvasWrapper')
        );
        this.input = new InputHandler((dx, dy) => this.handlePlayerMove(dx, dy));
        this.game = null;
        this.selectedDifficulty = 'medium';

        this._bindEvents();
        this.ui.renderHighScores(this.scores.getScores());
    }

    _bindEvents() {
        // Difficulty buttons
        document.querySelectorAll('.btn-difficulty').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-difficulty').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedDifficulty = btn.dataset.difficulty;
            });
        });

        // Play button
        document.getElementById('btnPlay').addEventListener('click', () => {
            this.sound.resume();
            this.startGame(this.selectedDifficulty);
        });

        // Choice buttons
        document.querySelector('.btn-pilha').addEventListener('click', () => {
            this.sound.choice();
            this.game.applyChoice('stack');
            this.ui.hideModal(this.ui.choiceModal);
            this.ui.updateMonsterMoves(this.game.currentMoves);
            this._doMonsterTurn();
        });

        document.querySelector('.btn-fila').addEventListener('click', () => {
            this.sound.choice();
            this.game.applyChoice('queue');
            this.ui.hideModal(this.ui.choiceModal);
            this.ui.updateMonsterMoves(this.game.currentMoves);
            this._doMonsterTurn();
        });

        // Retry / Menu buttons
        document.getElementById('btnRetry').addEventListener('click', () => {
            this.ui.hideAllModals();
            this.startGame(this.game.difficulty);
        });

        document.getElementById('btnGameOverMenu').addEventListener('click', () => {
            this.ui.hideAllModals();
            this.ui.showScreen(this.ui.startScreen);
        });

        document.getElementById('btnNextLevel').addEventListener('click', () => {
            this.ui.hideAllModals();
            const levels = ['easy', 'medium', 'hard'];
            const next = levels[Math.min(levels.indexOf(this.game.difficulty) + 1, levels.length - 1)];
            this.startGame(next);
        });

        document.getElementById('btnVictoryMenu').addEventListener('click', () => {
            this.ui.hideAllModals();
            this.ui.renderHighScores(this.scores.getScores());
            this.ui.showScreen(this.ui.startScreen);
        });

        document.getElementById('btnBackToMenu').addEventListener('click', () => {
            this.ui.hideAllModals();
            this.ui.renderHighScores(this.scores.getScores());
            this.ui.showScreen(this.ui.startScreen);
        });

        // Resize handler
        window.addEventListener('resize', () => {
            if (this.game) {
                this.renderer.resize(this.game);
                this.renderer.render(this.game);
            }
        });
    }

    startGame(difficulty) {
        this.game = new Game(difficulty);
        this.input.enabled = true;

        this.ui.showScreen(this.ui.gameScreen);
        this.ui.hideAllModals();
        this.ui.updateHUD(this.game);
        this.ui.updateMonsterMoves(this.game.currentMoves);

        // Wait a tick for layout to settle, then resize canvas
        requestAnimationFrame(() => {
            this.renderer.resize(this.game);
            this.renderer.render(this.game);
        });
    }

    handlePlayerMove(dx, dy) {
        if (!this.game || this.game.turn !== 'player') return;

        const result = this.game.movePlayer(dx, dy);
        if (!result) return; // couldn't move

        this.sound.move();
        this.ui.updateHUD(this.game);
        this.renderer.render(this.game);

        if (result === 'win') {
            this._handleWin();
        } else if (result === 'lose_monster' || result === 'lose_moves') {
            this._handleLose(result);
        } else {
            // Monster's turn
            this.input.enabled = false;
            setTimeout(() => this._processMonsterTurn(), this.game.config.monsterDelay);
        }
    }

    _processMonsterTurn() {
        if (!this.game || this.game.turn !== 'monster') return;

        // Check if we need a new choice
        if (this.game.needsChoice()) {
            this.game.turn = 'choosing';
            this.ui.showChoiceModal(this.game.nextMoves);
            return;
        }

        this._doMonsterTurn();
    }

    _doMonsterTurn() {
        const move = this.game.getNextMonsterMove();
        if (move === null) {
            this.game.turn = 'player';
            this.input.enabled = true;
            return;
        }

        this.sound.monster();
        const result = this.game.executeMonsterMove(move);
        this.ui.updateMonsterMoves(this.game.currentMoves);
        this.renderer.render(this.game);

        if (result === 'lose_monster') {
            this._handleLose('lose_monster');
        } else {
            this.input.enabled = true;
        }
    }

    _handleWin() {
        this.input.enabled = false;
        this.sound.win();

        const finalScore = this.game.calculateFinalScore();
        const isNewRecord = this.scores.addScore(finalScore, this.game.difficulty);

        setTimeout(() => {
            this.ui.showVictory(this.game, finalScore, isNewRecord);
        }, 500);
    }

    _handleLose(reason) {
        this.input.enabled = false;
        this.sound.lose();
        this.ui.shakeCanvas();

        setTimeout(() => {
            this.ui.showGameOver(reason, this.game);
        }, 600);
    }
}

// ============ START ============

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
