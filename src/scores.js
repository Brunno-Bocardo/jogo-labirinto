export class HighScoreManager {
    constructor() {
        this.key = 'labirinto_scores';
    }

    getScores() {
        try { return JSON.parse(localStorage.getItem(this.key)) || []; }
        catch { return []; }
    }

    addScore(score, label) {
        const scores = this.getScores();
        scores.push({ score, label, date: new Date().toLocaleDateString('pt-BR') });
        scores.sort((a, b) => b.score - a.score);
        const top = scores.slice(0, 5);
        localStorage.setItem(this.key, JSON.stringify(top));
        return top[0]?.score === score;
    }
}
