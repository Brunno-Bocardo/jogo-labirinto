// Kruskal's Algorithm — distribuicao uniforme via union-find
export function kruskal(rows, cols) {
    const maze = Array.from({ length: rows }, () => Array(cols).fill(0));
    const parent = new Map();
    const key = (r, c) => r * cols + c;

    function find(k) {
        if (!parent.has(k)) parent.set(k, k);
        if (parent.get(k) !== k) parent.set(k, find(parent.get(k)));
        return parent.get(k);
    }

    function union(a, b) {
        parent.set(find(a), find(b));
    }

    // Mark all even cells as passages
    for (let r = 0; r < rows; r += 2)
        for (let c = 0; c < cols; c += 2)
            maze[r][c] = 1;

    // Collect all walls between adjacent cells
    const walls = [];
    for (let r = 0; r < rows; r += 2) {
        for (let c = 0; c < cols; c += 2) {
            if (r + 2 < rows) walls.push([r, c, r + 2, c]);
            if (c + 2 < cols) walls.push([r, c, r, c + 2]);
        }
    }
    walls.sort(() => Math.random() - 0.5);

    for (const [r1, c1, r2, c2] of walls) {
        if (find(key(r1, c1)) !== find(key(r2, c2))) {
            union(key(r1, c1), key(r2, c2));
            maze[(r1 + r2) / 2][(c1 + c2) / 2] = 1;
        }
    }

    return maze;
}
