const flappyCanvas = document.getElementById('flappy-canvas');
const flappyCtx = flappyCanvas.getContext('2d');
const flappyScoreEl = document.getElementById('flappy-score');

let flappyIntervalId = null;
let flappyScore = 0;

// Các thông số của Game
const gravity = 0.25;
const jump = -5.5;

// Đối tượng chú chim
let bird = {
    x: 50,
    y: 150,
    velocity: 0,
    radius: 12
};

// Mảng chứa các ống cản
let pipes = [];
let pipeWidth = 50;
let pipeGap = 120; // Khoảng trống giữa ống trên và dưới
let pipeInterval = 100; // Khoảng cách sinh ra ống mới
let frameCount = 0;
let isGameOver = false;

// Xử lý sự kiện nhảy lên
function flappyJump() {
    if (isGameOver) {
        startFlappy();
        return;
    }
    bird.velocity = jump;
}

// Khởi chạy game mới
function startFlappy() {
    stopFlappyGame();
    bird.y = 150;
    bird.velocity = 0;
    pipes = [];
    flappyScore = 0;
    flappyScoreEl.innerText = flappyScore;
    frameCount = 0;
    isGameOver = false;

    // Lắng nghe phím bấm nhảy
    document.addEventListener('keydown', handleFlappyKey);
    flappyCanvas.addEventListener('click', flappyJump);
    
    updateFlappy();
}

function handleFlappyKey(e) {
    if (e.keyCode === 32) { // Phím Space
        flappyJump();
    }
}

// Dừng game
function stopFlappyGame() {
    if (flappyIntervalId) {
        cancelAnimationFrame(flappyIntervalId);
        flappyIntervalId = null;
    }
    document.removeEventListener('keydown', handleFlappyKey);
    flappyCanvas.removeEventListener('click', flappyJump);
}

// Cập nhật tọa độ và logic game
function updateFlappy() {
    frameCount++;
    
    // Áp dụng trọng lực
    bird.velocity += gravity;
    bird.y += bird.velocity;

    // Tạo các cặp ống mới định kỳ
    if (frameCount % pipeInterval === 0) {
        let minHeight = 50;
        let maxHeight = flappyCanvas.height - pipeGap - minHeight;
        let height = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
        
        pipes.push({
            x: flappyCanvas.width,
            top: height,
            bottom: flappyCanvas.height - height - pipeGap,
            passed: false
        });
    }

    // Di chuyển và kiểm tra va chạm của ống
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= 2; // Tốc độ ống di chuyển sang trái

        // Kiểm tra va chạm với chim
        if (
            bird.x + bird.radius > pipes[i].x && 
            bird.x - bird.radius < pipes[i].x + pipeWidth
        ) {
            if (bird.y - bird.radius < pipes[i].top || bird.y + bird.radius > flappyCanvas.height - pipes[i].bottom) {
                isGameOver = true;
            }
        }

        // Tính điểm khi vượt qua ống thành công
        if (!pipes[i].passed && pipes[i].x + pipeWidth < bird.x) {
            flappyScore++;
            flappyScoreEl.innerText = flappyScore;
            pipes[i].passed = true;
        }

        // Xóa các ống đã trôi ra khỏi màn hình để giải phóng RAM
        if (pipes[i].x + pipeWidth < 0) {
            pipes.splice(i, 1);
        }
    }

    // Kiểm tra va chạm sàn và trần màn hình
    if (bird.y + bird.radius >= flappyCanvas.height || bird.y - bird.radius <= 0) {
        isGameOver = true;
    }

    // Vẽ lại màn hình
    drawFlappy();

    if (!isGameOver) {
        flappyIntervalId = requestAnimationFrame(updateFlappy);
    } else {
        // Vẽ chữ Game Over lên canvas
        flappyCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
        flappyCtx.fillRect(0, 0, flappyCanvas.width, flappyCanvas.height);
        
        flappyCtx.fillStyle = "#fff";
        flappyCtx.font = "24px Arial";
        flappyCtx.textAlign = "center";
        flappyCtx.fillText("GAME OVER", flappyCanvas.width / 2, flappyCanvas.height / 2);
        flappyCtx.font = "14px Arial";
        flappyCtx.fillText("Nhấn Space hoặc Chơi mới để thử lại", flappyCanvas.width / 2, flappyCanvas.height / 2 + 30);
    }
}

// Vẽ mọi thứ lên Canvas của Flappy Bird
function drawFlappy() {
    // Vẽ nền trời
    flappyCtx.fillStyle = '#70c5ce';
    flappyCtx.fillRect(0, 0, flappyCanvas.width, flappyCanvas.height);

    // Vẽ chim (Hình tròn màu vàng)
    flappyCtx.fillStyle = '#f8e71c';
    flappyCtx.beginPath();
    flappyCtx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
    flappyCtx.fill();
    flappyCtx.strokeStyle = '#000';
    flappyCtx.stroke();

    // Vẽ các ống cản
    flappyCtx.fillStyle = '#73c73f';
    pipes.forEach(pipe => {
        // Ống trên
        flappyCtx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
        flappyCtx.strokeRect(pipe.x, 0, pipeWidth, pipe.top);
        
        // Ống dưới
        flappyCtx.fillRect(pipe.x, flappyCanvas.height - pipe.bottom, pipeWidth, pipe.bottom);
        flappyCtx.strokeRect(pipe.x, flappyCanvas.height - pipe.bottom, pipeWidth, pipe.bottom);
    });
}