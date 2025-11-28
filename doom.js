class DoomGame {
    constructor() {
        this.canvas = document.getElementById('doom-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('doom-overlay');
        this.hpElement = document.getElementById('doom-hp');
        this.targetsElement = document.getElementById('doom-targets');
        this.messageElement = document.getElementById('doom-message');
        this.bulletsElement = document.getElementById('doom-bullets');

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

        // Powerups (e.g., speed / gun / clock) scattered through the level
        this.powerups = [];
        this.maxPowerups = 3; // Keep 3 powerups on the map at all times
        this.powerupSpawnTimer = 0;
        this.powerupSpawnInterval = 15; // Spawn a new powerup every 15 seconds

        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };

        this.enemies = [];
        this.maxEnemies = 1; // Single monster
        this.lastTime = 0;

        // Movement tuning (allows powerups to modify speeds)
        this.baseMoveSpeed = 4.0;
        this.speedMultiplier = 1;      // player speed multiplier
        this.powerupTimer = 0;         // player speed powerup duration

        this.enemySpeedMultiplier = 1; // enemy speed multiplier (used when stunned)
        this.enemyPowerupTimer = 0;    // enemy stun duration

        // Gun power state
        this.hasGun = false;
        this.shootCooldown = 0;
        this.shootCooldownTime = 0.6;
        this.gunAnimTimer = 0;
        this.gunAnimDuration = 0.25; // how long the shooting GIF is visible
        this.bullets = 0;
        
        // Projectile bullets (visual)
        this.projectiles = [];
        
        // Timer (60 seconds countdown)
        this.timeRemaining = 60;
        this.timerElement = document.getElementById('doom-timer');

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

        // Powerup texture (shoe power - speed boost)
        this.powerupImage = new Image();
        this.powerupImage.src = 'assets/shoe power.png';
        this.powerupImageLoaded = false;
        this.powerupImage.onload = () => {
            console.log('Powerup texture loaded:', this.powerupImage.width, 'x', this.powerupImage.height);
            this.powerupImageLoaded = true;
        };
        this.powerupImage.onerror = () => {
            console.error('Failed to load assets/shoe power.png');
        };

        // Powerup texture (gun power pickup)
        this.gunPowerImage = new Image();
        this.gunPowerImage.src = 'assets/gun power.png';
        this.gunPowerImageLoaded = false;
        this.gunPowerImage.onload = () => {
            console.log('Gun power texture loaded:', this.gunPowerImage.width, 'x', this.gunPowerImage.height);
            this.gunPowerImageLoaded = true;
        };
        this.gunPowerImage.onerror = () => {
            console.error('Failed to load assets/gun power.png');
        };

        // Powerup texture (clock power - time extension)
        this.clockPowerImage = new Image();
        this.clockPowerImage.src = 'assets/clock power new.jpg';
        this.clockPowerImageLoaded = false;
        this.clockPowerImage.onload = () => {
            console.log('Clock power texture loaded:', this.clockPowerImage.width, 'x', this.clockPowerImage.height);
            this.clockPowerImageLoaded = true;
        };
        this.clockPowerImage.onerror = () => {
            console.error('Failed to load assets/clock power new.jpg - check file location');
        };

        // First-person gun shooting GIF (root folder)
        this.gunShootImage = new Image();
        this.gunShootImage.src = 'first person gun.gif';
        this.gunShootImageLoaded = false;
        this.gunShootImage.onload = () => {
            console.log('Gun shoot GIF loaded:', this.gunShootImage.width, 'x', this.gunShootImage.height);
            this.gunShootImageLoaded = true;
        };
        this.gunShootImage.onerror = () => {
            console.error('Failed to load first person gun.gif');
        };

        // Gun cock sound effect
        this.gunCockSound = new Audio('gun-cock-stapeler-95646.mp3');
        this.gunCockSound.volume = 0.7;
        this.gunCockSound.onerror = () => {
            console.error('Failed to load gun-cock-stapeler-95646.mp3');
        };

        // Gun shot sound effect
        this.gunShotSound = new Audio('sound-effects-single-gun-shot-247124.mp3');
        this.gunShotSound.volume = 0.6;
        this.gunShotSound.onerror = () => {
            console.error('Failed to load sound-effects-single-gun-shot-247124.mp3');
        };

        this.bindInput();
        window.addEventListener('resize', () => this.resize());
    }

    updateBulletUI() {
        if (!this.bulletsElement) return;

        if (!this.hasGun) {
            this.bulletsElement.style.display = 'none';
            return;
        }

        this.bulletsElement.style.display = 'block';
        this.bulletsElement.textContent = `BULLETS: ${this.bullets}`;
    }

    updateTimer() {
        if (!this.timerElement) return;

        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = Math.floor(this.timeRemaining % 60);
        const milliseconds = Math.floor((this.timeRemaining % 1) * 100);
        
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
        this.timerElement.textContent = timeString;
        
        // Change color when time is running out
        if (this.timeRemaining <= 10) {
            this.timerElement.style.color = 'var(--neon-pink)';
            this.timerElement.style.textShadow = '0 0 10px var(--neon-pink)';
            this.timerElement.style.boxShadow = '0 0 15px rgba(255, 42, 109, 0.4)';
            this.timerElement.style.borderColor = 'var(--neon-pink)';
        } else if (this.timeRemaining <= 30) {
            this.timerElement.style.color = 'var(--neon-yellow)';
            this.timerElement.style.textShadow = '0 0 8px var(--neon-yellow)';
            this.timerElement.style.boxShadow = '0 0 15px rgba(249, 240, 2, 0.4)';
            this.timerElement.style.borderColor = 'var(--neon-yellow)';
        } else {
            this.timerElement.style.color = 'var(--neon-green)';
            this.timerElement.style.textShadow = '0 0 10px var(--neon-green)';
            this.timerElement.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.4)';
            this.timerElement.style.borderColor = 'var(--neon-green)';
        }
    }

    applyPowerup(powerup) {
        if (powerup.type === 'speed') {
            // Speed boost powerup
            this.speedMultiplier = 1.7;
            this.powerupTimer = 6; // seconds

            if (this.targetsElement) {
                this.targetsElement.textContent = 'POWERUP ACQUIRED: SPEED BOOST';
            }
        } else if (powerup.type === 'gun') {
            // Gun power: grant the ability to shoot and stun the monster
            this.hasGun = true;
            this.bullets = 12;
            this.updateBulletUI();
            
            // Play gun cock sound
            try {
                this.gunCockSound.currentTime = 0; // Reset to start in case it was played before
                this.gunCockSound.play().catch(err => {
                    console.warn('Gun cock sound failed to play:', err);
                });
            } catch (err) {
                console.warn('Gun cock sound error:', err);
            }
            
            if (this.targetsElement) {
                this.targetsElement.textContent = 'POWERUP ACQUIRED: GUN ONLINE (SPACE TO SHOOT)';
            }
        } else if (powerup.type === 'clock') {
            // Clock power: add 30 seconds to the timer
            this.timeRemaining += 30;
            // Cap at maximum of 2 minutes
            if (this.timeRemaining > 120) {
                this.timeRemaining = 120;
            }
            
            if (this.targetsElement) {
                this.targetsElement.textContent = 'POWERUP ACQUIRED: +30 SECONDS';
            }
        }
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
                case ' ':
                    // Space to shoot when gun is active
                    this.tryShoot();
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

    tryShoot() {
        if (!this.running || !this.hasGun) return;
        if (this.bullets <= 0) return;
        if (this.shootCooldown > 0) return;

        this.shootCooldown = this.shootCooldownTime;
        this.gunAnimTimer = this.gunAnimDuration;
        this.bullets = Math.max(0, this.bullets - 1);
        this.updateBulletUI();

        // Play gun shot sound
        try {
            this.gunShotSound.currentTime = 0; // Reset to start for rapid firing
            this.gunShotSound.play().catch(err => {
                console.warn('Gun shot sound failed to play:', err);
            });
        } catch (err) {
            console.warn('Gun shot sound error:', err);
        }

        // Spawn visual bullet projectile
        this.projectiles.push({
            x: this.player.x,
            y: this.player.y,
            dirX: this.player.dirX,
            dirY: this.player.dirY,
            speed: 15, // Fast bullet speed
            lifetime: 2.0 // Max lifetime in seconds
        });

        // Simple hitscan: stun the closest enemy roughly in front of the player
        let bestEnemy = null;
        let bestDist = Infinity;

        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 8) continue; // max range

            const dirLen = Math.hypot(this.player.dirX, this.player.dirY) || 1;
            const ndx = dx / dist;
            const ndy = dy / dist;
            const ndirX = this.player.dirX / dirLen;
            const ndirY = this.player.dirY / dirLen;
            const dot = ndx * ndirX + ndy * ndirY;

            if (dot < Math.cos(Math.PI / 6)) continue; // ~30 degree cone

            if (dist < bestDist) {
                bestDist = dist;
                bestEnemy = enemy;
            }
        }

        if (bestEnemy) {
            // Stun enemy via speed multiplier / timer
            this.enemySpeedMultiplier = 0;
            this.enemyPowerupTimer = 3; // seconds

            if (this.targetsElement) {
                this.targetsElement.textContent = 'MONSTER STUNNED';
            }
        }
    }

    resize() {
        if (!this.canvas) return;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    drawFloor() {
        // Optimized floor rendering - much lower resolution for performance
        const halfHeight = this.height / 2;
        
        // Use a much larger step for better performance (render at lower resolution)
        const step = 8; // Increased from 2 to 8 for 16x fewer pixels
        
        // Only sample every Nth row for even better performance
        const rowStep = 4;
        
        for (let y = 0; y < halfHeight; y += rowStep) {
            // Calculate the distance to this row on the floor
            const screenY = y + halfHeight;
            if (screenY <= this.height / 2) continue;
            
            const rowDistance = (this.height / 2) / (screenY - this.height / 2);
            
            // Skip very far distances (they're mostly dark anyway)
            if (rowDistance > 10) continue;
            
            // Calculate the real world step vector for each x step
            const floorStepX = rowDistance * (this.player.planeX * 2) / this.width;
            const floorStepY = rowDistance * (this.player.planeY * 2) / this.width;
            
            // Calculate the real world coordinates of the leftmost column
            let floorX = this.player.x + rowDistance * this.player.dirX - 
                         rowDistance * this.player.planeX;
            let floorY = this.player.y + rowDistance * this.player.dirY - 
                         rowDistance * this.player.planeY;
            
            for (let x = 0; x < this.width; x += step) {
                // Get the texture coordinate
                const cellX = Math.floor(floorX);
                const cellY = Math.floor(floorY);
                
                // Check if this cell is valid
                if (cellY >= 0 && cellY < this.mapHeight && 
                    cellX >= 0 && cellX < this.mapWidth) {
                    
                    // Get the texture coordinate within the cell (0 to 1)
                    const tx = ((floorX - cellX) * this.wallTexture.width) % this.wallTexture.width;
                    const ty = ((floorY - cellY) * this.wallTexture.height) % this.wallTexture.height;
                    
                    // Clamp texture coordinates
                    const texX = Math.max(0, Math.min(this.wallTexture.width - 1, Math.floor(Math.abs(tx))));
                    const texY = Math.max(0, Math.min(this.wallTexture.height - 1, Math.floor(Math.abs(ty))));
                    
                    // Distance-based darkness
                    const darkness = Math.min(0.85, 0.4 + (rowDistance / 10) * 0.5);
                    
                    // Draw the texture sample
                    this.ctx.globalAlpha = 1 - darkness;
                    this.ctx.drawImage(
                        this.wallTexture,
                        texX, texY, 1, 1,
                        x, screenY, step, rowStep
                    );
                    this.ctx.globalAlpha = 1;
                }
                
                floorX += floorStepX * step;
                floorY += floorStepY * step;
            }
        }
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
        this.powerups = [];
        this.speedMultiplier = 1;
        this.powerupTimer = 0;
        this.enemySpeedMultiplier = 1;
        this.enemyPowerupTimer = 0;
        this.hasGun = false;
        this.shootCooldown = 0;
        this.gunAnimTimer = 0;
        this.bullets = 0;
        this.projectiles = [];
        this.timeRemaining = 60;
        this.powerupSpawnTimer = 0;
        this.lastStepPos.x = this.player.x;
        this.lastStepPos.y = this.player.y;

        this.spawnEntities();

        if (this.overlay) this.overlay.style.display = 'block';
        if (this.messageElement) this.messageElement.style.display = 'none';

        const doomScore = document.querySelector('.doom-score');
        if (doomScore) {
            doomScore.innerHTML = 'CURRENT OBJECTIVE: <span style="color:var(--neon-pink)">SURVIVE</span><br><span style="font-size:0.7em;opacity:0.8">SIDE OBJECTIVE: <span style="color:var(--neon-yellow)">FIND THE BALL</span></span>';
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

    spawnPowerup() {
        // Count uncollected powerups
        const uncollectedCount = this.powerups.filter(p => !p.collected).length;
        
        // Only spawn if we have less than maxPowerups uncollected
        if (uncollectedCount >= this.maxPowerups) {
            return;
        }

        let px;
        let py;
        let attempts = 0;
        do {
            px = Math.floor(Math.random() * this.mapWidth);
            py = Math.floor(Math.random() * this.mapHeight);
            attempts++;
        } while (
            attempts < 100 &&
            (this.map[py][px] !== 0 ||
                Math.hypot(px + 0.5 - this.player.x, py + 0.5 - this.player.y) < 3 ||
                (px + 0.5 === this.ball.x && py + 0.5 === this.ball.y))
        );

        if (this.map[py][px] === 0) {
            // Random powerup type
            const rand = Math.random();
            let pType;
            if (rand < 0.33) pType = 'speed';
            else if (rand < 0.66) pType = 'gun';
            else pType = 'clock';

            this.powerups.push({
                x: px + 0.5,
                y: py + 0.5,
                collected: false,
                type: pType
            });
        }
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

        // Spawn initial powerups at random open tiles
        for (let i = 0; i < this.maxPowerups; i++) {
            this.spawnPowerup();
        }

        // Safety: ensure at least one gun powerup exists
        const hasGun = this.powerups.some(p => p.type === 'gun');
        if (!hasGun) {
            let gx;
            let gy;
            let attempts = 0;
            do {
                gx = Math.floor(Math.random() * this.mapWidth);
                gy = Math.floor(Math.random() * this.mapHeight);
                attempts++;
            } while (
                attempts < 50 &&
                (this.map[gy][gx] !== 0 ||
                    Math.hypot(gx + 0.5 - this.player.x, gy + 0.5 - this.player.y) < 6)
            );

            if (this.map[gy][gx] === 0) {
                this.powerups.push({
                    x: gx + 0.5,
                    y: gy + 0.5,
                    collected: false,
                    type: 'gun'
                });
            }
        }

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

        // Update countdown timer
        this.timeRemaining -= dt;
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.stop(false); // Time's up - player loses
            return;
        }
        this.updateTimer();

        // Powerup spawn timer
        this.powerupSpawnTimer += dt;
        if (this.powerupSpawnTimer >= this.powerupSpawnInterval) {
            this.powerupSpawnTimer = 0;
            this.spawnPowerup();
        }

        // Handle active powerup timers (e.g., speed boost)
        if (this.powerupTimer > 0) {
            this.powerupTimer -= dt;
            if (this.powerupTimer <= 0) {
                this.powerupTimer = 0;
                this.speedMultiplier = 1;
            }
        }
        if (this.enemyPowerupTimer > 0) {
            this.enemyPowerupTimer -= dt;
            if (this.enemyPowerupTimer <= 0) {
                this.enemyPowerupTimer = 0;
                this.enemySpeedMultiplier = 1;
            }
        }

        // Shooting cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown -= dt;
            if (this.shootCooldown < 0) this.shootCooldown = 0;
        }

        // Gun shooting animation timer
        if (this.gunAnimTimer > 0) {
            this.gunAnimTimer -= dt;
            if (this.gunAnimTimer < 0) this.gunAnimTimer = 0;
        }

        // Update projectile bullets
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.lifetime -= dt;
            
            // Remove if lifetime expired
            if (proj.lifetime <= 0) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Move bullet forward
            const moveAmount = proj.speed * dt;
            const nextX = proj.x + proj.dirX * moveAmount;
            const nextY = proj.y + proj.dirY * moveAmount;
            
            // Check if bullet hit a wall
            if (this.map[Math.floor(nextY)] && this.map[Math.floor(nextY)][Math.floor(nextX)] !== 0) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            proj.x = nextX;
            proj.y = nextY;
        }

        const moveSpeed = this.baseMoveSpeed * this.speedMultiplier * dt;
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

        // Check powerup collisions
        for (let i = 0; i < this.powerups.length; i++) {
            const p = this.powerups[i];
            if (p.collected) continue;
            const dist = Math.hypot(p.x - this.player.x, p.y - this.player.y);
            if (dist < 0.5) {
                this.applyPowerup(p);
                p.collected = true;
            }
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
                const moveX = (dx / dist) * enemy.speed * this.enemySpeedMultiplier * dt;
                const moveY = (dy / dist) * enemy.speed * this.enemySpeedMultiplier * dt;

                // Improved collision detection - check the next position more carefully
                const nextX = enemy.x + moveX;
                const nextY = enemy.y + moveY;
                
                // Add a small margin (0.3) to prevent clipping into walls
                const margin = 0.3;
                
                // Check X movement - test all corners with margin
                let canMoveX = true;
                if (moveX !== 0) {
                    const testX = nextX + (moveX > 0 ? margin : -margin);
                    // Check top and bottom edges
                    if (this.map[Math.floor(enemy.y - margin)] && 
                        this.map[Math.floor(enemy.y - margin)][Math.floor(testX)] !== 0) {
                        canMoveX = false;
                    }
                    if (this.map[Math.floor(enemy.y + margin)] && 
                        this.map[Math.floor(enemy.y + margin)][Math.floor(testX)] !== 0) {
                        canMoveX = false;
                    }
                    if (this.map[Math.floor(enemy.y)] && 
                        this.map[Math.floor(enemy.y)][Math.floor(testX)] !== 0) {
                        canMoveX = false;
                    }
                }
                
                // Check Y movement - test all corners with margin
                let canMoveY = true;
                if (moveY !== 0) {
                    const testY = nextY + (moveY > 0 ? margin : -margin);
                    // Check left and right edges
                    if (this.map[Math.floor(testY)] && 
                        this.map[Math.floor(testY)][Math.floor(enemy.x - margin)] !== 0) {
                        canMoveY = false;
                    }
                    if (this.map[Math.floor(testY)] && 
                        this.map[Math.floor(testY)][Math.floor(enemy.x + margin)] !== 0) {
                        canMoveY = false;
                    }
                    if (this.map[Math.floor(testY)] && 
                        this.map[Math.floor(testY)][Math.floor(enemy.x)] !== 0) {
                        canMoveY = false;
                    }
                }
                
                // Apply movement only if collision check passes
                if (canMoveX) {
                    enemy.x = nextX;
                }
                if (canMoveY) {
                    enemy.y = nextY;
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

        // Pitch black ceiling
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height / 2);
        
        // Draw textured floor (same texture as walls)
        if (this.wallTextureLoaded) {
            this.drawFloor();
        } else {
            // Fallback solid floor if texture not loaded
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, this.height / 2, this.width, this.height / 2);
        }

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

        // Sprites (ball + enemies + powerups + projectiles)
        const sprites = [];
        sprites.push({ x: this.ball.x, y: this.ball.y, type: 'ball' });
        this.powerups.forEach((p) => {
            if (!p.collected) {
                sprites.push({ x: p.x, y: p.y, type: 'powerup', powerupType: p.type });
            }
        });
        this.enemies.forEach((e) =>
            sprites.push({ x: e.x, y: e.y, type: 'enemy' })
        );
        this.projectiles.forEach((proj) =>
            sprites.push({ x: proj.x, y: proj.y, type: 'projectile' })
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
            } else if (sprite.type === 'powerup') {
                const size = spriteWidth * 0.9; // Slightly larger so they stand out
                const yPos = this.height / 2 + spriteHeight / 3;

                // Determine which powerup image to use
                let img, imgLoaded;
                if (sprite.powerupType === 'speed') {
                    img = this.powerupImage;
                    imgLoaded = this.powerupImageLoaded;
                } else if (sprite.powerupType === 'gun') {
                    img = this.gunPowerImage;
                    imgLoaded = this.gunPowerImageLoaded;
                } else if (sprite.powerupType === 'clock') {
                    img = this.clockPowerImage;
                    imgLoaded = this.clockPowerImageLoaded;
                }

                if (imgLoaded) {
                    // Draw the appropriate powerup sprite
                    this.ctx.shadowBlur = 20;
                    this.ctx.shadowColor = '#00f0ff';
                    this.ctx.drawImage(
                        img,
                        spriteScreenX - size / 2,
                        yPos - size / 2,
                        size,
                        size
                    );
                    this.ctx.shadowBlur = 0;
                } else {
                    // Fallback glowing orb if texture not loaded
                    const radiusOuter = size / 2;
                    const radiusInner = size / 3;

                    // Outer glow
                    this.ctx.beginPath();
                    this.ctx.arc(spriteScreenX, yPos, radiusOuter, 0, Math.PI * 2);
                    this.ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
                    this.ctx.shadowBlur = 25;
                    this.ctx.shadowColor = '#00f0ff';
                    this.ctx.fill();

                    // Inner core
                    this.ctx.beginPath();
                    this.ctx.arc(spriteScreenX, yPos, radiusInner, 0, Math.PI * 2);
                    this.ctx.fillStyle = '#00f0ff';
                    this.ctx.fill();
                    this.ctx.shadowBlur = 0;
                }
            } else if (sprite.type === 'projectile') {
                // Draw bullet as small white square
                const size = spriteWidth * 0.15; // Small bullet
                const yPos = this.height / 2;

                this.ctx.fillStyle = '#ffffff';
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#ffff00';
                this.ctx.fillRect(
                    spriteScreenX - size / 2,
                    yPos - size / 2,
                    size,
                    size
                );
                this.ctx.shadowBlur = 0;
            }
        }
        
        // Weapon / flashlight at bottom of screen
        if (this.hasGun && this.gunShootImageLoaded) {
            // Always show the animated gun GIF in bottom-center when gun is acquired
            const gunH = this.height * 0.45;
            const gunW = gunH * (this.gunShootImage.width / this.gunShootImage.height);

            // Position in bottom-center (middle of screen)
            const gunX = (this.width - gunW) / 2;
            const gunY = this.height - gunH + 20;

            // Draw the gun GIF (always animating)
            this.ctx.drawImage(this.gunShootImage, gunX, gunY, gunW, gunH);
        } else if (this.flashlightLoaded) {
            // Default flashlight when gun is not acquired
            const flashlightH = this.height * 0.4; // 40% of screen height
            const flashlightW =
                flashlightH * (this.flashlightImage.width / this.flashlightImage.height);

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
        // HP HUD is hidden in this mode; repurpose targets label for hints
        if (this.targetsElement) {
            let text = '';
            if (this.powerupTimer > 0) {
                text = 'POWERUP: SPEED BOOST ACTIVE';
            }
            if (this.enemyPowerupTimer > 0) {
                text = text ? text + ' | MONSTER STUNNED' : 'MONSTER STUNNED';
            }
            if (this.hasGun) {
                const gunText =
                    this.shootCooldown <= 0 ? 'GUN READY (SPACE)' : 'GUN RELOADING';
                text = text ? text + ' | ' + gunText : gunText;
            }
            this.targetsElement.textContent = text;
        }

        this.updateBulletUI();
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
