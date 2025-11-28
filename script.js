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
const difficultyBtns = document.querySelectorAll('.difficulty-btn');

// Constants
const LEADERBOARD_KEY = 'shellGameLeaderboard';

function init() {
    playBtn.addEventListener('click', startGame);
    resetBtn.addEventListener('click', resetGame);
    submitScoreBtn.addEventListener('click', submitScore);
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitScore();
    });
    
    // Difficulty buttons
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => setDifficulty(btn.dataset.difficulty));
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
function setDifficulty(difficulty) {
    if (state.isShuffling) return;
    
    state.difficulty = difficulty;
    
    // Update button states
    difficultyBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
    });
    
    setMessage(`// DIFFICULTY SET: ${difficulty.toUpperCase()}`, "default");
}

function disableDifficultyButtons() {
    difficultyBtns.forEach(btn => btn.disabled = true);
}

function enableDifficultyButtons() {
    difficultyBtns.forEach(btn => btn.disabled = false);
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
    
    const settings = DIFFICULTY_SETTINGS[state.difficulty];
    
    hideLeaderboardInput();
    resetShells();
    state.isShuffling = true;
    state.isGameActive = false;
    playBtn.disabled = true;
    resetBtn.disabled = true;
    disableDifficultyButtons();
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
    enableDifficultyButtons();
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
        const currentTransform = (visualPos - i) * 100;
        shell.style.transform = `translateX(${currentTransform}px)`;
    });
}

function updateBallPositionDuringSwap() {
    const ballShell = shells[state.ballPosition];
    const visualPos = state.shellPositions[state.ballPosition];
    
    const containerRect = document.querySelector('.shell-container').getBoundingClientRect();
    const playAreaRect = document.querySelector('.play-area').getBoundingClientRect();
    
    const slotCenterX = (containerRect.left - playAreaRect.left) + (visualPos * 100) + 40;
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
        ball.classList.add('winner');
        handleWin();
    } else {
        setMessage("// ACCESS DENIED", "error");
        
        await new Promise(r => setTimeout(r, 500));
        
        liftShell(correctShell);
        
        // Wait for correct cup to lift before bounce
        await new Promise(r => setTimeout(r, 600));
        
        ball.classList.add('winner');
        
        await new Promise(r => setTimeout(r, 200));
        
        handleLoss(clickedIndex);
    }
    
    playBtn.disabled = false;
    playBtn.querySelector('span').textContent = "RETRY";
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
}

function handleLoss(clickedIndex) {
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
    enableDifficultyButtons();
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
