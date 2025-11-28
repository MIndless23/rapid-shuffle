// State Management
const state = {
    streak: 0,
    highScore: 0,
    isShuffling: false,
    isGameActive: false,
    ballPosition: 1,
    shellPositions: [0, 1, 2],
    pendingScore: null,
    difficulty: 'easy'
};

// Difficulty Settings
const DIFFICULTY_SETTINGS = {
    easy: { swapSpeed: 400, shuffleMoves: 6 },
    medium: { swapSpeed: 250, shuffleMoves: 10 },
    hard: { swapSpeed: 150, shuffleMoves: 15 }
};

// DOM Elements
const shells = document.querySelectorAll('.shell');
const ball = document.getElementById('ball');
const playBtn = document.getElementById('play-btn');
const resetBtn = document.getElementById('reset-btn');
const messageDisplay = document.getElementById('message');
const streakDisplay = document.getElementById('streak');
const highScoreDisplay = document.getElementById('high-score');
const leaderboardList = document.getElementById('leaderboard-list');
const leaderboardInput = document.getElementById('leaderboard-input');
const playerNameInput = document.getElementById('player-name');
const submitScoreBtn = document.getElementById('submit-score');

// Redemption Elements
const redemptionPopup = document.getElementById('redemption-popup');
const redeemYesBtn = document.getElementById('redeem-yes-btn');
const redeemNoBtn = document.getElementById('redeem-no-btn');

// Constants
const LEADERBOARD_KEY = 'shellGameLeaderboard';

// Audio Context
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
        }
    }
    return audioCtx;
}

function playInitializeSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
    } catch (err) {
        console.warn('Initialize sound failed', err);
    }
}

function playSwapSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.value = 300 + Math.random() * 200;
        
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    } catch (err) {
        console.warn('Swap sound failed', err);
    }
}

function playCorrectSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        
        // Happy arpeggio
        const notes = [523.25, 659.25, 783.99]; // C, E, G
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const startTime = ctx.currentTime + (i * 0.08);
            gain.gain.setValueAtTime(0.25, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    } catch (err) {
        console.warn('Correct sound failed', err);
    }
}

function playWrongSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        
        // Sad descending notes
        const notes = [400, 350, 300];
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            
            const startTime = ctx.currentTime + (i * 0.15);
            gain.gain.setValueAtTime(0.2, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(startTime);
            osc.stop(startTime + 0.4);
        });
    } catch (err) {
        console.warn('Wrong sound failed', err);
    }
}

function init() {
    playBtn.addEventListener('click', startGame);
    resetBtn.addEventListener('click', resetGame);
    submitScoreBtn.addEventListener('click', submitScore);
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitScore();
    });
    
    // Redemption Listeners
    redeemYesBtn.addEventListener('click', startRedemption);
    redeemNoBtn.addEventListener('click', () => {
        redemptionPopup.style.display = 'none';
        processFinalLoss();
    });
    
    shells.forEach((shell, index) => {
        shell.addEventListener('click', () => handleShellClick(index));
        shell.style.order = index;
        shell.dataset.originalIndex = index;
    });
    
    hideBall(state.ballPosition);
    loadLeaderboard();
    console.log("// SYSTEM INITIALIZED");
}

// Difficulty Functions
function randomizeDifficulty() {
    const difficulties = ['easy', 'medium', 'hard'];
    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    state.difficulty = randomDifficulty;
    setMessage(`// DIFFICULTY: ${randomDifficulty.toUpperCase()}`, "default");
}

// Leaderboard Functions
function loadLeaderboard() {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    const leaderboard = data ? JSON.parse(data) : [];
    renderLeaderboard(leaderboard);
}

