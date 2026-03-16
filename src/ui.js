import { MOVE_NAMES, MAZE_TYPES, LEVELS } from './config.js';

export class UI {
    constructor() {
        this.screens = {
            start: document.getElementById('startScreen'),
            levels: document.getElementById('levelScreen'),
            quick: document.getElementById('quickPlayScreen'),
            game: document.getElementById('gameScreen'),
        };
        this.modals = {
            choice: document.getElementById('choiceModal'),
            gameOver: document.getElementById('gameOverScreen'),
            victory: document.getElementById('victoryScreen'),
        };
    }

    showScreen(name) {
        Object.values(this.screens).forEach(s => s.classList.remove('active'));
        this.screens[name].classList.add('active');
    }

    showModal(name) { this.modals[name].classList.add('active'); }
    hideModal(name) { this.modals[name].classList.remove('active'); }
    hideAllModals() { Object.values(this.modals).forEach(m => m.classList.remove('active')); }

    updateHUD(game) {
        document.getElementById('hudMoves').textContent = game.movesLeft;
        document.getElementById('hudScore').textContent = game.score;
        const movesEl = document.getElementById('hudMoves');
        movesEl.style.color = game.movesLeft <= 20 ? '#ef4444' : game.movesLeft <= 50 ? '#f59e0b' : '';
    }

    setHUDLevel(label) {
        document.getElementById('hudLevel').textContent = label;
    }

    updateMonsterMoves(moves) {
        document.getElementById('monsterMovesList').innerHTML =
            moves.map(m => `<span class="move-tag">${MOVE_NAMES[m]}</span>`).join('');
    }

    showChoiceModal(moves) {
        document.getElementById('modalMovesList').innerHTML =
            moves.map(m => `<span class="move-tag">${MOVE_NAMES[m]}</span>`).join('');
        this.showModal('choice');
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
                <div class="result-stat-value" style="color:#94a3b8">${game.getElapsed()}s</div>
                <div class="result-stat-label">Tempo</div>
            </div>`;
        this.showModal('gameOver');
    }

    showVictory(game, finalScore, stars, isRecord) {
        const starsHTML = '★'.repeat(stars) + '☆'.repeat(3 - stars);
        document.getElementById('victoryStats').innerHTML = `
            ${isRecord ? '<span class="new-record">Novo Recorde!</span>' : ''}
            <div class="result-stars">${starsHTML}</div>
            <div class="result-stat">
                <div class="result-stat-value" style="color:#22c55e">${finalScore}</div>
                <div class="result-stat-label">Pontuacao</div>
            </div>
            <div class="result-stat">
                <div class="result-stat-value" style="color:#f59e0b">${game.movesLeft}</div>
                <div class="result-stat-label">Movs restantes</div>
            </div>
            <div class="result-stat">
                <div class="result-stat-value" style="color:#94a3b8">${game.getElapsed()}s</div>
                <div class="result-stat-label">Tempo</div>
            </div>`;
        this.showModal('victory');
    }

    renderScores(scores) {
        const el = document.getElementById('scoreList');
        if (!scores.length) {
            el.innerHTML = '<p class="no-scores">Nenhuma pontuacao ainda</p>';
            return;
        }
        el.innerHTML = scores.map((s, i) => `
            <div class="score-entry">
                <span class="score-rank">#${i + 1}</span>
                <span class="score-points">${s.score}</span>
                <span class="score-difficulty">${s.label}</span>
            </div>
        `).join('');
    }

    renderLevelSelect(campaign) {
        const grid = document.getElementById('levelGrid');
        const worlds = {};
        LEVELS.forEach((lv, i) => {
            if (!worlds[lv.world]) worlds[lv.world] = [];
            worlds[lv.world].push({ ...lv, idx: i });
        });

        grid.innerHTML = Object.entries(worlds).map(([worldName, levels]) => {
            const mazeType = MAZE_TYPES[levels[0].maze];
            return `
                <div class="world-section">
                    <h4>${mazeType.icon} ${worldName}</h4>
                    <div class="world-levels">
                        ${levels.map(lv => {
                            const unlocked = campaign.isUnlocked(lv.idx);
                            const stars = campaign.getStars(lv.idx);
                            const starsHTML = Array.from({ length: 3 }, (_, i) =>
                                `<span class="${i < stars ? 'star-filled' : 'star-empty'}">${i < stars ? '★' : '☆'}</span>`
                            ).join('');
                            const badges = [
                                lv.force3d ? '<span class="level-badge badge-3d">3D</span>' : '',
                                lv.fog ? '<span class="level-badge badge-fog">FOG</span>' : '',
                            ].filter(Boolean).join(' ');
                            return `
                                <button class="level-btn ${unlocked ? '' : 'locked'}" data-level="${lv.idx}" ${unlocked ? '' : 'disabled'}>
                                    <span class="level-num">${lv.idx + 1}</span>
                                    <span class="level-name">${lv.name}</span>
                                    <span class="level-stars">${starsHTML}</span>
                                    ${badges}
                                </button>`;
                        }).join('')}
                    </div>
                </div>`;
        }).join('');
    }

    shakeCanvas() {
        const w = document.getElementById('canvasWrapper');
        w.classList.add('shake');
        setTimeout(() => w.classList.remove('shake'), 400);
    }

    set3DToggle(active) {
        const btn = document.getElementById('btnToggle3D');
        btn.textContent = active ? '2D' : '3D';
        btn.classList.toggle('active', active);
    }
}
