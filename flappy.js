const flappyCanvas = document.getElementById('flappy-canvas');
const flappyCtx = flappyCanvas.getContext('2d');
const flappyScoreEl = document.getElementById('flappy-score');
const flappyHighEl = document.getElementById('flappy-high');
const flappySidebarCoinsEl = document.getElementById('flappy-sidebar-coins');

let flappyIntervalId = null;
let flappyScore = 0;
let flappyHighScore = localStorage.getItem('flappyHighScore') || 0;

// Currencies and Inventory System
let flappyCoins = parseInt(localStorage.getItem('flappyCoins')) || 0;
if (isNaN(flappyCoins)) flappyCoins = 0;

let unlockedChars = ['player.jpg'];
try {
    const saved = localStorage.getItem('unlockedChars');
    if (saved) {
        unlockedChars = JSON.parse(saved);
        if (!Array.isArray(unlockedChars)) unlockedChars = ['player.jpg'];
    }
} catch (e) {
    unlockedChars = ['player.jpg'];
}

let selectedChar = localStorage.getItem('selectedChar') || 'player.jpg';

const charactersList = [
    { id: 'player.jpg', name: 'Classic Red', color: '#ff5722' },
    { id: 'player2.jpg', name: 'Aqua Teal', color: '#00bcd4' },
    { id: 'player3.jpg', name: 'Emerald Green', color: '#4caf50' },
    { id: 'player4.jpg', name: 'Retro Gold', color: '#ffeb3b' },
    { id: 'player5.jpg', name: 'Cosmic Purple', color: '#9c27b0' }
];

const birdImg = new Image();
birdImg.src = selectedChar;

const gravity = 0.23; 
const jump = -4.5;    
const gameSpeed = 1.5; 

let bird = {
    x: 60,
    y: 180,
    velocity: 0,
    radius: 16 
};

let flappyState = 'START';

let pipes = [];
let pipeWidth = 52;
let pipeGap = 135; 
let pipeInterval = 110; 
let frameCount = 0;

let groundHeight = 56;

let clouds = [
    { x: 50, y: 50, scale: 1.2 },
    { x: 190, y: 90, scale: 0.8 },
    { x: 310, y: 40, scale: 1.0 }
];

function initFlappy() {
    stopFlappyGame();
    flappyState = 'START';
    bird.y = 180;
    bird.velocity = 0;
    pipes = [];
    flappyScore = 0;
    flappyScoreEl.innerText = 0;
    
    birdImg.src = selectedChar;

    document.addEventListener('keydown', handleFlappyKey);
    updateCoinsDisplay();
    showScreen('menu');
    updateFlappy();
}

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
    }
}

function updateCoinsDisplay() {
    document.getElementById('flappy-coin-count').innerText = flappyCoins;
    document.getElementById('shop-coin-count').innerText = flappyCoins;
    flappySidebarCoinsEl.innerText = flappyCoins;
}

function handleMenuClick(action) {
    if (action === 'play') {
        startFlappy();
    } else if (action === 'characters') {
        showScreen('characters');
    } else if (action === 'shop') {
        showScreen('shop');
    }
}

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
            <div class="char-status">${isSelected ? 'SELECTED' : (isUnlocked ? 'SELECT' : 'LOCKED')}</div>
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
        
        slice.innerHTML = `<img src="${char.id}" class="wheel-slice-img" style="transform: rotate(${-index * angleStep}deg);" alt="">`;
        wheelInner.appendChild(slice);
    });

    const allUnlocked = charactersList.every(char => unlockedChars.includes(char.id));
    const spinBtn = document.getElementById('spin-btn');
    const statusEl = document.getElementById('spin-status');
    
    if (allUnlocked) {
        spinBtn.disabled = true;
        statusEl.innerHTML = "Congratulations!<br>You own all characters.";
    } else {
        spinBtn.disabled = false;
        statusEl.innerText = "";
    }
}

let isSpinning = false;
function spinGacha() {
    if (isSpinning) return;
    if (flappyCoins < 25) {
        document.getElementById('spin-status').innerText = "Not enough coins! Play games to earn more.";
        return;
    }

    const lockedChars = charactersList.filter(char => !unlockedChars.includes(char.id));
    if (lockedChars.length === 0) {
        document.getElementById('spin-status').innerText = "All characters unlocked!";
        return;
    }

    isSpinning = true;
    flappyCoins -= 25;
    localStorage.setItem('flappyCoins', flappyCoins);
    updateCoinsDisplay();

    const targetChar = lockedChars[Math.floor(Math.random() * lockedChars.length)];
    const targetIndex = charactersList.findIndex(char => char.id === targetChar.id);
    
    const numSlices = charactersList.length;
    const angleStep = 360 / numSlices;
    const extraSpins = 5 * 360;
    const targetAngle = extraSpins - (targetIndex * angleStep);

    const wheelInner = document.getElementById('wheel-inner');
    wheelInner.style.transition = 'transform 3s cubic-bezier(0.1, 0.8, 0.3, 1)';
    wheelInner.style.transform = `rotate(${targetAngle}deg)`;

    document.getElementById('spin-status').innerText = "Spinning...";
    document.getElementById('spin-btn').disabled = true;

    setTimeout(() => {
        isSpinning = false;
        unlockedChars.push(targetChar.id);
        localStorage.setItem('unlockedChars', JSON.stringify(unlockedChars));
        
        document.getElementById('spin-status').innerHTML = `<span style="color:#00ffcc">UNLOCKED SUCCESS:</span><br>${targetChar.name}`;
        
        renderWheel();
    }, 3100);
}

