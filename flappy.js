const flappyCanvas = document.getElementById('flappy-canvas');
const flappyCtx = flappyCanvas.getContext('2d');
const flappyScoreEl = document.getElementById('flappy-score');
const flappyHighEl = document.getElementById('flappy-high');
const flappySidebarCoinsEl = document.getElementById('flappy-sidebar-coins');

let flappyIntervalId = null;
let flappyScore = 0;
let flappyHighScore = localStorage.getItem('flappyHighScore') || 0;

// Hệ thống tiền tệ & nhân vật
let flappyCoins = parseInt(localStorage.getItem('flappyCoins')) || 0;
let unlockedChars = JSON.parse(localStorage.getItem('unlockedChars')) || ['player.jpg'];
let selectedChar = localStorage.getItem('selectedChar') || 'player.jpg';

// Danh sách tất cả nhân vật sau khi đã đổi tên theo yêu cầu
const charactersList = [
    { id: 'player.jpg', name: 'tuatdtrung', color: '#ff5722' },
    { id: 'player2.jpg', name: 'nminh', color: '#00bcd4' },
    { id: 'player3.jpg', name: 'naman', color: '#4caf50' },
    { id: 'player4.jpg', name: 'dogtien', color: '#ffeb3b' },
    { id: 'player5.jpg', name: 'nqdo', color: '#9c27b0' }
];

// Tải hình ảnh người chơi
const birdImg = new Image();
birdImg.src = selectedChar;

// Các thông số của Game
const gravity = 0.23; 
const jump = -4.5;    
const gameSpeed = 1.5; 

let bird = {
    x: 50,
    y: 150,
    velocity: 0,
    radius: 20 
};

// Trạng thái game: 'START' (chờ chơi), 'PLAYING' (đang chơi), 'GAMEOVER' (thua)
let flappyState = 'START';

let pipes = [];
let pipeWidth = 50;
let pipeGap = 210; 
let pipeInterval = 130; 
let frameCount = 0;

// Hệ thống mây trang trí phía sau nền
let clouds = [
    { x: 50, y: 40, scale: 1.2 },
    { x: 180, y: 80, scale: 0.8 },
    { x: 300, y: 30, scale: 1.0 }
];

// Khởi động màn hình chờ ban đầu khi mở game hoặc về trang chủ
function initFlappy() {
    stopFlappyGame();
    flappyState = 'START';
    bird.y = 180;
    bird.velocity = 0;
    pipes = [];
    flappyScore = 0;
    flappyScoreEl.innerText = 0;
    
    // Tải lại nhân vật hiện tại được chọn
    birdImg.src = selectedChar;

    document.addEventListener('keydown', handleFlappyKey);
    updateCoinsDisplay();
    showScreen('menu');
    updateFlappy();
}

// Chuyển đổi màn hình giao diện
function showScreen(screenId) {
    document.querySelectorAll('.ui-screen').forEach(el => el.classList.add('hidden'));
    
    if (screenId === 'menu') {
        document.getElementById('flappy-menu-screen').classList.remove('hidden');
        updateCoinsDisplay();
    } else if (screenId === 'characters') {
        document.getElementById('flappy-char-screen').classList.remove('hidden');
        renderCharacterScreen();
    } else if (screenId === 'shop') {
        document.getElementById('flappy-shop-screen').classList.remove('hidden');
        updateCoinsDisplay();
        renderWheel();
    } else if (screenId === 'gameover') {
        document.getElementById('flappy-gameover-screen').classList.remove('hidden');
    } else if (screenId === 'none') {
        // Ẩn tất cả màn hình khi đang chơi để tương tác trực tiếp với canvas
    }
}

// Đồng bộ hiển thị xu
function updateCoinsDisplay() {
    document.getElementById('flappy-coin-count').innerText = flappyCoins;
    document.getElementById('shop-coin-count').innerText = flappyCoins;
    flappySidebarCoinsEl.innerText = flappyCoins;
}

// Xử lý chuyển tiếp khi click từ màn hình Menu chính
function handleMenuClick(action) {
    if (action === 'play') {
        startFlappy();
    } else if (action === 'characters') {
        showScreen('characters');
    } else if (action === 'shop') {
        showScreen('shop');
    }
}

