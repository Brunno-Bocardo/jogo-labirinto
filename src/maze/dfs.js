// DFS Backtracking — corredores longos e sinuosos
export function dfs(rows, cols) {
    const maze = Array.from({ length: rows }, () => Array(cols).fill(0));

    function carve(r, c) {
        maze[r][c] = 1;
        const dirs = [[0, 2], [2, 0], [0, -2], [-2, 0]].sort(() => Math.random() - 0.5);

        for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && maze[nr][nc] === 0) {
                maze[r + dr / 2][c + dc / 2] = 1;
                carve(nr, nc);
            }
        }
    }

    carve(0, 0);
    return maze;
}
