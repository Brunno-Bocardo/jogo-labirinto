// Prim's Algorithm — ramos curtos, mais aberto
export function prim(rows, cols) {
    const maze = Array.from({ length: rows }, () => Array(cols).fill(0));
    maze[0][0] = 1;
    const frontier = [];

    function addFrontier(r, c) {
        for (const [dr, dc] of [[0, 2], [2, 0], [0, -2], [-2, 0]]) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && maze[nr][nc] === 0) {
                frontier.push([nr, nc, r + dr / 2, c + dc / 2]);
            }
        }
    }

    addFrontier(0, 0);

    while (frontier.length > 0) {
        const idx = Math.floor(Math.random() * frontier.length);
        const [nr, nc, wr, wc] = frontier.splice(idx, 1)[0];
        if (maze[nr][nc] === 0) {
            maze[nr][nc] = 1;
            maze[wr][wc] = 1;
            addFrontier(nr, nc);
        }
    }

    return maze;
}
