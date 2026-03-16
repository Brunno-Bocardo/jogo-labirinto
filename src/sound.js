export class SoundManager {
    constructor() {
        this.enabled = true;
        try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch { this.enabled = false; }
    }

    _play(freq, dur, type = 'square', vol = 0.06) {
        if (!this.enabled) return;
        try {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = type;
            o.frequency.value = freq;
            g.gain.value = vol;
            g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
            o.connect(g);
            g.connect(this.ctx.destination);
            o.start();
            o.stop(this.ctx.currentTime + dur);
        } catch { /* ignore audio errors */ }
    }

    move()    { this._play(440, 0.08, 'square', 0.04); }
    monster() { this._play(180, 0.15, 'sawtooth', 0.03); }
    choice()  { this._play(660, 0.1, 'sine', 0.05); }
    hit()     { this._play(120, 0.4, 'sawtooth', 0.08); }

    win() {
        [523, 659, 784, 1047].forEach((f, i) =>
            setTimeout(() => this._play(f, 0.2, 'sine', 0.07), i * 150)
        );
    }

    lose() {
        [400, 350, 300, 200].forEach((f, i) =>
            setTimeout(() => this._play(f, 0.25, 'sawtooth', 0.05), i * 180)
        );
    }

    resume() {
        if (this.ctx?.state === 'suspended') this.ctx.resume();
    }
}