function renderLeaderboard(leaderboard) {
    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = '<div class="leaderboard-empty">// NO DATA</div>';
        return;
    }
    
    leaderboard.sort((a, b) => b.score - a.score);
    const top10 = leaderboard.slice(0, 10);
    
    leaderboardList.innerHTML = top10.map((entry, index) => `
        <div class="leaderboard-entry">
            <span class="leaderboard-rank">${index + 1}.</span>
            <span class="leaderboard-name">${escapeHtml(entry.name)}</span>
            <span class="leaderboard-score">${entry.score}</span>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function checkLeaderboardEligibility(score) {
    if (score <= 0) return false;
    
    const data = localStorage.getItem(LEADERBOARD_KEY);
    const leaderboard = data ? JSON.parse(data) : [];
    
    if (leaderboard.length < 10) return true;
    
    leaderboard.sort((a, b) => b.score - a.score);
    const lowestTop10 = leaderboard[9]?.score || 0;
    
    return score > lowestTop10;
}

function showLeaderboardInput(score) {
    state.pendingScore = score;
    leaderboardInput.style.display = 'flex';
    playerNameInput.value = '';
    playerNameInput.focus();
}

function hideLeaderboardInput() {
    leaderboardInput.style.display = 'none';
    state.pendingScore = null;
}

function submitScore() {
    const name = playerNameInput.value.trim();
    if (!name || state.pendingScore === null) return;
    
    const data = localStorage.getItem(LEADERBOARD_KEY);
    const leaderboard = data ? JSON.parse(data) : [];
    
    leaderboard.push({
        name: name.substring(0, 10),
        score: state.pendingScore,
        difficulty: state.difficulty,
        date: Date.now()
    });
    
    leaderboard.sort((a, b) => b.score - a.score);
    const top10 = leaderboard.slice(0, 10);
    
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(top10));
    renderLeaderboard(top10);
    hideLeaderboardInput();
    setMessage("// SCORE UPLOADED TO DATABASE", "success");
}

// Game Functions
async function startGame() {
    if (state.isShuffling) return;
    
    // Play initialize sound
    playInitializeSound();
    
    // Randomize difficulty each game
    randomizeDifficulty();
    
    const settings = DIFFICULTY_SETTINGS[state.difficulty];
    
    hideLeaderboardInput();
    resetShells();
    state.isShuffling = true;
    state.isGameActive = false;
    playBtn.disabled = true;
    resetBtn.disabled = true;
    setMessage("// SCANNING TARGET...", "default");
    
    shells.forEach(shell => shell.classList.add('no-hover'));

    revealBall(state.ballPosition);
    
    await new Promise(r => setTimeout(r, 1000));
    
    resetShells();
    ball.style.display = 'none';
    setMessage("// INITIATING SHUFFLE PROTOCOL...", "default");
    
    await new Promise(r => setTimeout(r, 400));

    let moves = 0;
    while (moves < settings.shuffleMoves) {
        await performSwap(settings.swapSpeed);
        moves++;
    }
    
    updateBallPositionDuringSwap();

    state.isShuffling = false;
    state.isGameActive = true;
    resetBtn.disabled = false;
    setMessage("// SELECT TARGET CONTAINER", "default");
    
    shells.forEach(shell => shell.classList.remove('no-hover'));
}

async function performSwap(swapSpeed) {
    let pos1 = Math.floor(Math.random() * 3);
    let pos2 = Math.floor(Math.random() * 3);
    while (pos1 === pos2) {
        pos2 = Math.floor(Math.random() * 3);
    }

    const shellIdx1 = state.shellPositions.indexOf(pos1);
    const shellIdx2 = state.shellPositions.indexOf(pos2);
    
    state.shellPositions[shellIdx1] = pos2;
    state.shellPositions[shellIdx2] = pos1;
    
    playSwapSound(); // Play sound on each swap
    
    updateShellVisuals(swapSpeed);
    
    await new Promise(r => setTimeout(r, swapSpeed));
}

function getShellAtPosition(pos) {
    const shellIndex = state.shellPositions.indexOf(pos);
    return shells[shellIndex];
}

function updateShellVisuals(speed = 300) {
    shells.forEach((shell, i) => {
        shell.style.transition = `transform ${speed}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
        const visualPos = state.shellPositions[i];
        const currentTransform = (visualPos - i) * 200; // 2x bigger spacing
        shell.style.transform = `translateX(${currentTransform}px)`;
    });
}

