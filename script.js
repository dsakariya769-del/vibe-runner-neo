const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const levelCard = document.getElementById("levelCard");

// Screens Elements
const startScreen = document.getElementById("start-screen");
const levelsScreen = document.getElementById("levels-screen");
const uiLayer = document.getElementById("ui-layer");
const levelsGrid = document.getElementById("levels-grid");

// Buttons
const startBtn = document.getElementById("start-btn");
const backToMenuBtn = document.getElementById("back-to-menu");
const exitGameBtn = document.getElementById("exit-game-btn");

canvas.width = 400;
canvas.height = 550;

// Progress Management (Hamesha ke liye save)
let unlockedLevel = parseInt(localStorage.getItem("neoUnlockedLevel")) || 1;
let currentLevel = 1;
let isGameOver = false;
let gameActive = false;
let particles = [];

const player = {
    x: 200,
    y: 480,
    radius: 10,
    speed: 5,
    vx: 0,
    vy: 0,
    trail: []
};

let obstacles = [];

// --- SCREEN NAVIGATION LOGIC ---
startBtn.addEventListener("click", showLevelsScreen);
backToMenuBtn.addEventListener("click", showStartScreen);
exitGameBtn.addEventListener("click", () => {
    gameActive = false;
    canvas.classList.add("hidden");
    uiLayer.classList.add("hidden");
    showLevelsScreen();
});

function showStartScreen() {
    startScreen.classList.remove("hidden");
    levelsScreen.classList.add("hidden");
}

function showLevelsScreen() {
    startScreen.classList.add("hidden");
    levelsScreen.classList.remove("hidden");
    buildLevelsGrid();
}

function buildLevelsGrid() {
    levelsGrid.innerHTML = "";
    for (let i = 1; i <= 100; i++) {
        const box = document.createElement("div");
        box.innerText = i;
        
        if (i < unlockedLevel) {
            box.className = "level-box unlocked"; // Passed levels
            box.addEventListener("click", () => startGame(i));
        } else if (i === unlockedLevel) {
            box.className = "level-box current"; // Active target level
            box.addEventListener("click", () => startGame(i));
        } else {
            box.className = "level-box locked"; // Future levels
        }
        levelsGrid.appendChild(box);
    }
}

function startGame(level) {
    levelsScreen.classList.add("hidden");
    canvas.classList.remove("hidden");
    uiLayer.classList.remove("hidden");
    
    currentLevel = level;
    isGameOver = false;
    gameActive = true;
    player.x = 200;
    player.y = 480;
    player.vx = 0;
    player.vy = 0;
    player.trail = [];
    generateLevel(currentLevel);
}

// --- ENGINE LOGIC ---
function generateLevel(level) {
    obstacles = [];
    levelCard.innerText = String(level).padStart(3, '0');

    let numObstacles = Math.min(4 + Math.floor(level / 4), 16); 
    let speedMultiplier = 1.2 + (level * 0.07);

    for (let i = 0; i < numObstacles; i++) {
        obstacles.push({
            x: Math.random() * (canvas.width - 80),
            y: 90 + (i * (320 / numObstacles)),
            w: Math.random() * (90 - 50) + 50,
            h: 8,
            vx: (Math.random() > 0.5 ? 1 : -1) * speedMultiplier,
            hue: (200 + (level * 5)) % 360,
            type: "normal"
        });
    }

    if (level === 100) {
        obstacles = [];
        for (let i = 0; i < 7; i++) {
            obstacles.push({ x: 0, y: 80 + (i * 55), w: 400, h: 20, vx: 0, hue: 0, type: "impossible" });
        }
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            radius: Math.random() * 3 + 1,
            alpha: 1, color: color
        });
    }
}

// Controls
window.addEventListener("touchstart", (e) => {
    if (!gameActive || isGameOver) {
        if (isGameOver) {
            isGameOver = false;
            startGame(currentLevel);
        }
        return;
    }
    const tx = e.touches[0].clientX;
    const ty = e.touches[0].clientY;
    if (ty < window.innerHeight / 2) player.vy = -player.speed;
    else player.vy = player.speed;
    if (tx < window.innerWidth / 2) player.vx = -player.speed;
    else player.vx = player.speed;
});

window.addEventListener("touchend", () => { player.vx = 0; player.vy = 0; });

function update() {
    if (!gameActive || isGameOver) return;

    player.x += player.vx;
    player.y += player.vy;

    if (player.x < 15) player.x = 15;
    if (player.x > canvas.width - 15) player.x = canvas.width - 15;
    if (player.y < 15) player.y = 15;
    if (player.y > canvas.height - 15) player.y = canvas.height - 15;

    player.trail.push({ x: player.x, y: player.y });
    if (player.trail.length > 8) player.trail.shift();

    for (let obs of obstacles) {
        obs.x += obs.vx;
        if (obs.x <= 0 || obs.x + obs.w >= canvas.width) obs.vx *= -1;

        if (player.x + 8 > obs.x && player.x - 8 < obs.x + obs.w &&
            player.y + 8 > obs.y && player.y - 8 < obs.y + obs.h) {
            createExplosion(player.x, player.y, "#ff0055");
            player.x = 200; player.y = 480;
            if (currentLevel === 100) isGameOver = true;
        }
    }

    // Goal clear check
    if (player.y <= 50) {
        createExplosion(player.x, player.y, "#00ffaa");
        
        // Level Update and localstorage saving
        if (currentLevel === unlockedLevel) {
            unlockedLevel = Math.min(unlockedLevel + 1, 100);
            localStorage.setItem("neoUnlockedLevel", unlockedLevel);
        }
        
        if (currentLevel < 100) {
            currentLevel++;
            player.x = 200; player.y = 480;
            generateLevel(currentLevel);
        } else {
            gameActive = false;
            alert("SYSTEM BEATEN. YOU ARE GOD.");
            showLevelsScreen();
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i]; p.x += p.vx; p.y += p.vy; p.alpha -= 0.02;
        if (p.alpha <= 0) particles.splice(i, 1);
    }
}

function draw() {
    if (!gameActive) return;

    ctx.fillStyle = "rgba(10, 11, 30, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(0, 255, 170, 0.1)";
    ctx.fillRect(0, 0, canvas.width, 50);
    ctx.strokeStyle = "#00ffaa";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 50); ctx.lineTo(canvas.width, 50); ctx.stroke();

    player.trail.forEach((t, index) => {
        ctx.fillStyle = `rgba(0, 255, 255, ${index * 0.1})`;
        ctx.beginPath(); ctx.arc(t.x, t.y, player.radius * (index / 8), 0, Math.PI * 2); ctx.fill();
    });

    ctx.shadowBlur = 15; ctx.shadowColor = "#00ffff";
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2); ctx.fill();

    for (let obs of obstacles) {
        ctx.shadowColor = `hsl(${obs.hue}, 100%, 50%)`;
        ctx.fillStyle = `hsl(${obs.hue}, 100%, 60%)`;
        ctx.shadowBlur = 12;
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    }
    ctx.shadowBlur = 0;

    for (let p of particles) {
        ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    if (isGameOver) {
        ctx.fillStyle = "rgba(2, 2, 5, 0.9)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ff0055";
        ctx.font = "900 28px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("CRITICAL ERROR", canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px monospace";
        ctx.fillText("LEVEL 100 CODE: UNRESOLVABLE", canvas.width / 2, canvas.height / 2 + 15);
        ctx.fillStyle = "#666ff8";
        ctx.fillText("TAP SCREEN TO REBOOT SYSTEM", canvas.width / 2, canvas.height / 2 + 50);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Start core system engine
loop();