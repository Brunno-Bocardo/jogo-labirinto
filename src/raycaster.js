import { COLORS, DIR_ANGLE, DIR_DELTA } from './config.js';

export class Raycaster {
    constructor(canvas, wrapper) {
        this.canvas = canvas;
        this.wrapper = wrapper;
        this.ctx = canvas.getContext('2d');
        this.fov = Math.PI / 3;
        this.numRays = 240;
        this.w = 0;
        this.h = 0;
    }

    resize() {
        const w = this.wrapper.clientWidth;
        const h = this.wrapper.clientHeight || w;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.w = w;
        this.h = h;
    }

    render(game) {
        const { ctx, w, h, fov, numRays } = this;
        const angle = DIR_ANGLE[game.playerDir];
        const px = game.player.x + 0.5, py = game.player.y + 0.5;

        // Sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h / 2);
        skyGrad.addColorStop(0, '#050510');
        skyGrad.addColorStop(1, '#151528');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h / 2);

        // Floor
        const floorGrad = ctx.createLinearGradient(0, h / 2, 0, h);
        floorGrad.addColorStop(0, '#1a1a2e');
        floorGrad.addColorStop(1, '#0a0a12');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, h / 2, w, h / 2);

        // Raycast walls
        const zBuffer = new Float32Array(numRays);
        const stripW = Math.ceil(w / numRays);

        for (let i = 0; i < numRays; i++) {
            const rayAngle = angle - fov / 2 + (fov * i) / numRays;
            const { dist, side } = this._castRay(game, px, py, rayAngle);
            const corrected = dist * Math.cos(rayAngle - angle);
            zBuffer[i] = corrected;

            const wallH = h / corrected;
            const top = (h - wallH) / 2;
            const shade = side === 0 ? 0.7 : 1.0;
            const intensity = Math.max(0.08, 1 - corrected / 14);
            const r = Math.floor(45 * shade * intensity);
            const g = Math.floor(55 * shade * intensity);
            const b = Math.floor(100 * shade * intensity);

            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(i * stripW, top, stripW + 1, wallH);
        }

        // Sprites
        this._renderSprite(game, game.monster, '👾', '#ef4444', angle, zBuffer);
        this._renderSprite(game, game.goal, '⭐', '#22c55e', angle, zBuffer);

        // Minimap
        this._renderMinimap(game);

        // Compass
        const dirs = ['N', 'E', 'S', 'W'];
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(dirs[game.playerDir], w / 2, 20);
    }

    _castRay(game, px, py, angle) {
        const dx = Math.cos(angle), dy = Math.sin(angle);
        const stepX = dx > 0 ? 1 : -1, stepY = dy > 0 ? 1 : -1;
        let mapX = Math.floor(px), mapY = Math.floor(py);
        const ddx = Math.abs(1 / dx), ddy = Math.abs(1 / dy);
        let sdx = (dx > 0 ? mapX + 1 - px : px - mapX) * ddx;
        let sdy = (dy > 0 ? mapY + 1 - py : py - mapY) * ddy;
        let side = 0, steps = 0;

        while (steps++ < 100) {
            if (sdx < sdy) { sdx += ddx; mapX += stepX; side = 0; }
            else { sdy += ddy; mapY += stepY; side = 1; }
            if (mapX < 0 || mapX >= game.config.cols || mapY < 0 || mapY >= game.config.rows) break;
            if (game.maze[mapY][mapX] === 0) break;
        }

        const dist = side === 0 ? sdx - ddx : sdy - ddy;
        return { dist: Math.max(dist, 0.1), side };
    }

    _renderSprite(game, obj, emoji, color, playerAngle, zBuffer) {
        const { ctx, w, h, fov, numRays } = this;
        const px = game.player.x + 0.5, py = game.player.y + 0.5;
        const dx = obj.x + 0.5 - px, dy = obj.y + 0.5 - py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.3) return;
        if (game.config.fogRadius && dist > game.config.fogRadius) return;

        let relAngle = Math.atan2(dy, dx) - playerAngle;
        while (relAngle > Math.PI) relAngle -= 2 * Math.PI;
        while (relAngle < -Math.PI) relAngle += 2 * Math.PI;
        if (Math.abs(relAngle) > fov / 2 + 0.2) return;

        const screenX = w / 2 + (relAngle / (fov / 2)) * (w / 2);
        const spriteSize = Math.min(h * 0.8, h / dist * 0.6);
        const rayIdx = Math.floor(screenX / w * numRays);

        if (rayIdx >= 0 && rayIdx < numRays && dist > zBuffer[rayIdx]) return;

        // Glow
        const glowGrad = ctx.createRadialGradient(screenX, h / 2, 0, screenX, h / 2, spriteSize * 0.8);
        glowGrad.addColorStop(0, color + '40');
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(screenX - spriteSize, h / 2 - spriteSize, spriteSize * 2, spriteSize * 2);

        ctx.font = `${spriteSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, screenX, h / 2);
    }

    _renderMinimap(game) {
        const { ctx, w } = this;
        const mapSize = Math.min(120, w * 0.25);
        const padding = 8;
        const mx = w - mapSize - padding, my = padding;
        const cs = mapSize / Math.max(game.config.rows, game.config.cols);
        const { rows, cols, fogRadius } = game.config;

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(mx - 2, my - 2, mapSize + 4, mapSize + 4);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (fogRadius && Math.abs(game.player.x - c) + Math.abs(game.player.y - r) > fogRadius) {
                    ctx.fillStyle = 'rgba(10,10,15,0.8)';
                } else {
                    ctx.fillStyle = game.maze[r][c] === 0 ? '#1e293b' : '#0f172a';
                }
                ctx.fillRect(mx + c * cs, my + r * cs, cs, cs);
            }
        }

        // Goal
        ctx.fillStyle = COLORS.goal;
        ctx.fillRect(mx + game.goal.x * cs, my + game.goal.y * cs, cs, cs);
        // Monster
        ctx.fillStyle = COLORS.monster;
        ctx.fillRect(mx + game.monster.x * cs, my + game.monster.y * cs, cs, cs);
        // Player
        ctx.fillStyle = COLORS.player;
        ctx.fillRect(mx + game.player.x * cs, my + game.player.y * cs, cs, cs);

        // Direction indicator
        const pcx = mx + game.player.x * cs + cs / 2;
        const pcy = my + game.player.y * cs + cs / 2;
        const dd = DIR_DELTA[game.playerDir];
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pcx, pcy);
        ctx.lineTo(pcx + dd.dx * cs * 1.2, pcy + dd.dy * cs * 1.2);
        ctx.stroke();
    }
}
