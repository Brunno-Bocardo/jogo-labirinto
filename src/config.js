// ============ CONFIGURACAO GLOBAL ============

export const DIFFICULTY = {
    easy:   { rows: 12, cols: 12, maxMoves: 300, monsterDelay: 1200, choiceEvery: 3, fogRadius: null, label: 'Facil',   multiplier: 1 },
    medium: { rows: 16, cols: 16, maxMoves: 200, monsterDelay: 900,  choiceEvery: 3, fogRadius: null, label: 'Medio',   multiplier: 2 },
    hard:   { rows: 22, cols: 22, maxMoves: 120, monsterDelay: 600,  choiceEvery: 4, fogRadius: 5,    label: 'Dificil', multiplier: 3 },
};

export const MAZE_TYPES = {
    dfs:     { label: 'Classico',   icon: '🔀' },
    prim:    { label: 'Ramificado', icon: '🌿' },
    kruskal: { label: 'Aleatorio',  icon: '🎲' },
    binary:  { label: 'Diagonal',   icon: '↗️' },
};

export const LEVELS = [
    // World 1 — Classico (DFS)
    { name: 'Primeiro Passo',    maze: 'dfs',     rows: 10, cols: 10, maxMoves: 250, choiceEvery: 3, fog: null, world: 'Classico' },
    { name: 'Corredor Longo',    maze: 'dfs',     rows: 12, cols: 12, maxMoves: 200, choiceEvery: 3, fog: null, world: 'Classico' },
    { name: 'Escuridao',         maze: 'dfs',     rows: 12, cols: 12, maxMoves: 180, choiceEvery: 3, fog: 5,    world: 'Classico' },
    { name: 'Desafio Classico',  maze: 'dfs',     rows: 16, cols: 16, maxMoves: 160, choiceEvery: 3, fog: 5,    world: 'Classico' },
    // World 2 — Ramificado (Prim)
    { name: 'Ramificacoes',      maze: 'prim',    rows: 12, cols: 12, maxMoves: 220, choiceEvery: 3, fog: null, world: 'Ramificado' },
    { name: 'Bifurcacao',        maze: 'prim',    rows: 16, cols: 16, maxMoves: 200, choiceEvery: 3, fog: null, world: 'Ramificado' },
    { name: 'Nevoa Densa',       maze: 'prim',    rows: 16, cols: 16, maxMoves: 160, choiceEvery: 3, fog: 4,    world: 'Ramificado' },
    { name: 'Pesadelo',          maze: 'prim',    rows: 20, cols: 20, maxMoves: 150, choiceEvery: 4, fog: 4,    world: 'Ramificado' },
    // World 3 — Caos (Kruskal)
    { name: 'Caos',              maze: 'kruskal', rows: 14, cols: 14, maxMoves: 220, choiceEvery: 3, fog: null, world: 'Caos' },
    { name: 'Caos Total',        maze: 'kruskal', rows: 18, cols: 18, maxMoves: 200, choiceEvery: 3, fog: null, world: 'Caos' },
    { name: 'Dimensao 3D',       maze: 'kruskal', rows: 16, cols: 16, maxMoves: 220, choiceEvery: 3, fog: null, world: 'Caos', force3d: true },
    { name: 'Desafio Final',     maze: 'kruskal', rows: 22, cols: 22, maxMoves: 130, choiceEvery: 4, fog: 4,    world: 'Caos', force3d: true },
];

export const MOVE_NAMES = { 1: 'Cima', 2: 'Baixo', 3: 'Dir', 4: 'Esq' };

export const COLORS = {
    wall: '#1e293b', path: '#0f172a',
    player: '#a855f7', monster: '#ef4444', goal: '#22c55e',
    goalGlow: 'rgba(34,197,94,0.3)', fog: '#0a0a0f', grid: 'rgba(30,41,59,0.3)',
};

export const DIR_DELTA = [
    { dx: 0, dy: -1 }, // 0 = North
    { dx: 1, dy: 0 },  // 1 = East
    { dx: 0, dy: 1 },  // 2 = South
    { dx: -1, dy: 0 }, // 3 = West
];

export const DIR_ANGLE = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
