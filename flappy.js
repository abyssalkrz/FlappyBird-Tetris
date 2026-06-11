const flappyCanvas = document.getElementById('flappy-canvas');
const flappyCtx = flappyCanvas.getContext('2d');
const flappyScoreEl = document.getElementById('flappy-score');

let flappyIntervalId = null;
let flappyScore = 0;

// Tải hình ảnh người chơi
const birdImg = new Image();
birdImg.src = 'player.jpg';

// Các thông số của Game (Đã được giảm tốc độ và tinh chỉnh vật lý)
const gravity = 0.18; // Giảm trọng lực (cũ: 0.25)
const jump = -4.5;    // Giảm lực nhảy tương ứng (cũ: -5.5) 
const gameSpeed = 1.5; // Tốc độ di chuyển của ống (cũ: 2)

// Đối tượng chú chim (Đã tăng bán kính lên 20 để hình ảnh hiển thị to hơn)
let bird = {
    x: 50,
    y: 150,
    velocity: 0,
    radius: 20 // Tăng từ 15 lên 20 để ảnh to ra một tí
};

// Mảng chứa các ống cản
let pipes = [];
let pipeWidth = 50;
let pipeGap = 210; // Tăng từ 180 lên 210 để khoảng trống giữa ống trên và dưới rộng ra một tí
let pipeInterval = 130; // Khoảng cách xuất hiện ống mới (tăng lên để phù hợp tốc độ chậm)
let frameCount = 0;
let isGameOver = false;

// Hệ thống mây trang trí phía sau nền
let clouds = [
    { x: 50, y: 40, scale: 1.2 },
    { x: 180, y: 80, scale: 0.8 },
    { x: 300, y: 30, scale: 1.0 }
];

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

    // Reset vị trí mây
    clouds = [
        { x: 50, y: 40, scale: 1.2 },
        { x: 180, y: 80, scale: 0.8 },
        { x: 300, y: 30, scale: 1.0 }
    ];

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

    // Cập nhật vị trí mây (di chuyển chậm sang bên trái)
    clouds.forEach(cloud => {
        cloud.x -= gameSpeed * 0.2; // Tốc độ mây chậm bằng 1/5 tốc độ ống
        if (cloud.x + 60 < 0) {
            cloud.x = flappyCanvas.width + Math.random() * 50;
            cloud.y = Math.random() * 100 + 20;
        }
    });

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
        pipes[i].x -= gameSpeed; // Áp dụng tốc độ mới

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

        // Xóa các ống đã trôi ra khỏi màn hình
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

// Hàm vẽ đám mây đơn giản bằng Canvas
function drawCloud(x, y, scale) {
    flappyCtx.fillStyle = "rgba(255, 255, 255, 0.85)";
    flappyCtx.beginPath();
    flappyCtx.arc(x, y, 15 * scale, 0, Math.PI * 2);
    flappyCtx.arc(x + 15 * scale, y - 8 * scale, 18 * scale, 0, Math.PI * 2);
    flappyCtx.arc(x + 32 * scale, y, 13 * scale, 0, Math.PI * 2);
    flappyCtx.closePath();
    flappyCtx.fill();
}

// Vẽ mọi thứ lên Canvas của Flappy Bird
function drawFlappy() {
    // Vẽ nền trời xanh mượt hơn với Gradient nhẹ hoặc màu sáng hơn
    flappyCtx.fillStyle = '#70c5ce';
    flappyCtx.fillRect(0, 0, flappyCanvas.width, flappyCanvas.height);

    // Vẽ các đám mây trang trí
    clouds.forEach(cloud => {
        drawCloud(cloud.x, cloud.y, cloud.scale);
    });

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

    // Vẽ chim bằng hình ảnh player.jpg (vẽ đè lên trên các ống và mây)
    try {
        // Sử dụng drawImage để vẽ ảnh căn giữa theo tọa độ của chim
        flappyCtx.drawImage(
            birdImg, 
            bird.x - bird.radius, 
            bird.y - bird.radius, 
            bird.radius * 2, 
            bird.radius * 2
        );
    } catch (e) {
        // Dự phòng: Nếu ảnh chưa kịp tải thì vẽ hình tròn tạm thời
        flappyCtx.fillStyle = '#f8e71c';
        flappyCtx.beginPath();
        flappyCtx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
        flappyCtx.fill();
    }
}