import { COLORS, DIR_DELTA } from './config.js';

export class Renderer {
    constructor(canvas, wrapper) {
        this.canvas = canvas;
        this.wrapper = wrapper;
        this.ctx = canvas.getContext('2d');
        this.cellSize = 0;
        this.size = 0;
    }

    resize(game) {
        const size = Math.min(this.wrapper.clientWidth, this.wrapper.clientHeight);
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = size * dpr;
        this.canvas.height = size * dpr;
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.cellSize = size / Math.max(game.config.rows, game.config.cols);
        this.size = size;
    }

    render(game) {
        const { ctx, cellSize, size } = this;
        const { rows, cols, fogRadius } = game.config;
        ctx.clearRect(0, 0, size, size);

        // Maze cells
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (fogRadius && Math.abs(game.player.x - c) + Math.abs(game.player.y - r) > fogRadius) {
                    ctx.fillStyle = COLORS.fog;
                } else {
                    ctx.fillStyle = game.maze[r][c] === 0 ? COLORS.wall : COLORS.path;
                }
                ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            }
        }

        // Grid lines
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 0.5;
        for (let r = 0; r <= rows; r++) {
            ctx.beginPath(); ctx.moveTo(0, r * cellSize); ctx.lineTo(cols * cellSize, r * cellSize); ctx.stroke();
        }
        for (let c = 0; c <= cols; c++) {
            ctx.beginPath(); ctx.moveTo(c * cellSize, 0); ctx.lineTo(c * cellSize, rows * cellSize); ctx.stroke();
        }

        // Goal
        if (this._visible(game, game.goal)) {
            const gx = game.goal.x * cellSize + cellSize / 2;
            const gy = game.goal.y * cellSize + cellSize / 2;
            const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, cellSize * 0.8);
            grad.addColorStop(0, COLORS.goalGlow);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(gx - cellSize, gy - cellSize, cellSize * 2, cellSize * 2);

            ctx.fillStyle = COLORS.goal;
            this._roundRect(game.goal.x * cellSize + 2, game.goal.y * cellSize + 2, cellSize - 4, cellSize - 4, 3);
            ctx.fillStyle = '#fff';
            ctx.font = `${cellSize * 0.5}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', gx, gy);
        }

        // Monster
        if (this._visible(game, game.monster)) {
            ctx.fillStyle = COLORS.monster;
            this._roundRect(game.monster.x * cellSize + 2, game.monster.y * cellSize + 2, cellSize - 4, cellSize - 4, 3);
            ctx.fillStyle = '#fff';
            ctx.font = `${cellSize * 0.5}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('👾', game.monster.x * cellSize + cellSize / 2, game.monster.y * cellSize + cellSize / 2);
        }

        // Player
        ctx.fillStyle = COLORS.player;
        this._roundRect(game.player.x * cellSize + 1, game.player.y * cellSize + 1, cellSize - 2, cellSize - 2, 4);
        ctx.fillStyle = '#fff';
        ctx.font = `${cellSize * 0.5}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧙', game.player.x * cellSize + cellSize / 2, game.player.y * cellSize + cellSize / 2);

        // Direction indicator (3D mode)
        if (game.is3D) {
            const px = game.player.x * cellSize + cellSize / 2;
            const py = game.player.y * cellSize + cellSize / 2;
            const dd = DIR_DELTA[game.playerDir];
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + dd.dx * cellSize * 0.4, py + dd.dy * cellSize * 0.4);
            ctx.stroke();
        }
    }

    _visible(game, p) {
        if (!game.config.fogRadius) return true;
        return Math.abs(game.player.x - p.x) + Math.abs(game.player.y - p.y) <= game.config.fogRadius;
    }

    _roundRect(x, y, w, h, r) {
        const c = this.ctx;
        c.beginPath();
        c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
        c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
        c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y);
        c.fill();
    }
}