function updateBallPositionDuringSwap() {
    const ballShell = shells[state.ballPosition];
    const visualPos = state.shellPositions[state.ballPosition];
    
    const containerRect = document.querySelector('.shell-container').getBoundingClientRect();
    const playAreaRect = document.querySelector('.play-area').getBoundingClientRect();
    
    const slotCenterX = (containerRect.left - playAreaRect.left) + (visualPos * 200) + 80; // 2x bigger spacing + center
    const leftOffset = slotCenterX - 25;
    
    ball.style.left = `${leftOffset}px`;
}

function handleShellClick(originalIndex) {
    if (state.isShuffling || !state.isGameActive) return;
    
    state.isGameActive = false;
    
    const clickedShell = shells[originalIndex];
    const isCorrect = originalIndex === state.ballPosition;
    
    revealSequence(originalIndex, isCorrect);
}

async function revealSequence(clickedIndex, isCorrect) {
    const clickedShell = shells[clickedIndex];
    const correctShell = shells[state.ballPosition];
    
    updateBallPositionDuringSwap();
    ball.style.display = 'block';
    
    liftShell(clickedShell);
    
    // Wait for cup to fully lift before showing result
    await new Promise(r => setTimeout(r, 600));
    
    if (isCorrect) {
        // Now add the bounce animation after cup is lifted
        playCorrectSound(); // Play correct sound
        ball.classList.add('winner');
        handleWin();
    } else {
        playWrongSound(); // Play wrong sound
        setMessage("// ACCESS DENIED", "error");
        
        await new Promise(r => setTimeout(r, 500));
        
        liftShell(correctShell);
        
        // Wait for correct cup to lift before bounce
        await new Promise(r => setTimeout(r, 600));
        
        ball.classList.add('winner');
        
        await new Promise(r => setTimeout(r, 200));
        
        handleLoss(clickedIndex);
    }
}

function liftShell(shell) {
    const shellIndex = parseInt(shell.dataset.originalIndex);
    const visualPos = state.shellPositions[shellIndex];
    const currentTransformX = (visualPos - shellIndex) * 100;
    
    shell.style.transform = `translateX(${currentTransformX}px) translateY(-60px)`;
}

function updateBallPosition() {
    updateBallPositionDuringSwap();
    ball.style.display = 'block';
}

function hideBall(index) {
    state.ballPosition = index;
    state.shellPositions = [0, 1, 2];
    shells.forEach(s => s.style.transform = 'translateX(0)');
    ball.classList.remove('winner');
    updateBallPositionDuringSwap();
}

async function revealBall(index) {
    updateBallPositionDuringSwap();
    ball.style.display = 'block';
    liftShell(shells[index]);
}

function resetShells() {
    shells.forEach((shell, i) => {
        const visualPos = state.shellPositions[i];
        const currentTransformX = (visualPos - i) * 100;
        shell.style.transform = `translateX(${currentTransformX}px)`;
    });
}

function handleWin() {
    setMessage("// TARGET ACQUIRED! +1 CREDIT", "success");
    state.streak++;
    if (state.streak > state.highScore) state.highScore = state.streak;
    updateScoreboard(true);
    
    playBtn.disabled = false;
    playBtn.querySelector('span').textContent = "CONTINUE";
}

function handleLoss(clickedIndex) {
    setMessage("// SYSTEM FAILURE - INITIATING REDEMPTION PROTOCOL...", "error");
    
    // Show Redemption Popup instead of immediate loss
    setTimeout(() => {
        redemptionPopup.style.display = 'flex';
    }, 1000);
}

