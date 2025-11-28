class DoomGame {
    constructor() {
        this.canvas = document.getElementById('doom-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('doom-overlay');
        this.hpElement = document.getElementById('doom-hp');
        this.targetsElement = document.getElementById('doom-targets');
        this.messageElement = document.getElementById('doom-message');

        this.resize();

        this.running = false;
        this.onComplete = null;

        // 0 = empty, 1 = wall
        this.map = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
            [1,0,1,1,1,0,1,0,1,0,1,1,1,1,0,1],
            [1,0,1,0,0,0,1,0,0,0,0,0,0,1,0,1],
            [1,0,1,0,1,1,1,1,1,1,1,0,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,1],
            [1,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
            [1,0,1,0,1,1,0,1,1,0,1,0,1,1,0,1],
            [1,0,0,0,1,0,0,0,1,0,0,0,0,1,0,1],
            [1,1,1,0,1,0,1,0,1,1,1,1,0,1,0,1],
            [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,1,0,1,1,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        this.mapHeight = this.map.length;
        this.mapWidth = this.map[0].length;

        this.player = {
            x: 1.5,
            y: 1.5,
            dirX: 1,
            dirY: 0,
            planeX: 0,
            planeY: 0.66
        };

        this.ball = { x: 0, y: 0, collected: false };

        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };

        this.enemies = [];
        this.maxEnemies = 1; // Single monster
        this.lastTime = 0;

        // Audio for footsteps
        this.audioCtx = null;
        this.lastStepPos = { x: this.player.x, y: this.player.y };
        this.stepDistance = 0.55;
        
        // Sniffing audio
        this.lastSniffTime = 0;
        this.sniffInterval = 2000; // Base interval in ms

        // Wall texture (walls.png)
        this.wallTexture = new Image();
        this.wallTexture.src = 'assets/walls.png';
        this.wallTextureLoaded = false;
        this.wallTexture.onload = () => {
            console.log('Wall texture loaded:', this.wallTexture.width, 'x', this.wallTexture.height);
            this.wallTextureLoaded = true;
        };
        this.wallTexture.onerror = () => {
            console.error('Failed to load assets/walls.png');
        };

        // Enemy sprite (nose.gif)
        this.enemyImage = new Image();
        this.enemyImage.src = 'assets/nose.gif';
        this.enemyImageLoaded = false;
        this.enemyImage.onload = () => {
            console.log('Enemy image loaded:', this.enemyImage.width, 'x', this.enemyImage.height);
            this.enemyImageLoaded = true;
        };
        this.enemyImage.onerror = (e) => {
            console.error('Failed to load assets/nose.gif', e);
        };
        
        // Flashlight sprite
        this.flashlightImage = new Image();
        this.flashlightImage.src = 'assets/flashlight.png';
        this.flashlightLoaded = false;
        this.flashlightImage.onload = () => {
            console.log('Flashlight loaded:', this.flashlightImage.width, 'x', this.flashlightImage.height);
            this.flashlightLoaded = true;
        };
        this.flashlightImage.onerror = () => {
            console.error('Failed to load assets/flashlight.png');
        };
        
        // Ball texture (target)
        this.ballImage = new Image();
        this.ballImage.src = 'assets/target.jpg';
        this.ballImageLoaded = false;
        this.ballImage.onload = () => {
            console.log('Target texture loaded:', this.ballImage.width, 'x', this.ballImage.height);
            this.ballImageLoaded = true;
        };
        this.ballImage.onerror = () => {
            console.error('Failed to load assets/target.jpg');
        };

        this.bindInput();
        window.addEventListener('resize', () => this.resize());
    }

    bindInput() {
        document.addEventListener('keydown', (e) => {
            if (!this.running) return;
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.input.forward = true;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.input.backward = true;
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.input.left = true;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.input.right = true;
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.input.forward = false;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.input.backward = false;
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.input.left = false;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.input.right = false;
                    break;
            }
        });
    }

    resize() {
        if (!this.canvas) return;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    playFootstep() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            if (!this.audioCtx) {
                this.audioCtx = new AudioCtx();
            }
            const ctx = this.audioCtx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.value = 140 + Math.random() * 40;

            gain.gain.setValueAtTime(0.18, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.12);
        } catch (err) {
            console.warn('Footstep sound failed', err);
        }
    }
    
    playSniff(volume) {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            if (!this.audioCtx) {
                this.audioCtx = new AudioCtx();
            }
            const ctx = this.audioCtx;
            
            // Create inhale sound (short noise burst)
            const noise = ctx.createBufferSource();
            const bufferSize = ctx.sampleRate * 0.3;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.3;
            }
            
            noise.buffer = buffer;
            
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 800;
            
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(volume * 0.4, ctx.currentTime + 0.05);
            gain.gain.linearRampToValueAtTime(volume * 0.6, ctx.currentTime + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            
            noise.start(ctx.currentTime);
            noise.stop(ctx.currentTime + 0.3);
        } catch (err) {
            console.warn('Sniff sound failed', err);
        }
    }
    
    playJumpscare() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            if (!this.audioCtx) {
                this.audioCtx = new AudioCtx();
            }
            const ctx = this.audioCtx;
            
            // Create loud, terrifying jumpscare sound
            // Multiple oscillators for harsh, dissonant sound
            const freqs = [120, 180, 240, 360, 480];
            
            freqs.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                
                // Loud, sudden attack
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.8 / freqs.length, ctx.currentTime + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 1.2);
            });
            
            // Add noise burst for extra terror
            const noise = ctx.createBufferSource();
            const bufferSize = ctx.sampleRate * 0.5;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1);
            }
            
            noise.buffer = buffer;
            
            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0, ctx.currentTime);
            noiseGain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.05);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            
            noise.connect(noiseGain);
            noiseGain.connect(ctx.destination);
            
            noise.start(ctx.currentTime);
            noise.stop(ctx.currentTime + 0.5);
            
        } catch (err) {
            console.warn('Jumpscare sound failed', err);
        }
    }

    start(callback) {
        this.onComplete = callback;
        this.running = true;

        // Reset player
        this.player.x = 1.5;
        this.player.y = 1.5;
        this.player.dirX = 1;
        this.player.dirY = 0;
        this.player.planeX = 0;
        this.player.planeY = 0.66;

        this.input.forward = this.input.backward = this.input.left = this.input.right = false;

        this.enemies = [];
        this.ball.collected = false;
        this.lastStepPos.x = this.player.x;
        this.lastStepPos.y = this.player.y;

        this.spawnEntities();

        if (this.overlay) this.overlay.style.display = 'block';
        if (this.messageElement) this.messageElement.style.display = 'none';

        const doomScore = document.querySelector('.doom-score');
        if (doomScore) {
            doomScore.innerHTML = 'OBJECTIVE: <span style="color:var(--neon-yellow)">FIND THE BALL</span>';
        }
        if (this.hpElement && this.hpElement.parentElement) {
            this.hpElement.parentElement.style.display = 'none';
        }

        this.updateUI();

        requestAnimationFrame((t) => {
            this.lastTime = t;
            this.loop(t);
        });
    }

    spawnEntities() {
        // Spawn ball far from the player
        let bx;
        let by;
        do {
            bx = Math.floor(Math.random() * this.mapWidth);
            by = Math.floor(Math.random() * this.mapHeight);
        } while (
            this.map[by][bx] !== 0 ||
            Math.hypot(bx + 0.5 - this.player.x, by + 0.5 - this.player.y) < 8
        );

        this.ball.x = bx + 0.5;
        this.ball.y = by + 0.5;

        // Spawn enemies
        for (let i = 0; i < this.maxEnemies; i++) {
            let ex;
            let ey;
            do {
                ex = Math.floor(Math.random() * this.mapWidth);
                ey = Math.floor(Math.random() * this.mapHeight);
            } while (
                this.map[ey][ex] !== 0 ||
                Math.hypot(ex + 0.5 - this.player.x, ey + 0.5 - this.player.y) < 6
            );

            this.enemies.push({
                x: ex + 0.5,
                y: ey + 0.5,
                speed: 1.0 + Math.random() * 0.3 // Slower chase
            });
        }
    }

    stop(won) {
        this.running = false;
        if (this.messageElement) {
            this.messageElement.textContent = won ? 'TARGET ACQUIRED' : 'CRITICAL FAILURE';
            this.messageElement.style.display = 'block';
            this.messageElement.style.color = won ? 'var(--neon-yellow)' : 'var(--neon-pink)';
        }

        setTimeout(() => {
            if (this.overlay) this.overlay.style.display = 'none';
            if (this.onComplete) this.onComplete(won);
        }, 2000);
    }

    update(dt) {
        if (!this.running) return;

        const moveSpeed = 4.0 * dt;
        const rotSpeed = 2.5 * dt;

        // Rotation (fixed so controls feel normal)
        if (this.input.right) {
            const oldDirX = this.player.dirX;
            this.player.dirX =
                this.player.dirX * Math.cos(rotSpeed) - this.player.dirY * Math.sin(rotSpeed);
            this.player.dirY =
                oldDirX * Math.sin(rotSpeed) + this.player.dirY * Math.cos(rotSpeed);
            const oldPlaneX = this.player.planeX;
            this.player.planeX =
                this.player.planeX * Math.cos(rotSpeed) - this.player.planeY * Math.sin(rotSpeed);
            this.player.planeY =
                oldPlaneX * Math.sin(rotSpeed) + this.player.planeY * Math.cos(rotSpeed);
        }
        if (this.input.left) {
            const oldDirX = this.player.dirX;
            this.player.dirX =
                this.player.dirX * Math.cos(-rotSpeed) - this.player.dirY * Math.sin(-rotSpeed);
            this.player.dirY =
                oldDirX * Math.sin(-rotSpeed) + this.player.dirY * Math.cos(-rotSpeed);
            const oldPlaneX = this.player.planeX;
            this.player.planeX =
                this.player.planeX * Math.cos(-rotSpeed) - this.player.planeY * Math.sin(-rotSpeed);
            this.player.planeY =
                oldPlaneX * Math.sin(-rotSpeed) + this.player.planeY * Math.cos(-rotSpeed);
        }

        // Movement
        const oldX = this.player.x;
        const oldY = this.player.y;

        if (this.input.forward) {
            const nextX = this.player.x + this.player.dirX * moveSpeed;
            const nextY = this.player.y + this.player.dirY * moveSpeed;
            if (this.map[Math.floor(this.player.y)][Math.floor(nextX)] === 0) {
                this.player.x = nextX;
            }
            if (this.map[Math.floor(nextY)][Math.floor(this.player.x)] === 0) {
                this.player.y = nextY;
            }
        }
        if (this.input.backward) {
            const nextX = this.player.x - this.player.dirX * moveSpeed;
            const nextY = this.player.y - this.player.dirY * moveSpeed;
            if (this.map[Math.floor(this.player.y)][Math.floor(nextX)] === 0) {
                this.player.x = nextX;
            }
            if (this.map[Math.floor(nextY)][Math.floor(this.player.x)] === 0) {
                this.player.y = nextY;
            }
        }

        // Footstep sounds when actually moving
        const moved = Math.hypot(this.player.x - oldX, this.player.y - oldY);
        if (moved > 0) {
            const distFromLast = Math.hypot(
                this.player.x - this.lastStepPos.x,
                this.player.y - this.lastStepPos.y
            );
            if (distFromLast > this.stepDistance && (this.input.forward || this.input.backward)) {
                this.lastStepPos.x = this.player.x;
                this.lastStepPos.y = this.player.y;
                this.playFootstep();
            }
        }

        // Check ball collision
        const distToBall = Math.hypot(this.ball.x - this.player.x, this.ball.y - this.player.y);
        if (distToBall < 0.5) {
            this.stop(true);
            return;
        }

        // Update enemies (simple chase)
        let closestEnemyDist = Infinity;
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist < closestEnemyDist) closestEnemyDist = dist;

            if (dist < 0.5) {
                this.playJumpscare();
                this.stop(false);
                return;
            }

            if (dist > 0.01) {
                const moveX = (dx / dist) * enemy.speed * dt;
                const moveY = (dy / dist) * enemy.speed * dt;

                if (this.map[Math.floor(enemy.y)][Math.floor(enemy.x + moveX)] === 0) {
                    enemy.x += moveX;
                }
                if (this.map[Math.floor(enemy.y + moveY)][Math.floor(enemy.x)] === 0) {
                    enemy.y += moveY;
                }
            }
        }
        
        // Play proximity-based sniffing
        const now = Date.now();
        if (closestEnemyDist < 10) {
            // Closer = more frequent sniffs
            const intervalModifier = Math.max(0.3, closestEnemyDist / 10);
            const adjustedInterval = this.sniffInterval * intervalModifier;
            
            if (now - this.lastSniffTime > adjustedInterval) {
                // Volume based on distance (closer = louder)
                const volume = Math.max(0.1, Math.min(1, 1 - (closestEnemyDist / 10)));
                this.playSniff(volume);
                this.lastSniffTime = now;
            }
        }

        this.updateUI();
    }

    draw() {
        // Clear background to pure black
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Pitch black ceiling and floor
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height / 2);
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, this.height / 2, this.width, this.height / 2);

        const zBuffer = new Array(this.width).fill(0);

        // Raycast walls
        for (let x = 0; x < this.width; x += 1) {
            const cameraX = x / this.width - 0.5;
            const rayDirX = this.player.dirX + this.player.planeX * cameraX * 2;
            const rayDirY = this.player.dirY + this.player.planeY * cameraX * 2;

            let mapX = Math.floor(this.player.x);
            let mapY = Math.floor(this.player.y);

            let sideDistX;
            let sideDistY;

            const deltaDistX = Math.abs(1 / rayDirX);
            const deltaDistY = Math.abs(1 / rayDirY);
            let perpWallDist;

            let stepX;
            let stepY;
            let hit = 0;
            let side = 0;

            if (rayDirX < 0) {
                stepX = -1;
                sideDistX = (this.player.x - mapX) * deltaDistX;
            } else {
                stepX = 1;
                sideDistX = (mapX + 1.0 - this.player.x) * deltaDistX;
            }
            if (rayDirY < 0) {
                stepY = -1;
                sideDistY = (this.player.y - mapY) * deltaDistY;
            } else {
                stepY = 1;
                sideDistY = (mapY + 1.0 - this.player.y) * deltaDistY;
            }

            while (hit === 0) {
                if (sideDistX < sideDistY) {
                    sideDistX += deltaDistX;
                    mapX += stepX;
                    side = 0;
                } else {
                    sideDistY += deltaDistY;
                    mapY += stepY;
                    side = 1;
                }
                if (this.map[mapY] && this.map[mapY][mapX] > 0) hit = 1;
            }

            if (side === 0) {
                perpWallDist = (mapX - this.player.x + (1 - stepX) / 2) / rayDirX;
            } else {
                perpWallDist = (mapY - this.player.y + (1 - stepY) / 2) / rayDirY;
            }

            zBuffer[x] = perpWallDist;

            const lineHeight = Math.floor(this.height / perpWallDist);
            let drawStart = -lineHeight / 2 + this.height / 2;
            if (drawStart < 0) drawStart = 0;
            let drawEnd = lineHeight / 2 + this.height / 2;
            if (drawEnd >= this.height) drawEnd = this.height - 1;

            // Draw wall with texture
            if (this.wallTextureLoaded) {
                // Calculate texture coordinates
                let wallX;
                if (side === 0) {
                    wallX = this.player.y + perpWallDist * rayDirY;
                } else {
                    wallX = this.player.x + perpWallDist * rayDirX;
                }
                wallX -= Math.floor(wallX);
                
                // Clamp to prevent wrapping
                wallX = Math.max(0, Math.min(0.999, wallX));

                let texX = Math.floor(wallX * this.wallTexture.width);
                // Clamp texture coordinate
                texX = Math.max(0, Math.min(this.wallTexture.width - 1, texX));
                
                // Draw textured stripe
                this.ctx.drawImage(
                    this.wallTexture,
                    texX, 0, 1, this.wallTexture.height,
                    x, drawStart, 1, drawEnd - drawStart
                );

                // Apply flashlight cone effect (very dark, only visible in center)
                const centerDist = Math.abs(x - this.width / 2) / (this.width / 2);
                const flashlightStrength = Math.max(0, 1 - centerDist * 1.5); // Narrow cone
                const distDarkness = Math.min(0.95, Math.max(0, (perpWallDist - 1) / 4));
                const finalDarkness = Math.max(0.7, distDarkness + (1 - flashlightStrength) * 0.9);
                
                this.ctx.fillStyle = `rgba(0,0,0,${finalDarkness})`;
                this.ctx.fillRect(x, drawStart, 1, drawEnd - drawStart);
            } else {
                // Fallback neon colors if texture not loaded
                let color;
                if (side === 1) color = '#aa00aa';
                else color = '#00aaaa';
                const alpha =
                    perpWallDist > 2 ? Math.max(0, 1 - (perpWallDist - 2) / 8) : 1;
                this.ctx.globalAlpha = alpha;
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x, drawStart, 1, drawEnd - drawStart);
                this.ctx.globalAlpha = 1;
            }
        }

        // Sprites (ball + enemies)
        const sprites = [];
        sprites.push({ x: this.ball.x, y: this.ball.y, type: 'ball' });
        this.enemies.forEach((e) =>
            sprites.push({ x: e.x, y: e.y, type: 'enemy' })
        );

        sprites.forEach((s) => {
            s.dist = (this.player.x - s.x) * (this.player.x - s.x) +
                (this.player.y - s.y) * (this.player.y - s.y);
        });
        sprites.sort((a, b) => b.dist - a.dist);

        for (let i = 0; i < sprites.length; i++) {
            const sprite = sprites[i];

            const spriteX = sprite.x - this.player.x;
            const spriteY = sprite.y - this.player.y;

            const invDet =
                1.0 /
                (this.player.planeX * this.player.dirY -
                    this.player.dirX * this.player.planeY);

            const transformX =
                invDet * (this.player.dirY * spriteX - this.player.dirX * spriteY);
            const transformY =
                invDet *
                (-this.player.planeY * spriteX + this.player.planeX * spriteY);

            if (transformY <= 0) continue;

            const spriteScreenX = Math.floor(
                (this.width / 2) * (1 + transformX / transformY)
            );

            const spriteHeight = Math.abs(Math.floor(this.height / transformY));
            const spriteWidth = Math.abs(Math.floor(this.height / transformY));

            if (spriteScreenX < 0 || spriteScreenX >= this.width) continue;

            // Proper occlusion test - only draw if sprite is closer than wall
            const zbufIdx = Math.floor(spriteScreenX);
            if (zbufIdx >= 0 && zbufIdx < this.width && zBuffer[zbufIdx] > 0) {
                if (transformY >= zBuffer[zbufIdx]) {
                    continue; // Behind wall, skip
                }
            }

            if (sprite.type === 'ball') {
                const size = spriteWidth * 0.8;
                const yPos = this.height / 2 + spriteHeight / 4;
                
                if (this.ballImageLoaded) {
                    // Draw ball texture with glow
                    this.ctx.shadowBlur = 20;
                    this.ctx.shadowColor = '#00f0ff';
                    this.ctx.drawImage(
                        this.ballImage,
                        spriteScreenX - size / 2,
                        yPos - size / 2,
                        size,
                        size
                    );
                    this.ctx.shadowBlur = 0;
                } else {
                    // Fallback glowing ball
                    this.ctx.beginPath();
                    this.ctx.arc(
                        spriteScreenX,
                        yPos,
                        size / 2,
                        0,
                        Math.PI * 2
                    );
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.shadowBlur = 20;
                    this.ctx.shadowColor = '#00f0ff';
                    this.ctx.fill();
                    this.ctx.shadowBlur = 0;

                    this.ctx.beginPath();
                    this.ctx.arc(
                        spriteScreenX,
                        yPos,
                        size / 3,
                        0,
                        Math.PI * 2
                    );
                    this.ctx.fillStyle = '#00f0ff';
                    this.ctx.fill();
                }
            } else if (sprite.type === 'enemy') {
                const size = spriteWidth * 1.2;
                const floatY = Math.sin(Date.now() / 200) * 10;
                const yPos = this.height / 2 + floatY;
                const drawW = size;
                const drawH = size;

                if (this.enemyImageLoaded) {
                    this.ctx.drawImage(
                        this.enemyImage,
                        spriteScreenX - drawW / 2,
                        yPos - drawH / 2,
                        drawW,
                        drawH
                    );
                } else {
                    // Fallback - draw red ghost if image not loaded
                    console.warn('Enemy image not loaded, using fallback');
                    this.ctx.beginPath();
                    this.ctx.arc(
                        spriteScreenX,
                        yPos,
                        size / 2,
                        0,
                        Math.PI * 2
                    );
                    this.ctx.fillStyle = '#ff0000';
                    this.ctx.shadowBlur = 15;
                    this.ctx.shadowColor = '#ff0000';
                    this.ctx.fill();
                    this.ctx.shadowBlur = 0;
                }
            }
        }
        
        // Draw flashlight sprite centered at bottom like a gun
        if (this.flashlightLoaded) {
            const flashlightH = this.height * 0.4; // 40% of screen height
            const flashlightW = flashlightH * (this.flashlightImage.width / this.flashlightImage.height);
            
            this.ctx.drawImage(
                this.flashlightImage,
                (this.width - flashlightW) / 2, // Center horizontally
                this.height - flashlightH + 20, // Bottom of screen
                flashlightW,
                flashlightH
            );
        }
    }

    updateUI() {
        // HP HUD is hidden in this mode; leave targets label alone
        if (this.targetsElement) {
            this.targetsElement.textContent = '';
        }
    }

    loop(timestamp) {
        if (!this.running) return;

        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (dt < 0.2) {
            this.update(dt);
            this.draw();
        }

        requestAnimationFrame((t) => this.loop(t));
    }
}

const doomGame = new DoomGame();
window.doomGame = doomGame;
