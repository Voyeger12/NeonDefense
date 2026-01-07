/**
 * CRIMSON DEFENSE: SYNTHWAVE EDITION
 * Mobile Optimized Logic
 */

(function() {
    'use strict';

    // Mobile Detection
    const IS_MOBILE = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    const CONFIG = {
        // Auf Mobile spawnen Gegner langsamer (Balancing)
        SPAWN_RATE_START: IS_MOBILE ? 2500 : 2000, 
        SPEED_START: IS_MOBILE ? 40 : 60,
        TIMER_START: 30,
        WORDS: [
            "SYSTEM", "ERROR", "GLITCH", "VIRUS", "DAEMON", "KERNEL", "PROXY", "AGENT", "CIPHER",
            "ACCESS", "DENIED", "REBOOT", "SIGNAL", "TARGET", "LOCKED", "VECTOR", "PLASMA", "SHIELD",
            "ENERGY", "FUSION", "GALAXY", "ORBIT", "ROCKET", "METEOR", "PLANET", "COSMOS", "NEBULA",
            "ATTACK", "DEFEND", "STRIKE", "IMPACT", "BATTLE", "COMBAT", "DANGER", "ESCAPE", "RESCUE",
            "QUANTUM", "DYNAMIC", "KINETIC", "ORGANIC", "VIRTUAL", "DIGITAL", "NETWORK", "CIRCUIT",
            "PROTOCOL", "OVERRIDE", "FIREWALL", "PASSWORD", "DOWNLOAD", "HARDWARE", "SOFTWARE", "FATAL"
        ]
    };

    /**
     * MUSIC ENGINE
     */
    class MusicEngine {
        constructor(ctx) {
            this.ctx = ctx;
            this.isPlaying = false;
            this.tempo = 130; 
            this.nextNoteTime = 0.0;
            this.timerID = null;
            this.beatCount = 0;
            this.lookahead = 25.0; 
            this.scheduleAheadTime = 0.1; 
            
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = window.GameSettings ? window.GameSettings.get().musicVol : 0.4;
            this.musicGain.connect(this.ctx.destination);

            if(window.GameSettings) {
                window.GameSettings.onChange((type, config) => {
                    if(type === 'music') {
                        this.musicGain.gain.setTargetAtTime(config.musicVol, this.ctx.currentTime, 0.1);
                    }
                });
            }
        }

        start() {
            if(this.isPlaying) return;
            this.isPlaying = true;
            this.nextNoteTime = this.ctx.currentTime + 0.1;
            this.beatCount = 0;
            this.scheduler();
        }

        stop() {
            this.isPlaying = false;
            if(this.timerID) clearTimeout(this.timerID);
        }

        scheduler() {
            if(!this.isPlaying) return;
            while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
                this.scheduleNote(this.beatCount, this.nextNoteTime);
                this.nextNote();
            }
            this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
        }

        nextNote() {
            const secondsPerBeat = 60.0 / this.tempo;
            this.nextNoteTime += 0.25 * secondsPerBeat; 
            this.beatCount = (this.beatCount + 1) % 16; 
        }

        scheduleNote(beatNumber, time) {
            if (beatNumber % 4 === 0) this.playKick(time);
            if (beatNumber === 4 || beatNumber === 12) this.playSnare(time);
            if(beatNumber % 2 === 0 || Math.random() > 0.3) this.playBass(time, 73.42); 
        }

        playKick(time) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
            gain.gain.setValueAtTime(0.8, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
            osc.connect(gain);
            gain.connect(this.musicGain);
            osc.start(time);
            osc.stop(time + 0.5);
        }

        playSnare(time) {
            const bufferSize = this.ctx.sampleRate * 0.5; 
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 1000;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.4, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);
            noise.start(time);
        }

        playBass(time, freq) {
            const osc = this.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, time);
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, time);
            filter.frequency.exponentialRampToValueAtTime(100, time + 0.2);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.3, time);
            gain.gain.linearRampToValueAtTime(0, time + 0.2);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);
            osc.start(time);
            osc.stop(time + 0.2);
        }
    }

    /**
     * SFX ENGINE
     */
    class SfxEngine {
        constructor(ctx) {
            this.ctx = ctx;
            this.masterGain = this.ctx.createGain();
            this.currentVol = window.GameSettings ? window.GameSettings.get().sfxVol : 0.5;
            this.masterGain.gain.value = this.currentVol; 
            this.masterGain.connect(this.ctx.destination);

            if(window.GameSettings) {
                window.GameSettings.onChange((type, config) => {
                    if(type === 'sfx') {
                        this.currentVol = config.sfxVol;
                        this.masterGain.gain.value = this.currentVol;
                    }
                });
            }
        }

        playTone(freq, type, duration, vol = 0.3) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        }

        playType() { this.playTone(800 + Math.random() * 200, 'sine', 0.05, 0.2); }
        playError() { 
            this.playTone(150, 'sawtooth', 0.3, 0.3);
            this.playTone(100, 'sawtooth', 0.3, 0.3);
        }
        playShoot() {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(600, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.3);
        }
        playExplosion() {
            this.playTone(100, 'square', 0.3, 0.5);
        }
    }

    /**
     * MAIN GAME LOGIC
     */
    class Game {
        constructor() {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch(e) {
                console.warn("Web Audio API not supported");
            }
            
            if(this.ctx) {
                this.music = new MusicEngine(this.ctx);
                this.sfx = new SfxEngine(this.ctx);
            }

            this.active = false;
            this.paused = false;
            
            this.score = 0;
            this.timer = CONFIG.TIMER_START;
            this.combo = 1;
            this.maxCombo = 1;
            this.shotsFired = 0;
            this.shotsHit = 0;
            
            this.enemies = [];
            this.inputBuffer = "";
            this.lastFrameTime = 0;
            this.spawnTimer = 0;
            this.currentSpawnRate = CONFIG.SPAWN_RATE_START;
            this.currentSpeed = CONFIG.SPEED_START;
            
            this.dom = {
                input: document.getElementById('hidden-input'),
                display: document.getElementById('input-display'),
                stage: document.getElementById('game-stage'),
                score: document.getElementById('score-val'),
                acc: document.getElementById('acc-val'),
                time: document.getElementById('time-val'),
                combo: document.getElementById('combo-val'),
                comboBox: document.getElementById('combo-box'),
                status: document.getElementById('status-msg'),
                player: document.getElementById('player-base'),
                overlay: document.getElementById('overlay'),
                pauseOverlay: document.getElementById('pause-overlay'),
                finalStats: document.getElementById('final-stats'),
                finalScore: document.getElementById('final-score'),
                finalAcc: document.getElementById('final-acc'),
                finalCombo: document.getElementById('final-combo'),
                startBtn: document.getElementById('start-btn'),
                pauseBtn: document.getElementById('pause-btn'),
                resumeBtn: document.getElementById('resume-btn'),
                settingsModal: document.getElementById('settings-modal') 
            };

            this.init();
        }

        init() {
            this.dom.startBtn.addEventListener('click', () => this.initSequence());
            this.dom.pauseBtn.addEventListener('click', () => this.togglePause());
            this.dom.resumeBtn.addEventListener('click', () => this.togglePause());
            
            this.dom.input.addEventListener('input', (e) => this.handleInput(e));
            this.dom.input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.shoot();
            });

            document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.togglePause(); });
            
            document.addEventListener('click', (e) => {
                const isSettingsOpen = !this.dom.settingsModal.classList.contains('hidden');
                const isStoryActive = window.StoryModule && window.StoryModule.active;
                
                // Auf Mobile ist der Klick extrem wichtig, um die Tastatur zu holen
                if (this.active && !this.paused && !isSettingsOpen && !isStoryActive && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
                    this.dom.input.focus();
                }
            });

            // Auf Mobile: Prevent Scrolling beim Spiel
            if(IS_MOBILE) {
                document.body.addEventListener('touchmove', function(e) { 
                    e.preventDefault(); 
                }, { passive: false });
            }
        }

        initSequence() {
            if(this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().then(() => {
                    if(this.music) this.music.start();
                });
            } else if (this.ctx) {
                if(this.music) this.music.start();
            }

            if(window.StoryModule) {
                window.StoryModule.play(() => {
                    this.startMatch();
                });
            } else {
                this.startMatch();
            }
        }

        startMatch() {
            this.active = true;
            this.paused = false;
            
            this.score = 0;
            this.timer = CONFIG.TIMER_START;
            this.combo = 1;
            this.maxCombo = 1;
            this.shotsFired = 0;
            this.shotsHit = 0;
            
            this.enemies = [];
            this.inputBuffer = "";
            this.currentSpawnRate = CONFIG.SPAWN_RATE_START;
            this.currentSpeed = CONFIG.SPEED_START;
            
            this.updateUI();
            this.dom.overlay.classList.add('hidden');
            this.dom.pauseOverlay.classList.add('hidden');
            this.dom.finalStats.classList.add('hidden');
            this.dom.display.innerText = "";
            this.dom.input.value = "";
            this.dom.input.focus();
            this.setStatus("SYSTEM ONLINE", "var(--text)");
            
            document.querySelectorAll('.enemy, .particle, .laser').forEach(e => e.remove());
            
            this.lastFrameTime = performance.now();
            requestAnimationFrame((ts) => this.loop(ts));
        }

        togglePause() {
            const isSettingsOpen = !this.dom.settingsModal.classList.contains('hidden');
            const isStoryActive = window.StoryModule && window.StoryModule.active;
            
            if(isSettingsOpen || isStoryActive) return;

            if (!this.active) return;
            this.paused = !this.paused;
            if (this.paused) {
                this.dom.pauseOverlay.classList.remove('hidden');
                if(this.music) this.music.stop(); 
                this.dom.input.blur();
            } else {
                this.dom.pauseOverlay.classList.add('hidden');
                if(this.music) this.music.start(); 
                this.dom.input.focus();
                this.lastFrameTime = performance.now();
                requestAnimationFrame((ts) => this.loop(ts));
            }
        }

        loop(timestamp) {
            if (!this.active || this.paused) return;
            const dt = (timestamp - this.lastFrameTime) / 1000;
            this.lastFrameTime = timestamp;
            this.update(dt);
            requestAnimationFrame((ts) => this.loop(ts));
        }

        update(dt) {
            this.timer -= dt;
            this.dom.time.innerText = this.timer.toFixed(1) + 's';
            if (this.timer <= 5) this.dom.time.style.color = 'red';
            else this.dom.time.style.color = 'white';

            if (this.timer <= 0) {
                this.gameOver("ZEIT ABGELAUFEN");
                return;
            }

            this.spawnTimer += dt * 1000;
            if (this.spawnTimer > this.currentSpawnRate) {
                this.spawnEnemy();
                this.spawnTimer = 0;
                this.currentSpawnRate = Math.max(500, this.currentSpawnRate - 20);
                this.currentSpeed += 0.8;
            }

            const killLine = this.dom.stage.offsetHeight - 80;
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                enemy.y += this.currentSpeed * dt;
                enemy.el.style.top = `${enemy.y}px`;

                if (this.inputBuffer.length > 0 && enemy.word.toLowerCase().startsWith(this.inputBuffer.toLowerCase())) {
                    enemy.el.classList.add('locked');
                } else {
                    enemy.el.classList.remove('locked');
                }

                if (enemy.y > killLine) {
                    this.gameOver("SYSTEM GEHACKT");
                    return;
                }
            }
        }

        spawnEnemy() {
            const word = CONFIG.WORDS[Math.floor(Math.random() * CONFIG.WORDS.length)];
            const el = document.createElement('div');
            el.className = 'enemy';
            el.innerText = word;
            const x = 10 + Math.random() * 80;
            el.style.left = `${x}%`;
            el.style.top = '-50px';
            this.dom.stage.appendChild(el);
            this.enemies.push({ word: word, el: el, y: -50 });
        }

        handleInput(e) {
            this.inputBuffer = this.dom.input.value.trim();
            this.dom.display.innerText = this.inputBuffer.toUpperCase();
            if(e.inputType !== "deleteContentBackward" && this.sfx) {
                this.sfx.playType();
            }
        }

        shoot() {
            if (this.paused) return;
            const target = this.inputBuffer.toLowerCase();
            if (target.length === 0) return;

            this.shotsFired++;

            let matchIndex = -1;
            let maxY = -1000;
            
            this.enemies.forEach((e, i) => {
                if(e.word.toLowerCase() === target && e.y > maxY) {
                    maxY = e.y;
                    matchIndex = i;
                }
            });

            if (matchIndex !== -1) {
                const enemy = this.enemies[matchIndex];
                this.shotsHit++;
                
                this.createLaser(enemy);
                this.createExplosion(enemy);
                this.triggerScreenShake();
                if(this.sfx) {
                    this.sfx.playShoot();
                    this.sfx.playExplosion();
                }

                enemy.el.remove();
                this.enemies.splice(matchIndex, 1);

                this.combo++;
                if(this.combo > this.maxCombo) this.maxCombo = this.combo;
                
                const points = enemy.word.length * 100 * this.combo;
                this.score += points;
                this.timer += Math.min(5, enemy.word.length * 0.4);

                this.setStatus(`HIT +${points} (x${this.combo})`, "var(--secondary)");
                this.inputBuffer = "";
                this.dom.input.value = "";
                this.dom.display.innerText = "";

            } else {
                this.timer -= 3;
                this.combo = 1;
                if(this.sfx) this.sfx.playError();
                this.dom.display.style.color = "red";
                this.setStatus("MISS! COMBO RESET", "red");
                setTimeout(() => this.dom.display.style.color = "var(--secondary)", 200);
                this.dom.display.classList.add('shake-screen');
                setTimeout(() => this.dom.display.classList.remove('shake-screen'), 300);
            }
            
            this.updateUI();
        }

        triggerScreenShake() {
            if(window.GameSettings && !window.GameSettings.get().shakeEnabled) return;

            this.dom.stage.classList.remove('shake-screen');
            void this.dom.stage.offsetWidth; 
            this.dom.stage.classList.add('shake-screen');
        }

        updateUI() {
            this.dom.score.innerText = this.score;
            this.dom.combo.innerText = "x" + this.combo;
            
            let acc = 100;
            if(this.shotsFired > 0) {
                acc = Math.round((this.shotsHit / this.shotsFired) * 100);
            }
            this.dom.acc.innerText = acc + "%";
            
            if(this.combo > 5) this.dom.comboBox.classList.add('combo-active');
            else this.dom.comboBox.classList.remove('combo-active');
        }

        setStatus(msg, color) {
            this.dom.status.innerText = msg;
            this.dom.status.style.color = color;
        }

        createLaser(enemy) {
            const laser = document.createElement('div');
            laser.className = 'laser';
            const startRect = this.dom.player.getBoundingClientRect();
            const endRect = enemy.el.getBoundingClientRect();
            const startX = startRect.left + startRect.width / 2;
            const startY = startRect.top;
            const endX = endRect.left + endRect.width / 2;
            const endY = endRect.top + endRect.height / 2;
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const dist = Math.sqrt(deltaX**2 + deltaY**2);
            const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
            laser.style.width = `${dist}px`;
            laser.style.left = `${startX}px`;
            laser.style.top = `${startY}px`;
            laser.style.transform = `rotate(${angle}deg)`;
            this.dom.stage.appendChild(laser);
            setTimeout(() => laser.remove(), 100);
        }

        createExplosion(enemy) {
            const rect = enemy.el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            for (let i = 0; i < 15; i++) {
                const p = document.createElement('div');
                p.className = 'particle';
                p.style.left = `${centerX}px`;
                p.style.top = `${centerY}px`;
                p.style.backgroundColor = Math.random() > 0.5 ? 'var(--primary)' : 'var(--secondary)';
                this.dom.stage.appendChild(p);
                const angle = Math.random() * Math.PI * 2;
                const velocity = 50 + Math.random() * 150;
                const tx = Math.cos(angle) * velocity;
                const ty = Math.sin(angle) * velocity;
                p.animate([
                    { transform: 'translate(0,0) scale(1)', opacity: 1 },
                    { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
                ], { duration: 600, easing: 'ease-out' }).onfinish = () => p.remove();
            }
        }

        gameOver(reason) {
            this.active = false;
            if(this.music) this.music.stop(); 
            if(this.sfx) this.sfx.playError();
            this.dom.overlay.classList.remove('hidden');
            this.dom.finalStats.classList.remove('hidden');
            this.dom.finalScore.innerText = this.score;
            this.dom.finalAcc.innerText = this.dom.acc.innerText;
            this.dom.finalCombo.innerText = "x" + this.maxCombo;
            this.setStatus(reason, "red");
        }
    }

    window.addEventListener('load', () => new Game());

})();