function flappyJump() {
    if (flappyState === 'PLAYING') {
        bird.velocity = jump;
    }
}

function startFlappy() {
    stopFlappyGame();
    bird.y = 180;
    bird.velocity = 0;
    pipes = [];
    flappyScore = 0;
    flappyScoreEl.innerText = flappyScore;
    frameCount = 0;
    flappyState = 'PLAYING';
    birdImg.src = selectedChar;

    showScreen('none'); 

    document.addEventListener('keydown', handleFlappyKey);
    flappyCanvas.addEventListener('click', flappyJump);
    
    updateFlappy();
}

function handleFlappyKey(e) {
    if (e.keyCode === 32) {
        flappyJump();
    }
}

function updateFlappy() {
    clouds.forEach(cloud => {
        cloud.x -= gameSpeed * 0.15;
        if (cloud.x + 60 < 0) {
            cloud.x = flappyCanvas.width + Math.random() * 60;
            cloud.y = Math.random() * 120 + 10;
        }
    });

    if (flappyState === 'PLAYING') {
        frameCount++;
        
        bird.velocity += gravity;
        bird.y += bird.velocity;

        if (frameCount % pipeInterval === 0) {
            let minHeight = 40;
            let maxHeight = flappyCanvas.height - groundHeight - pipeGap - minHeight;
            let height = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
            
            pipes.push({
                x: flappyCanvas.width,
                top: height,
                bottom: flappyCanvas.height - groundHeight - height - pipeGap,
                passed: false
            });
        }

        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].x -= gameSpeed;

            if (
                bird.x + bird.radius > pipes[i].x && 
                bird.x - bird.radius < pipes[i].x + pipeWidth
            ) {
                if (
                    bird.y - bird.radius < pipes[i].top || 
                    bird.y + bird.radius > flappyCanvas.height - groundHeight - pipes[i].bottom
                ) {
                    triggerGameOver();
                    return;
                }
            }

            if (!pipes[i].passed && pipes[i].x + pipeWidth < bird.x) {
                flappyScore++;
                flappyScoreEl.innerText = flappyScore;
                pipes[i].passed = true;
            }

            if (pipes[i].x + pipeWidth < 0) {
                pipes.splice(i, 1);
            }
        }

        if (bird.y + bird.radius >= flappyCanvas.height - groundHeight || bird.y - bird.radius <= 0) {
            triggerGameOver();
            return;
        }
    } else if (flappyState === 'START') {
        bird.y = 180 + Math.sin(Date.now() / 150) * 6;
    }

    drawFlappy();

    if (flappyState === 'PLAYING' || flappyState === 'START') {
        flappyIntervalId = requestAnimationFrame(updateFlappy);
    }
}

function triggerGameOver() {
    stopFlappyGame();
    flappyState = 'GAMEOVER';

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

    document.getElementById('board-score').innerText = flappyScore;
    document.getElementById('board-best').innerText = flappyHighScore;
    document.getElementById('board-coins-earned').innerText = `+${coinsEarned}`;
    
    const newTag = document.getElementById('board-new-tag');
    if (isNewHigh) {
        newTag.classList.remove('hidden');
    } else {
        newTag.classList.add('hidden');
    }

    drawFlappy();
    flappyCtx.fillStyle = "rgba(0, 0, 0, 0.4)";
    flappyCtx.fillRect(0, 0, flappyCanvas.width, flappyCanvas.height);

    showScreen('gameover');
}

function drawCloud(x, y, scale) {
    flappyCtx.fillStyle = "rgba(255, 255, 255, 0.85)";
    flappyCtx.beginPath();
    flappyCtx.arc(x, y, 12 * scale, 0, Math.PI * 2);
    flappyCtx.arc(x + 12 * scale, y - 6 * scale, 15 * scale, 0, Math.PI * 2);
    flappyCtx.arc(x + 26 * scale, y, 10 * scale, 0, Math.PI * 2);
    flappyCtx.closePath();
    flappyCtx.fill();
}

