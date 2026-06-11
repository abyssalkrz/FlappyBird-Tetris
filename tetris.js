const tetrisCanvas = document.getElementById('tetris-canvas');
const tetrisCtx = tetrisCanvas.getContext('2d');
const tetrisScoreEl = document.getElementById('tetris-score');
const tetrisHighEl = document.getElementById('tetris-high');

// Tỷ lệ scale vẽ canvas
tetrisCtx.scale(20, 20); 

let tetrisScore = 0;
let tetrisHighScore = localStorage.getItem('tetrisHighScore') || 0;
let tetrisIntervalId = null;
let isTetrisPlaying = false;

// Cập nhật kỷ lục ban đầu trên HTML
tetrisHighEl.innerText = tetrisHighScore;

// Khởi tạo bảng game 12x20
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

// Khởi tạo ma trận rỗng
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

// Tạo ra các khối gạch ngẫu nhiên
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

// Vẽ ma trận lên Canvas
function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                tetrisCtx.fillStyle = colors[value];
                tetrisCtx.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

// Vẽ lại toàn bộ màn hình game
function drawTetris() {
    tetrisCtx.fillStyle = '#0b0c10';
    tetrisCtx.fillRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
}

// Vẽ giao diện màn hình chờ ban đầu
function drawTetrisStartScreen() {
    tetrisCtx.save();
    // Khôi phục tỉ lệ 1:1 tạm thời để vẽ chữ rõ nét
    tetrisCtx.setTransform(1, 0, 0, 1, 0, 0);
    
    tetrisCtx.fillStyle = '#0b0c10';
    tetrisCtx.fillRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);

    tetrisCtx.fillStyle = '#ff007f';
    tetrisCtx.font = "bold 26px 'Segoe UI', Arial";
    tetrisCtx.textAlign = 'center';
    tetrisCtx.fillText('TETRIS', tetrisCanvas.width / 2, 160);

    tetrisCtx.fillStyle = '#aaa';
    tetrisCtx.font = "14px 'Segoe UI', Arial";
    tetrisCtx.fillText('Bấm nút "Chơi mới"', tetrisCanvas.width / 2, 210);
    tetrisCtx.fillText('để bắt đầu trò chơi', tetrisCanvas.width / 2, 230);
    
    tetrisCtx.restore();
}

// Kiểm tra va chạm
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

// Gộp khối gạch đã rơi xong vào bảng chính
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// Xoay khối gạch
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

// Cho khối rơi xuống
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

// Di chuyển khối gạch sang hai bên
function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

// Reset người chơi khi thua hoặc có khối mới
function playerReset() {
    const pieces = 'ILJOZST';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        // Thua cuộc
        isTetrisPlaying = false;
        arena.forEach(row => row.fill(0));
        stopTetrisGame();
        drawTetrisStartScreen();
    }
}

// Xoay khối gạch và kiểm tra va chạm để đẩy lùi nếu cần
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

// Ăn điểm khi đầy hàng
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
    // Kiểm tra và cập nhật kỷ lục
    if (player.score > tetrisHighScore) {
        tetrisHighScore = player.score;
        localStorage.setItem('tetrisHighScore', tetrisHighScore);
        tetrisHighEl.innerText = tetrisHighScore;
    }
}

let dropCounter = 0;
let dropInterval = 1000; // Tốc độ rơi: 1 giây
let lastTime = 0;

// Vòng lặp cập nhật game
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

// Lắng nghe phím bấm điều khiển
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

// Thiết lập màn hình chờ ban đầu khi mới tải game
function initTetris() {
    isTetrisPlaying = false;
    stopTetrisGame();
    drawTetrisStartScreen();
    tetrisScore = 0;
    tetrisScoreEl.innerText = 0;
}

// Khởi động khi ấn "Chơi mới"
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

// Dừng hoàn toàn vòng lặp vẽ game
function stopTetrisGame() {
    isTetrisPlaying = false;
    if (tetrisIntervalId) {
        cancelAnimationFrame(tetrisIntervalId);
        tetrisIntervalId = null;
    }
    document.removeEventListener('keydown', handleKeyDown);
}