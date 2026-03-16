export class CampaignManager {
    constructor() {
        this.key = 'labirinto_campaign';
    }

    getProgress() {
        try { return JSON.parse(localStorage.getItem(this.key)) || {}; }
        catch { return {}; }
    }

    isUnlocked(levelIdx) {
        if (levelIdx === 0) return true;
        return this.getProgress()[levelIdx - 1]?.completed === true;
    }

    getStars(levelIdx) {
        return this.getProgress()[levelIdx]?.stars || 0;
    }

    complete(levelIdx, stars) {
        const progress = this.getProgress();
        const existing = progress[levelIdx]?.stars || 0;
        progress[levelIdx] = { completed: true, stars: Math.max(existing, stars) };
        localStorage.setItem(this.key, JSON.stringify(progress));
    }
}