function processFinalLoss() {
    const finalScore = state.streak;
    setMessage("// SYSTEM FAILURE - STREAK RESET", "error");
    
    if (checkLeaderboardEligibility(finalScore)) {
        setTimeout(() => {
            setMessage("// NEW HIGH SCORE! ENTER NAME", "success");
            showLeaderboardInput(finalScore);
        }, 1500);
    }
    
    state.streak = 0;
    updateScoreboard(false);
    
    playBtn.disabled = false;
    playBtn.querySelector('span').textContent = "RETRY";
}

function startRedemption() {
    redemptionPopup.style.display = 'none';
    
    // Create backrooms transition overlay
    const transitionOverlay = document.createElement('div');
    transitionOverlay.className = 'backrooms-transition';
    document.body.appendChild(transitionOverlay);
    
    // Start falling animation on game container
    const gameContainer = document.querySelector('.game-container');
    gameContainer.classList.add('falling');
    
    // Play falling sound
    playBackroomsFallSound();
    
    // Wait for animation, then start Doom
    setTimeout(() => {
        // Start Doom Game
        if (window.doomGame) {
            window.doomGame.start((won) => {
                // Remove transition overlay
                transitionOverlay.remove();
                gameContainer.classList.remove('falling');
                
                if (won) {
                    setMessage("// REDEMPTION SUCCESSFUL - STREAK RESTORED", "success");
                    playBtn.querySelector('span').textContent = "CONTINUE";
                    playBtn.disabled = false;
                    // Don't reset streak
                } else {
                    processFinalLoss();
                }
            });
        } else {
            console.error("Doom game module not loaded");
            transitionOverlay.remove();
            gameContainer.classList.remove('falling');
            processFinalLoss();
        }
    }, 1500); // Match animation duration
}

function playBackroomsFallSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        
        // Low rumble that descends
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc1.type = 'sine';
        osc2.type = 'sine';
        
        osc1.frequency.setValueAtTime(120, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 1.5);
        
        osc2.frequency.setValueAtTime(180, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 1.5);
        
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
        
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 1.5);
        osc2.stop(ctx.currentTime + 1.5);
        
        // Add glitch sounds
        for (let i = 0; i < 5; i++) {
            const glitchTime = ctx.currentTime + (Math.random() * 1.5);
            const noise = ctx.createBufferSource();
            const bufferSize = ctx.sampleRate * 0.05;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let j = 0; j < bufferSize; j++) {
                data[j] = (Math.random() * 2 - 1) * 0.2;
            }
            
            noise.buffer = buffer;
            const glitchGain = ctx.createGain();
            glitchGain.gain.value = 0.1;
            
            noise.connect(glitchGain);
            glitchGain.connect(ctx.destination);
            noise.start(glitchTime);
        }
    } catch (err) {
        console.warn('Backrooms fall sound failed', err);
    }
}

function updateScoreboard(isWin) {
    if (isWin) {
        streakDisplay.classList.add('pop');
        setTimeout(() => streakDisplay.classList.remove('pop'), 400);
    }
    
    streakDisplay.textContent = state.streak;
    highScoreDisplay.textContent = state.highScore;
}

function setMessage(text, type) {
    messageDisplay.textContent = text;
    messageDisplay.className = 'cyber-message';
    if (type === 'error') messageDisplay.classList.add('error');
    if (type === 'success') messageDisplay.classList.add('success');
}

function resetGame() {
    state.streak = 0;
    state.ballPosition = 1;
    state.isShuffling = false;
    state.isGameActive = false;
    state.shellPositions = [0, 1, 2];
    
    hideLeaderboardInput();
    updateScoreboard(false);
    hideBall(1);
    resetShells();
    ball.style.display = 'none';
    
    playBtn.disabled = false;
    playBtn.querySelector('span').textContent = "INITIALIZE";
    setMessage("// AWAITING INPUT...", "default");
}

window.addEventListener('resize', () => {
    if (!state.isShuffling) updateBallPositionDuringSwap();
});

init();
