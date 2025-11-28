# Project: Shell Cup Game (Web Version)

## Overview
This document serves as the master prompt and specification for building a "Three Shell Game" (also known as Thimblerig). The goal is to create an interactive web-based game where a player must track a ball hidden under one of three moving shells.

## Tech Stack
- **Frontend**: HTML5, CSS3 (Animations), JavaScript (ES6+).
- **Libraries**: None required (Vanilla JS preferred for performance and simplicity).
- **Styling**: CSS Grid/Flexbox for layout, CSS Transitions for animations.

## Game Mechanics
1.  **Setup**: 
    -   Display 3 shells (cups) in a row.
    -   Display 1 ball.
2.  **Start Sequence**:
    -   The ball is shown.
    -   The ball moves under one of the shells (or a shell is placed over it).
    -   The shells shuffle positions rapidly for a set duration or number of swaps.
3.  **Player Interaction**:
    -   Click interaction is disabled during shuffling.
    -   After shuffling stops, the player clicks one shell to make a guess.
4.  **Win/Loss Condition**:
    -   **Win**: The selected shell lifts to reveal the ball.
    -   **Loss**: The selected shell lifts to reveal nothing; the correct shell is then revealed.
5.  **Scoring**:
    -   Track current streak and high score.

## Implementation Plan (Step-by-Step)

### Phase 1: Structure & Visuals
-   Create `index.html`, `style.css`, `script.js`.
-   Implement CSS shapes for the Shells (upside-down U shape) and the Ball (circle).
-   Position elements centrally using Flexbox.

### Phase 2: Core Logic
-   Implement state management: `gameState` ('idle', 'shuffling', 'waiting_for_guess', 'revealing').
-   Create function `hideBall(shellIndex)` to logically place the ball.
-   Create function `checkGuess(shellIndex)` to validate player input.

### Phase 3: The Shuffle Animation
-   **Crucial Step**: Implement the visual swapping logic.
    -   Use CSS transforms (`translate`) to move shells.
    -   Write a JS function `swap(shellA, shellB)` that animates two shells exchanging positions.
    -   Chain multiple swaps together to create the shuffling effect.

### Phase 4: Polish & UI
-   Add "Play" button to start the round.
-   Add Scoreboard UI.
-   Add simple sound effects (optional): Shuffle sound, Win chime, Fail buzzer.

## Future Scalability
-   **Difficulty Settings**: Increase shuffle speed or number of swaps.
-   **Betting System**: Add a virtual currency system.
-   **Assets**: Replace CSS shapes with SVG icons or images for better aesthetics.

## Prompt for AI Assistance
*To continue working on this project, use the following prompt:*
"I am working on the Shell Cup Game defined in `GAME_DESIGN.md`. Please implement [Phase X] focusing on [specific feature]. Ensure animations are smooth and state is managed correctly."


