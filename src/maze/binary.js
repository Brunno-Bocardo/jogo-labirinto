// Binary Tree — tendencia diagonal NE
export function binary(rows, cols) {
    const maze = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let r = 0; r < rows; r += 2) {
        for (let c = 0; c < cols; c += 2) {
            maze[r][c] = 1;
            const canNorth = r - 2 >= 0;
            const canEast = c + 2 < cols;

            if (canNorth && canEast) {
                if (Math.random() < 0.5) maze[r - 1][c] = 1;
                else maze[r][c + 1] = 1;
            } else if (canNorth) {
                maze[r - 1][c] = 1;
            } else if (canEast) {
                maze[r][c + 1] = 1;
            }
        }
    }

    return maze;
}
