# RAPID SHUFFLE - Cyberpunk Shell Game

A visually stunning, cyberpunk-themed shell game (three-cup monte) built with vanilla HTML, CSS, and JavaScript.

![Cyberpunk Theme](https://img.shields.io/badge/Theme-Cyberpunk%202077-yellow)
![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-green)
![No Dependencies](https://img.shields.io/badge/Dependencies-None-blue)

---

## 🎮 Game Overview

Track the ball hidden under one of three holographic cups as they shuffle. Test your observation skills across three difficulty levels!

### Features
- **Three Difficulty Levels**: Easy, Medium, Hard (adjusts speed and shuffle count)
- **Leaderboard**: Local storage persistent high scores
- **Cyberpunk 2077 Aesthetic**: Neon colors, glitch effects, video background
- **Smooth Animations**: CSS transitions for cup movements and reveals
- **Responsive Design**: Works on various screen sizes

---

## 📁 Project Structure

```
rapid-shuffle/
├── index.html          # Main HTML structure
├── style.css           # All styling and animations
├── script.js           # Game logic and state management
├── ball.jpg            # Custom ball image (user-provided)
├── vaporwave-car.gif   # Animated background
├── README.md           # This file
└── GAME_DESIGN.md      # Original design document
```

---

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari)
- No build tools or dependencies required!

### Installation
1. Clone or download the project
2. Add your custom assets:
   - `ball.jpg` - Image to display as the ball (will be cropped to circle)
   - `vaporwave-car.gif` - Animated background image
3. Open `index.html` in a browser

---

## 🏗️ Code Architecture

### State Management (`script.js`)

The game uses a central state object:

```javascript
const state = {
    streak: 0,              // Current win streak
    highScore: 0,           // Session high score
    isShuffling: false,     // True during shuffle animation
    isGameActive: false,    // True when waiting for player input
    ballPosition: 1,        // Which shell has the ball (0, 1, or 2)
    shellPositions: [0,1,2],// Visual positions of each shell
    pendingScore: null,     // Score awaiting leaderboard entry
    difficulty: 'easy'      // Current difficulty setting
};
```

### Difficulty Settings

```javascript
const DIFFICULTY_SETTINGS = {
    easy:   { swapSpeed: 400, shuffleMoves: 6 },
    medium: { swapSpeed: 250, shuffleMoves: 10 },
    hard:   { swapSpeed: 150, shuffleMoves: 15 }
};
```

### Key Functions

| Function | Description |
|----------|-------------|
| `startGame()` | Initializes a new round, shows ball, triggers shuffle |
| `performSwap(speed)` | Swaps two random shells with animation |
| `handleShellClick(index)` | Processes player's guess |
| `revealSequence(index, isCorrect)` | Animates the result reveal |
| `updateShellVisuals(speed)` | Updates CSS transforms for shell positions |
| `setDifficulty(level)` | Changes game difficulty |
| `loadLeaderboard()` | Loads scores from localStorage |
| `submitScore()` | Saves new score to leaderboard |

### CSS Classes

| Class | Purpose |
|-------|---------|
| `.shell` | Base shell/cup styling |
| `.shell.no-hover` | Disables hover effects during animation |
| `.shell.active` | Lifted shell state (legacy) |
| `.ball` | Ball element with circular crop |
| `.ball.winner` | Triggers bounce animation |
| `.glitch` | Title with glitch animation |
| `.cyber-btn` | Styled button component |
| `.leaderboard` | Left panel for high scores |
| `.difficulty-panel` | Right panel for difficulty selection |

---

## 🎨 Customization Guide

### Changing Colors

Edit CSS variables in `:root` at the top of `style.css`:

```css
:root {
    --bg-dark: #0a0a0f;
    --neon-cyan: #00f0ff;
    --neon-magenta: #ff00ff;
    --neon-pink: #ff2a6d;
    --neon-yellow: #f9f002;
    --neon-green: #05ffa1;
}
```

### Adjusting Difficulty

Modify `DIFFICULTY_SETTINGS` in `script.js`:
- `swapSpeed`: Milliseconds per swap (lower = faster)
- `shuffleMoves`: Number of swaps per round

### Changing the Ball Image

Replace `ball.jpg` with your image. The CSS will automatically:
- Crop it to a circle (`border-radius: 50%`)
- Add a neon glow effect
- Scale to 50x50 pixels

### Changing Background Video

Replace `videoplayback.mp4`. The video will:
- Autoplay on load (muted for browser compatibility)
- Loop infinitely
- Cover the full viewport
- Have a dark overlay for readability

---

## 🔧 Development Notes

### Adding New Features

1. **New Difficulty Level**: Add entry to `DIFFICULTY_SETTINGS`, add button in HTML
2. **Sound Effects**: Add `<audio>` elements, trigger with `audio.play()` in JS
3. **More Cups**: Increase shell count in HTML, adjust spacing in CSS, update logic in JS

### Known Considerations

- Ball position uses `getBoundingClientRect()` for accurate placement
- Shell transforms use `translateX()` to maintain layout flow
- Hover effects disabled during shuffle via `.no-hover` class
- Leaderboard uses `localStorage` (clears if browser data cleared)

### Browser Compatibility

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

---

## 📝 TODO / Future Enhancements

- [ ] Add sound effects (shuffle, win, lose)
- [ ] Online leaderboard (requires backend)
- [ ] Mobile touch optimization
- [ ] Additional themes (retro, neon noir, etc.)
- [ ] Multiplayer mode
- [ ] Betting system with virtual currency

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test in multiple browsers
4. Submit a pull request

### Code Style
- Use `async/await` for animations
- Keep state centralized in `state` object
- Use CSS transitions over JS animations where possible
- Comment complex logic

---

## 📄 License

This project is for educational/personal use.

---

## 👥 Team

- Add your team members here

---

*Built with ☕ and cyberpunk vibes*