function drawFlappy() {
    // Sky
    flappyCtx.fillStyle = '#70c5ce';
    flappyCtx.fillRect(0, 0, flappyCanvas.width, flappyCanvas.height);

    // Clouds
    clouds.forEach(cloud => {
        drawCloud(cloud.x, cloud.y, cloud.scale);
    });

    // Pipes
    pipes.forEach(pipe => {
        flappyCtx.fillStyle = '#73c72d';
        flappyCtx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
        flappyCtx.strokeStyle = '#543b20';
        flappyCtx.lineWidth = 2.5;
        flappyCtx.strokeRect(pipe.x, -5, pipeWidth, pipe.top + 5);
        
        flappyCtx.fillStyle = '#94e84d';
        flappyCtx.fillRect(pipe.x + 3, 0, 6, pipe.top);

        flappyCtx.fillStyle = '#73c72d';
        const lowerY = flappyCanvas.height - groundHeight - pipe.bottom;
        flappyCtx.fillRect(pipe.x, lowerY, pipeWidth, pipe.bottom);
        flappyCtx.strokeRect(pipe.x, lowerY, pipeWidth, pipe.bottom + 5);

        flappyCtx.fillRect(pipe.x + 3, lowerY, 6, pipe.bottom);
    });

    // Ground
    flappyCtx.fillStyle = '#ded895';
    flappyCtx.fillRect(0, flappyCanvas.height - groundHeight, flappyCanvas.width, groundHeight);
    
    flappyCtx.fillStyle = '#5cc22e';
    flappyCtx.fillRect(0, flappyCanvas.height - groundHeight, flappyCanvas.width, 10);
    
    flappyCtx.strokeStyle = '#543b20';
    flappyCtx.lineWidth = 2.5;
    flappyCtx.beginPath();
    flappyCtx.moveTo(0, flappyCanvas.height - groundHeight);
    flappyCtx.lineTo(flappyCanvas.width, flappyCanvas.height - groundHeight);
    flappyCtx.stroke();

    // Draw Bird
    const activeChar = charactersList.find(c => c.id === selectedChar) || charactersList[0];
    
    flappyCtx.save();
    flappyCtx.translate(bird.x, bird.y);
    
    let angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 8, bird.velocity * 0.08));
    flappyCtx.rotate(angle);

    try {
        if (birdImg.complete && birdImg.naturalWidth !== 0) {
            flappyCtx.drawImage(
                birdImg, 
                -bird.radius, 
                -bird.radius, 
                bird.radius * 2, 
                bird.radius * 2
            );
        } else {
            throw new Error('Fallback drawing');
        }
    } catch (e) {
        flappyCtx.fillStyle = activeChar.color;
        flappyCtx.beginPath();
        flappyCtx.arc(0, 0, bird.radius, 0, Math.PI * 2);
        flappyCtx.fill();
        flappyCtx.strokeStyle = '#222';
        flappyCtx.lineWidth = 2;
        flappyCtx.stroke();

        // Eye
        flappyCtx.fillStyle = '#fff';
        flappyCtx.beginPath();
        flappyCtx.arc(5, -4, 4, 0, Math.PI * 2);
        flappyCtx.fill();
        flappyCtx.fillStyle = '#000';
        flappyCtx.beginPath();
        flappyCtx.arc(6, -4, 1.5, 0, Math.PI * 2);
        flappyCtx.fill();

        // Beak
        flappyCtx.fillStyle = '#f07030';
        flappyCtx.beginPath();
        flappyCtx.moveTo(10, -2);
        flappyCtx.lineTo(18, 1);
        flappyCtx.lineTo(9, 4);
        flappyCtx.closePath();
        flappyCtx.fill();
        flappyCtx.stroke();

        // Wing
        flappyCtx.fillStyle = '#fff';
        flappyCtx.beginPath();
        flappyCtx.ellipse(-6, 2, 6, 4, Math.PI / 6, 0, Math.PI * 2);
        flappyCtx.fill();
        flappyCtx.stroke();
    }
    flappyCtx.restore();

    if (flappyState === 'PLAYING') {
        flappyCtx.save();
        flappyCtx.fillStyle = "#ffffff";
        flappyCtx.strokeStyle = "#000000";
        flappyCtx.lineWidth = 5;
        flappyCtx.font = "bold 40px monospace";
        flappyCtx.textAlign = "center";
        flappyCtx.strokeText(flappyScore, flappyCanvas.width / 2, 80);
        flappyCtx.fillText(flappyScore, flappyCanvas.width / 2, 80);
        flappyCtx.restore();
    }
}

function stopFlappyGame() {
    flappyState = 'GAMEOVER';
    if (flappyIntervalId) {
        cancelAnimationFrame(flappyIntervalId);
        flappyIntervalId = null;
    }
    document.removeEventListener('keydown', handleFlappyKey);
    flappyCanvas.removeEventListener('click', flappyJump);
}