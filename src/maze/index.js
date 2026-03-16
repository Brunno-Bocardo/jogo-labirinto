import { dfs } from './dfs.js';
import { prim } from './prim.js';
import { kruskal } from './kruskal.js';
import { binary } from './binary.js';

const algorithms = { dfs, prim, kruskal, binary };

export function generateMaze(type, rows, cols) {
    const fn = algorithms[type] || dfs;
    return fn(rows, cols);
}
