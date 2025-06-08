// Game constants
const rows = 13;
const cols = 6;
const colors = ['red', 'green', 'blue', 'yellow', 'purple'];

// Game variables
const game = document.getElementById('game');
const grid = [];
const fixed = Array.from({ length: rows }, () => Array(cols).fill(null));
let falling = null;
let gameLoop = null;
let score = 0;
let isPaused = false;
const pauseBtn = document.getElementById('pauseBtn');
const newGameBtn = document.getElementById('newGameBtn');

function canMoveDown(column) {
    if (column.row + 1 >= rows) return false;
    return !fixed[column.row + 1][column.col];
}

function fixColumn(column) {
    for (let i = 0; i < 3; i++) {
        const r = column.row - i;
        if (r >= 0) {
            fixed[r][column.col] = column.colors[i];
        }
    }
}

// Initialize game board
function initializeBoard() {
    // Clear any existing content
    game.innerHTML = '';
    
    for (let r = 0; r < rows; r++) {
        grid[r] = [];
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            game.appendChild(cell);
            grid[r][c] = cell;
        }
    }
}

function updateScore(points) {
    score += points;
    document.getElementById('score').textContent = `Score: ${score}`;
    const highScore = Math.max(score, localStorage.getItem('highScore') || 0);
    localStorage.setItem('highScore', highScore);
    document.getElementById('highScore').textContent = `High Score: ${highScore}`;
}

function newColumn() {
    const col = Math.floor(cols / 2);
    const row = 0;
    
    // Check if game over condition is met
    if (fixed[row][col]) {
        gameOver();
        return null;
    }
    
    const column = {
        row: row,
        col: col,
        colors: [randColor(), randColor(), randColor()]
    };
    drawColumn(column);
    return column;
}

function randColor() {
    return colors[Math.floor(Math.random() * colors.length)];
}

function drawColumn(column) {
    clearColumn();
    if (!column) return;
    
    for (let i = 0; i < 3; i++) {
        const r = column.row - i;
        if (r >= 0 && r < rows) {
            grid[r][column.col].classList.add(column.colors[i]);
        }
    }
}

function clearColumn() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            grid[r][c].className = 'cell';
            if (fixed[r][c]) {
                grid[r][c].classList.add(fixed[r][c]);
            }
        }
    }
}

function drop() {
    if (!falling || isPaused) return;
    
    if (canMoveDown(falling)) {
        falling.row++;
        drawColumn(falling);
    } else {
        fixColumn(falling);
        checkMatches();
        falling = newColumn();
    }
}

function gameOver() {
    clearInterval(gameLoop);
    const highScore = Math.max(score, localStorage.getItem('highScore') || 0);
    localStorage.setItem('highScore', highScore);
    
    setTimeout(() => {
        const playAgain = confirm(`Game Over!\nScore: ${score}\nHigh Score: ${highScore}\n\nPlay again?`);
        if (playAgain) {
            resetGame();
        }
    }, 100);
}

function resetGame() {
    score = 0;
    updateScore(0);
    
    // Clear the board
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            fixed[r][c] = null;
        }
    }
    
    clearColumn();
    falling = newColumn();
    
    // Reset game loop
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(drop, 700);
}

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        clearInterval(gameLoop);
        pauseBtn.textContent = '▶️ Resume';
    } else {
        gameLoop = setInterval(drop, 700);
        pauseBtn.textContent = '⏸️ Pause';
    }
}

function checkMatches() {
    let matchFound = false;
    
    // Check vertical matches
    for (let r = 0; r < rows - 2; r++) {
        for (let c = 0; c < cols; c++) {
            if (fixed[r][c] && fixed[r][c] === fixed[r + 1][c] && fixed[r][c] === fixed[r + 2][c]) {
                fixed[r][c] = fixed[r + 1][c] = fixed[r + 2][c] = null;
                matchFound = true;
                updateScore(100);
            }
        }
    }
    
    // Check horizontal matches
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols - 2; c++) {
            if (fixed[r][c] && fixed[r][c] === fixed[r][c + 1] && fixed[r][c] === fixed[r][c + 2]) {
                fixed[r][c] = fixed[r][c + 1] = fixed[r][c + 2] = null;
                matchFound = true;
                updateScore(100);
            }
        }
    }
    
    if (matchFound) {
        setTimeout(() => {
            applyGravity();
            checkMatches();
        }, 100);
    }
}

function applyGravity() {
    let moved = false;
    
    // Start from bottom, going up
    for (let r = rows - 2; r >= 0; r--) {
        for (let c = 0; c < cols; c++) {
            if (fixed[r][c] && !fixed[r + 1][c]) {
                // Move block down
                fixed[r + 1][c] = fixed[r][c];
                fixed[r][c] = null;
                moved = true;
            }
        }
    }
    
    // Redraw the board
    clearColumn();
    drawColumn(falling);
    
    // Keep applying gravity until no more moves are possible
    if (moved) {
        setTimeout(() => applyGravity(), 50);
    }
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (!falling || isPaused) return;
    
    switch (e.key.toLowerCase()) {
        case 'arrowleft':
            if (falling.col > 0 && !fixed[falling.row][falling.col - 1]) {
                falling.col--;
                drawColumn(falling);
            }
            break;
        case 'arrowright':
            if (falling.col < cols - 1 && !fixed[falling.row][falling.col + 1]) {
                falling.col++;
                drawColumn(falling);
            }
            break;
        case 'z':
            const rotatedColors = [...falling.colors];
            rotatedColors.push(rotatedColors.shift());
            falling.colors = rotatedColors;
            drawColumn(falling);
            break;
        case 'arrowdown':
            drop();
            break;
    }
});

pauseBtn.addEventListener('click', togglePause);
newGameBtn.addEventListener('click', () => {
    if (confirm('Start a new game?')) {
        // Reset pause state
        isPaused = false;
        pauseBtn.textContent = '⏸️ Pause';
        // Clear existing game loop
        clearInterval(gameLoop);
        // Reset game
        resetGame();
    }
});

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    initializeBoard();
    updateScore(0);
    falling = newColumn();
    gameLoop = setInterval(drop, 700);
});

