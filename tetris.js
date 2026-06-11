const tetrisCanvas = document.getElementById('tetris-canvas');
const tetrisCtx = tetrisCanvas.getContext('2d');
const tetrisScoreEl = document.getElementById('tetris-score');
const tetrisHighEl = document.getElementById('tetris-high');

tetrisCtx.scale(20, 20); 

let tetrisScore = 0;
let tetrisHighScore = localStorage.getItem('tetrisHighScore') || 0;
let tetrisIntervalId = null;
let isTetrisPlaying = false;

tetrisHighEl.innerText = tetrisHighScore;

const arena = createMatrix(12, 20);

const colors = [
    null,
    '#FF0D72', '#0DC2FF', '#0DFF72',
    '#F538FF', '#FF8E0D', '#FFE135', '#3877FF'
];

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0
};

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    if (type === 'I') {
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'L') {
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2],
        ];
    } else if (type === 'J') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'O') {
        return [
            [4, 4],
            [4, 4],
        ];
    } else if (type === 'Z') {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'T') {
        return [
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0],
        ];
    }
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                tetrisCtx.fillStyle = colors[value];
                tetrisCtx.fillRect(x + offset.x, y + offset.y, 1, 1);
                
                // Block outline
                tetrisCtx.lineWidth = 0.05;
                tetrisCtx.strokeStyle = '#000000';
                tetrisCtx.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function drawTetris() {
    tetrisCtx.fillStyle = '#090a10';
    tetrisCtx.fillRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
}

function drawTetrisStartScreen() {
    tetrisCtx.save();
    tetrisCtx.setTransform(1, 0, 0, 1, 0, 0);
    
    tetrisCtx.fillStyle = '#090a10';
    tetrisCtx.fillRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);

    // Decorative Retro Blocks
    const demoBlocks = [
        {x: 60, y: 300, color: '#FF0D72'}, {x: 80, y: 300, color: '#FF0D72'},
        {x: 100, y: 300, color: '#0DFF72'}, {x: 100, y: 280, color: '#0DFF72'},
        {x: 120, y: 300, color: '#FFE135'}, {x: 140, y: 300, color: '#FFE135'},
        {x: 140, y: 280, color: '#FFE135'}, {x: 160, y: 280, color: '#FFE135'}
    ];
    demoBlocks.forEach(b => {
        tetrisCtx.fillStyle = b.color;
        tetrisCtx.fillRect(b.x, b.y, 18, 18);
        tetrisCtx.strokeStyle = '#000';
        tetrisCtx.lineWidth = 2;
        tetrisCtx.strokeRect(b.x, b.y, 18, 18);
    });

    // Title
    tetrisCtx.fillStyle = '#ff007f';
    tetrisCtx.font = "bold 28px 'Press Start 2P', monospace";
    tetrisCtx.textAlign = 'center';
    tetrisCtx.fillText('TETRIS', tetrisCanvas.width / 2, 140);

    // Prompt
    tetrisCtx.fillStyle = '#808494';
    tetrisCtx.font = "12px 'Poppins', Arial";
    tetrisCtx.fillText('Click "New Game" to start', tetrisCanvas.width / 2, 200);
    
    tetrisCtx.restore();
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerReset() {
    const pieces = 'ILJOZST';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        isTetrisPlaying = false;
        arena.forEach(row => row.fill(0));
        stopTetrisGame();
        drawTetrisStartScreen();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 10;
        rowCount *= 2;
    }
}

function updateScore() {
    tetrisScoreEl.innerText = player.score;
    if (player.score > tetrisHighScore) {
        tetrisHighScore = player.score;
        localStorage.setItem('tetrisHighScore', tetrisHighScore);
        tetrisHighEl.innerText = tetrisHighScore;
    }
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function updateTetris(time = 0) {
    if (!isTetrisPlaying) return;
    
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    drawTetris();
    tetrisIntervalId = requestAnimationFrame(updateTetris);
}

function handleKeyDown(event) {
    if (!isTetrisPlaying) return;
    if (event.keyCode === 37) {
        playerMove(-1);
    } else if (event.keyCode === 39) {
        playerMove(1);
    } else if (event.keyCode === 40) {
        playerDrop();
    } else if (event.keyCode === 38) {
        playerRotate(1);
    }
}

function initTetris() {
    isTetrisPlaying = false;
    stopTetrisGame();
    drawTetrisStartScreen();
    tetrisScore = 0;
    tetrisScoreEl.innerText = 0;
}

function startTetris() {
    stopTetrisGame();
    arena.forEach(row => row.fill(0));
    player.score = 0;
    updateScore();
    playerReset();
    isTetrisPlaying = true;
    document.addEventListener('keydown', handleKeyDown);
    updateTetris();
}

function stopTetrisGame() {
    isTetrisPlaying = false;
    if (tetrisIntervalId) {
        cancelAnimationFrame(tetrisIntervalId);
        tetrisIntervalId = null;
    }
    document.removeEventListener('keydown', handleKeyDown);
}