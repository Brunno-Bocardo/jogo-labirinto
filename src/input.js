export class InputHandler {
    constructor(onAction) {
        this.onAction = onAction;
        this.enabled = true;

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (!this.enabled) return;
            const map = {
                'ArrowUp': 'up', 'ArrowDown': 'down', 'ArrowLeft': 'left', 'ArrowRight': 'right',
                'w': 'up', 's': 'down', 'a': 'left', 'd': 'right',
                'W': 'up', 'S': 'down', 'A': 'left', 'D': 'right',
            };
            if (map[e.key]) {
                e.preventDefault();
                this.onAction(map[e.key]);
            }
        });

        // Touch buttons
        document.querySelectorAll('.touch-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.enabled) this.onAction(btn.dataset.dir);
            });
        });

        // Swipe
        this._setupSwipe();
    }

    _setupSwipe() {
        const canvas = document.getElementById('mazeCanvas');
        let sx, sy;

        canvas.addEventListener('touchstart', (e) => {
            sx = e.touches[0].clientX;
            sy = e.touches[0].clientY;
        }, { passive: true });

        canvas.addEventListener('touchend', (e) => {
            if (!this.enabled) return;
            const dx = e.changedTouches[0].clientX - sx;
            const dy = e.changedTouches[0].clientY - sy;
            if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;

            if (Math.abs(dx) > Math.abs(dy)) this.onAction(dx > 0 ? 'right' : 'left');
            else this.onAction(dy > 0 ? 'down' : 'up');
        }, { passive: true });
    }
}