// Hiển thị danh sách nhân vật
function renderCharacterScreen() {
    const grid = document.querySelector('.char-grid');
    grid.innerHTML = '';
    
    charactersList.forEach(char => {
        const isUnlocked = unlockedChars.includes(char.id);
        const isSelected = selectedChar === char.id;
        
        const card = document.createElement('div');
        card.className = `char-card ${isUnlocked ? '' : 'locked'} ${isSelected ? 'selected' : ''}`;
        
        card.innerHTML = `
            <img src="${char.id}" class="char-thumb" style="border: 2px solid ${char.color}" alt="${char.name}">
            <div class="char-name">${char.name}</div>
            <div class="char-status">${isSelected ? 'ĐANG CHỌN' : (isUnlocked ? 'CHỌN' : 'KHÓA')}</div>
        `;
        
        if (isUnlocked && !isSelected) {
            card.onclick = () => {
                selectedChar = char.id;
                localStorage.setItem('selectedChar', selectedChar);
                birdImg.src = selectedChar;
                renderCharacterScreen();
            };
        }
        grid.appendChild(card);
    });
}

// Vẽ dữ liệu các lát vòng quay may mắn
function renderWheel() {
    const wheelInner = document.getElementById('wheel-inner');
    wheelInner.innerHTML = '';
    const numSlices = charactersList.length;
    const angleStep = 360 / numSlices;
    
    charactersList.forEach((char, index) => {
        const slice = document.createElement('div');
        slice.className = 'wheel-slice';
        slice.style.transform = `rotate(${index * angleStep}deg)`;
        slice.style.backgroundColor = char.color;
        
        // Vẽ hình nhân vật nằm đúng trục xoay
        slice.innerHTML = `<img src="${char.id}" class="wheel-slice-img" style="transform: rotate(${-index * angleStep}deg);" alt="">`;
        wheelInner.appendChild(slice);
    });

    const allUnlocked = charactersList.every(char => unlockedChars.includes(char.id));
    const spinBtn = document.getElementById('spin-btn');
    const statusEl = document.getElementById('spin-status');
    
    if (allUnlocked) {
        spinBtn.disabled = true;
        statusEl.innerHTML = "Chúc mừng! Bạn đã sở hữu<br>toàn bộ nhân vật!";
    } else {
        spinBtn.disabled = false;
        statusEl.innerText = "";
    }
}

// Tiến trình quay Gacha
let isSpinning = false;
function spinGacha() {
    if (isSpinning) return;
    if (flappyCoins < 25) {
        document.getElementById('spin-status').innerText = "Không đủ xu! Kiếm thêm xu bằng cách chơi game.";
        return;
    }

    const lockedChars = charactersList.filter(char => !unlockedChars.includes(char.id));
    if (lockedChars.length === 0) {
        document.getElementById('spin-status').innerText = "Đã mở khóa mọi nhân vật!";
        return;
    }

    isSpinning = true;
    flappyCoins -= 25;
    localStorage.setItem('flappyCoins', flappyCoins);
    updateCoinsDisplay();

    // Chọn ngẫu nhiên một nhân vật chưa khóa để trúng thưởng
    const targetChar = lockedChars[Math.floor(Math.random() * lockedChars.length)];
    const targetIndex = charactersList.findIndex(char => char.id === targetChar.id);
    
    const numSlices = charactersList.length;
    const angleStep = 360 / numSlices;
    
    // Tạo gia tốc quay ngẫu nhiên tối thiểu 5 vòng
    const extraSpins = 5 * 360;
    const targetAngle = extraSpins - (targetIndex * angleStep);

    const wheelInner = document.getElementById('wheel-inner');
    wheelInner.style.transition = 'transform 3s cubic-bezier(0.1, 0.8, 0.3, 1)';
    wheelInner.style.transform = `rotate(${targetAngle}deg)`;

    document.getElementById('spin-status').innerText = "Đang quay...";
    document.getElementById('spin-btn').disabled = true;

    setTimeout(() => {
        isSpinning = false;
        unlockedChars.push(targetChar.id);
        localStorage.setItem('unlockedChars', JSON.stringify(unlockedChars));
        
        document.getElementById('spin-status').innerHTML = `<span style="color:#00ffcc">MỞ KHÓA THÀNH CÔNG:</span><br>${targetChar.name}`;
        
        renderWheel();
    }, 3100);
}

// Nhảy lên khi đang trong trận đấu
function flappyJump() {
    if (flappyState === 'PLAYING') {
        bird.velocity = jump;
    }
}

// Khởi chạy vòng đấu mới
function startFlappy() {
    stopFlappyGame();
    bird.y = 150;
    bird.velocity = 0;
    pipes = [];
    flappyScore = 0;
    flappyScoreEl.innerText = flappyScore;
    frameCount = 0;
    flappyState = 'PLAYING';
    birdImg.src = selectedChar;

    showScreen('none'); // Ẩn giao diện để hiện đấu trường

    document.addEventListener('keydown', handleFlappyKey);
    flappyCanvas.addEventListener('click', flappyJump);
    
    updateFlappy();
}

function handleFlappyKey(e) {
    if (e.keyCode === 32) { // Phím Space
        flappyJump();
    }
}

