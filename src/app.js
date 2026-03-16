import { DIFFICULTY, LEVELS } from './config.js';
import { SoundManager } from './sound.js';
import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { Raycaster } from './raycaster.js';
import { CampaignManager } from './campaign.js';
import { HighScoreManager } from './scores.js';
import { UI } from './ui.js';
import { InputHandler } from './input.js';

export class App {
    constructor() {
        this.sound = new SoundManager();
        this.scores = new HighScoreManager();
        this.campaign = new CampaignManager();
        this.ui = new UI();

        const canvas = document.getElementById('mazeCanvas');
        const wrapper = document.getElementById('canvasWrapper');
        this.renderer = new Renderer(canvas, wrapper);
        this.raycaster = new Raycaster(canvas, wrapper);
        this.input = new InputHandler(action => this.handleAction(action));

        this.game = null;
        this.selectedDifficulty = 'medium';
        this.selectedMaze = 'dfs';
        this.mode = 'menu';
        this.campaignLevel = null;

        this._bind();
        this.ui.renderScores(this.scores.getScores());
    }

    _bind() {
        // Start screen
        document.getElementById('btnCampaign').addEventListener('click', () => {
            this.sound.resume();
            this.ui.renderLevelSelect(this.campaign);
            this.ui.showScreen('levels');
        });
        document.getElementById('btnQuickPlay').addEventListener('click', () => {
            this.sound.resume();
            this.ui.showScreen('quick');
        });

        // Level select
        document.getElementById('btnLevelBack').addEventListener('click', () => this.ui.showScreen('start'));
        document.getElementById('levelGrid').addEventListener('click', (e) => {
            const btn = e.target.closest('.level-btn');
            if (!btn || btn.disabled) return;
            this.campaignLevel = parseInt(btn.dataset.level);
            this.mode = 'campaign';
            this._startCampaignLevel(this.campaignLevel);
        });

        // Quick play
        document.getElementById('btnQuickBack').addEventListener('click', () => this.ui.showScreen('start'));

        document.querySelectorAll('[data-difficulty]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-difficulty]').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedDifficulty = btn.dataset.difficulty;
            });
        });

        document.querySelectorAll('[data-maze]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-maze]').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedMaze = btn.dataset.maze;
            });
        });

        document.getElementById('btnStartQuick').addEventListener('click', () => {
            this.mode = 'quick';
            this._startQuickGame();
        });

        // 3D toggle
        document.getElementById('btnToggle3D').addEventListener('click', () => {
            if (!this.game) return;
            this.game.is3D = !this.game.is3D;
            this.ui.set3DToggle(this.game.is3D);
            this._resize();
            this._render();
        });

        // Choice buttons
        document.querySelector('.btn-pilha').addEventListener('click', () => this._makeChoice('stack'));
        document.querySelector('.btn-fila').addEventListener('click', () => this._makeChoice('queue'));
        document.querySelector('.btn-random').addEventListener('click', () => {
            this._makeChoice(Math.random() < 0.5 ? 'stack' : 'queue');
        });

        // Result buttons
        document.getElementById('btnRetry').addEventListener('click', () => {
            this.ui.hideAllModals();
            if (this.mode === 'campaign') this._startCampaignLevel(this.campaignLevel);
            else this._startQuickGame();
        });

        document.getElementById('btnGameOverMenu').addEventListener('click', () => this._goMenu());

        document.getElementById('btnNextLevel').addEventListener('click', () => {
            this.ui.hideAllModals();
            if (this.mode === 'campaign') {
                const next = Math.min(this.campaignLevel + 1, LEVELS.length - 1);
                if (this.campaign.isUnlocked(next)) {
                    this.campaignLevel = next;
                    this._startCampaignLevel(next);
                } else {
                    this._goMenu();
                }
            } else {
                this._startQuickGame();
            }
        });

        document.getElementById('btnVictoryMenu').addEventListener('click', () => this._goMenu());
        document.getElementById('btnBackToMenu').addEventListener('click', () => this._goMenu());

        // Resize
        window.addEventListener('resize', () => {
            if (this.game) { this._resize(); this._render(); }
        });
    }

    _goMenu() {
        this.ui.hideAllModals();
        this.ui.renderScores(this.scores.getScores());
        this.ui.showScreen('start');
    }

    _startCampaignLevel(idx) {
        const lv = LEVELS[idx];
        const config = {
            rows: lv.rows, cols: lv.cols, maxMoves: lv.maxMoves,
            choiceEvery: lv.choiceEvery, fogRadius: lv.fog,
            monsterDelay: 800, mazeType: lv.maze,
            multiplier: Math.ceil((idx + 1) / 4),
            force3d: lv.force3d || false,
        };
        this.game = new Game(config);
        this.ui.setHUDLevel(`Fase ${idx + 1}`);
        this.ui.set3DToggle(this.game.is3D);
        this._startGame();
    }

    _startQuickGame() {
        const diff = DIFFICULTY[this.selectedDifficulty];
        this.game = new Game({ ...diff, mazeType: this.selectedMaze });
        this.ui.setHUDLevel(diff.label);
        this.ui.set3DToggle(this.game.is3D);
        this._startGame();
    }

    _startGame() {
        this.input.enabled = true;
        this.ui.showScreen('game');
        this.ui.hideAllModals();
        this.ui.updateHUD(this.game);
        this.ui.updateMonsterMoves(this.game.currentMoves);
        requestAnimationFrame(() => { this._resize(); this._render(); });
    }

    _resize() {
        if (this.game.is3D) this.raycaster.resize();
        else this.renderer.resize(this.game);
    }

    _render() {
        if (this.game.is3D) this.raycaster.render(this.game);
        else this.renderer.render(this.game);
    }

    handleAction(action) {
        if (!this.game || this.game.turn !== 'player') return;

        let result;
        if (this.game.is3D) {
            const map3D = { up: 'forward', down: 'backward', left: 'rotateLeft', right: 'rotateRight' };
            result = this.game.movePlayer3D(map3D[action]);
            if (result === 'rotated') { this._render(); return; }
        } else {
            const dirMap = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
            const d = dirMap[action];
            result = this.game.movePlayer(d[0], d[1]);
        }

        if (!result) return;
        this.sound.move();
        this.ui.updateHUD(this.game);
        this._render();

        if (result === 'win') this._handleWin();
        else if (result === 'lose_monster' || result === 'lose_moves') this._handleLose(result);
        else {
            this.input.enabled = false;
            setTimeout(() => this._processMonster(), this.game.config.monsterDelay);
        }
    }

    _processMonster() {
        if (!this.game || this.game.turn !== 'monster') return;
        if (this.game.needsChoice()) {
            this.game.turn = 'choosing';
            this.ui.showChoiceModal(this.game.nextMoves);
            return;
        }
        this._doMonsterTurn();
    }

    _makeChoice(type) {
        this.sound.choice();
        this.game.applyChoice(type);
        this.ui.hideModal('choice');
        this.ui.updateMonsterMoves(this.game.currentMoves);
        this._doMonsterTurn();
    }

    _doMonsterTurn() {
        const move = this.game.getNextMonsterMove();
        if (!move) { this.game.turn = 'player'; this.input.enabled = true; return; }
        this.sound.monster();
        const result = this.game.executeMonsterMove(move);
        this.ui.updateMonsterMoves(this.game.currentMoves);
        this._render();
        if (result === 'lose_monster') this._handleLose('lose_monster');
        else this.input.enabled = true;
    }

    _handleWin() {
        this.input.enabled = false;
        this.sound.win();
        const finalScore = this.game.getFinalScore();
        const stars = this.game.getStars();
        const label = this.mode === 'campaign'
            ? `Fase ${this.campaignLevel + 1}`
            : DIFFICULTY[this.selectedDifficulty].label;
        const isRecord = this.scores.addScore(finalScore, label);
        if (this.mode === 'campaign') this.campaign.complete(this.campaignLevel, stars);
        setTimeout(() => this.ui.showVictory(this.game, finalScore, stars, isRecord), 500);
    }

    _handleLose(reason) {
        this.input.enabled = false;
        this.sound.lose();
        this.ui.shakeCanvas();
        setTimeout(() => this.ui.showGameOver(reason, this.game), 600);
    }
}
