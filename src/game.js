import { generateMaze } from './maze/index.js';
import { DIR_DELTA } from './config.js';

function randomOpenCell(maze, rows, cols, exclude = []) {
    let x, y, attempts = 0;
    do {
        x = Math.floor(Math.random() * cols);
        y = Math.floor(Math.random() * rows);
        if (++attempts > 5000) break;
    } while (maze[y][x] === 0 || exclude.some(p => p.x === x && p.y === y));
    return { x, y };
}

function generateMoveList(size) {
    const available = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    return available.slice(0, size);
}

export class Game {
    constructor(config) {
        this.config = config;
        this.maze = generateMaze(config.mazeType || 'dfs', config.rows, config.cols);

        this.player = randomOpenCell(this.maze, config.rows, config.cols);
        this.goal = randomOpenCell(this.maze, config.rows, config.cols, [this.player]);
        this.monster = randomOpenCell(this.maze, config.rows, config.cols, [this.player, this.goal]);

        this.movesLeft = config.maxMoves;
        this.score = 0;
        this.turn = 'player';
        this.moveCount = 0;
        this.choiceType = null;
        this.currentMoves = generateMoveList(config.choiceEvery);
        this.nextMoves = generateMoveList(config.choiceEvery);
        this.movesUsedFromList = 0;
        this.startTime = Date.now();

        // 3D mode
        this.playerDir = 0; // 0=N, 1=E, 2=S, 3=W
        this.is3D = config.force3d || false;
    }

    canMove(x, y) {
        return x >= 0 && x < this.config.cols &&
               y >= 0 && y < this.config.rows &&
               this.maze[y][x] === 1;
    }

    movePlayer(dx, dy) {
        if (this.turn !== 'player') return false;
        const nx = this.player.x + dx, ny = this.player.y + dy;
        if (!this.canMove(nx, ny)) return false;

        this.player.x = nx;
        this.player.y = ny;
        this.movesLeft--;
        this.moveCount++;
        this.score += 5;

        if (this.player.x === this.goal.x && this.player.y === this.goal.y) {
            this.turn = 'ended'; return 'win';
        }
        if (this.player.x === this.monster.x && this.player.y === this.monster.y) {
            this.turn = 'ended'; return 'lose_monster';
        }
        if (this.movesLeft <= 0) {
            this.turn = 'ended'; return 'lose_moves';
        }

        this.turn = 'monster';
        return 'moved';
    }

    movePlayer3D(action) {
        if (this.turn !== 'player') return false;

        if (action === 'rotateLeft')  { this.playerDir = (this.playerDir + 3) % 4; return 'rotated'; }
        if (action === 'rotateRight') { this.playerDir = (this.playerDir + 1) % 4; return 'rotated'; }

        let dd = DIR_DELTA[this.playerDir];
        if (action === 'backward') dd = { dx: -dd.dx, dy: -dd.dy };

        return this.movePlayer(dd.dx, dd.dy);
    }

    needsChoice() {
        return this.movesUsedFromList >= this.currentMoves.length;
    }

    applyChoice(type) {
        this.choiceType = type;
        this.currentMoves = [...this.nextMoves];
        this.nextMoves = generateMoveList(this.config.choiceEvery);
        this.movesUsedFromList = 0;
    }

    getNextMonsterMove() {
        if (this.movesUsedFromList >= this.currentMoves.length) return null;

        let move;
        if (this.choiceType === 'stack') {
            move = this.currentMoves.pop();   // LIFO
        } else {
            move = this.currentMoves.shift(); // FIFO
        }
        this.movesUsedFromList++;
        return move;
    }

    executeMonsterMove(move) {
        let nx = this.monster.x, ny = this.monster.y;
        if (move === 1) ny--;
        else if (move === 2) ny++;
        else if (move === 3) nx++;
        else if (move === 4) nx--;

        if (this.canMove(nx, ny)) {
            this.monster.x = nx;
            this.monster.y = ny;
        }

        if (this.player.x === this.monster.x && this.player.y === this.monster.y) {
            this.turn = 'ended'; return 'lose_monster';
        }
        this.turn = 'player';
        return 'moved';
    }

    getElapsed() {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    getFinalScore() {
        const mult = this.config.multiplier || 1;
        return (this.score + this.movesLeft * 10 + Math.max(0, 300 - this.getElapsed()) * 2) * mult;
    }

    getStars() {
        const pct = this.movesLeft / this.config.maxMoves;
        if (pct >= 0.6) return 3;
        if (pct >= 0.3) return 2;
        return 1;
    }
}