// Cập nhật tọa độ và logic game
function updateFlappy() {
    // Luôn cập nhật vị trí mây bay nhẹ đằng sau
    clouds.forEach(cloud => {
        cloud.x -= gameSpeed * 0.2;
        if (cloud.x + 60 < 0) {
            cloud.x = flappyCanvas.width + Math.random() * 50;
            cloud.y = Math.random() * 100 + 20;
        }
    });

    if (flappyState === 'PLAYING') {
        frameCount++;
        
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
            pipes[i].x -= gameSpeed;

            // Kiểm tra va chạm với chim
            if (
                bird.x + bird.radius > pipes[i].x && 
                bird.x - bird.radius < pipes[i].x + pipeWidth
            ) {
                if (bird.y - bird.radius < pipes[i].top || bird.y + bird.radius > flappyCanvas.height - pipes[i].bottom) {
                    triggerGameOver();
                    return;
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
            triggerGameOver();
            return;
        }
    } else if (flappyState === 'START') {
        bird.y = 180 + Math.sin(Date.now() / 150) * 8;
    }

    drawFlappy();

    if (flappyState === 'PLAYING' || flappyState === 'START') {
        flappyIntervalId = requestAnimationFrame(updateFlappy);
    }
}

// Xử lý thua trận và thiết lập bảng điểm
function triggerGameOver() {
    stopFlappyGame();
    flappyState = 'GAMEOVER';

    // 1 điểm tương ứng cộng thêm 1 xu tích lũy
    const coinsEarned = flappyScore;
    flappyCoins += coinsEarned;
    localStorage.setItem('flappyCoins', flappyCoins);

    let isNewHigh = false;
    if (flappyScore > flappyHighScore) {
        flappyHighScore = flappyScore;
        localStorage.setItem('flappyHighScore', flappyHighScore);
        flappyHighEl.innerText = flappyHighScore;
        isNewHigh = true;
    }

    // Hiển thị thông số lên Scoreboard
    document.getElementById('board-score').innerText = flappyScore;
    document.getElementById('board-best').innerText = flappyHighScore;
    document.getElementById('board-coins-earned').innerText = `+${coinsEarned}`;
    
    const newTag = document.getElementById('board-new-tag');
    if (isNewHigh) {
        newTag.classList.remove('hidden');
    } else {
        newTag.classList.add('hidden');
    }

    // Luôn vẽ một khung nền mờ trước khi phủ giao diện HTML lên
    drawFlappy();
    flappyCtx.fillStyle = "rgba(0, 0, 0, 0.4)";
    flappyCtx.fillRect(0, 0, flappyCanvas.width, flappyCanvas.height);

    showScreen('gameover');
}

// Vẽ các đám mây bằng nét vẽ
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
    flappyCtx.fillStyle = '#70c5ce';
    flappyCtx.fillRect(0, 0, flappyCanvas.width, flappyCanvas.height);

    // Vẽ các đám mây
    clouds.forEach(cloud => {
        drawCloud(cloud.x, cloud.y, cloud.scale);
    });

    // Vẽ các ống cản
    flappyCtx.fillStyle = '#73c73f';
    pipes.forEach(pipe => {
        flappyCtx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
        flappyCtx.strokeRect(pipe.x, 0, pipeWidth, pipe.top);
        
        flappyCtx.fillRect(pipe.x, flappyCanvas.height - pipe.bottom, pipeWidth, pipe.bottom);
        flappyCtx.strokeRect(pipe.x, flappyCanvas.height - pipe.bottom, pipeWidth, pipe.bottom);
    });

    // Vẽ chim bằng hình ảnh của nhân vật được chọn
    try {
        flappyCtx.drawImage(
            birdImg, 
            bird.x - bird.radius, 
            bird.y - bird.radius, 
            bird.radius * 2, 
            bird.radius * 2
        );
    } catch (e) {
        flappyCtx.fillStyle = '#f8e71c';
        flappyCtx.beginPath();
        flappyCtx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
        flappyCtx.fill();
    }

    // Hiển thị điểm số ở trung tâm màn hình khi đang chơi
    if (flappyState === 'PLAYING') {
        flappyCtx.save();
        flappyCtx.fillStyle = "#ffffff";
        flappyCtx.strokeStyle = "#000000";
        flappyCtx.lineWidth = 5;
        flappyCtx.font = "bold 44px 'Segoe UI', Arial";
        flappyCtx.textAlign = "center";
        flappyCtx.strokeText(flappyScore, flappyCanvas.width / 2, 85);
        flappyCtx.fillText(flappyScore, flappyCanvas.width / 2, 85);
        flappyCtx.restore();
    }
}