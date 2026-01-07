/**
 * CRIMSON DEFENSE
 * Settings Module
 * Handles UI, LocalStorage persistence, and global config state.
 */

(function() {
    'use strict';

    // Standardwerte
    const DEFAULTS = {
        musicVol: 0.4,
        sfxVol: 0.5,
        crtEnabled: true,
        shakeEnabled: true
    };

    class SettingsManager {
        constructor() {
            this.config = { ...DEFAULTS };
            this.callbacks = []; // Observer pattern für Live-Updates
            
            // DOM Elements
            this.dom = {
                modal: document.getElementById('settings-modal'),
                btnOpenStart: document.getElementById('btn-settings-start'),
                btnOpenPause: document.getElementById('btn-settings-pause'),
                btnClose: document.getElementById('btn-settings-close'),
                
                // Inputs
                inputMusic: document.getElementById('opt-music'),
                inputSfx: document.getElementById('opt-sfx'),
                inputCrt: document.getElementById('opt-crt'),
                inputShake: document.getElementById('opt-shake')
            };

            this.init();
        }

        init() {
            this.loadSettings();
            this.setupListeners();
            this.applyVisuals(); // CRT initial setzen
        }

        setupListeners() {
            // Öffnen/Schließen
            const open = () => this.dom.modal.classList.remove('hidden');
            const close = () => this.dom.modal.classList.add('hidden');

            if(this.dom.btnOpenStart) this.dom.btnOpenStart.addEventListener('click', open);
            if(this.dom.btnOpenPause) this.dom.btnOpenPause.addEventListener('click', open);
            if(this.dom.btnClose) this.dom.btnClose.addEventListener('click', close);

            // Inputs Change Events
            this.dom.inputMusic.addEventListener('input', (e) => {
                this.config.musicVol = parseFloat(e.target.value);
                this.saveSettings();
                this.notifyChange('music');
            });

            this.dom.inputSfx.addEventListener('input', (e) => {
                this.config.sfxVol = parseFloat(e.target.value);
                this.saveSettings();
                this.notifyChange('sfx');
            });

            this.dom.inputCrt.addEventListener('change', (e) => {
                this.config.crtEnabled = e.target.checked;
                this.saveSettings();
                this.applyVisuals();
            });

            this.dom.inputShake.addEventListener('change', (e) => {
                this.config.shakeEnabled = e.target.checked;
                this.saveSettings();
            });
        }

        loadSettings() {
            const saved = localStorage.getItem('crimson_settings');
            if (saved) {
                try {
                    this.config = { ...this.config, ...JSON.parse(saved) };
                } catch (e) {
                    console.error("Settings corrupted, resetting.");
                }
            }
            
            // UI mit Werten füllen
            this.dom.inputMusic.value = this.config.musicVol;
            this.dom.inputSfx.value = this.config.sfxVol;
            this.dom.inputCrt.checked = this.config.crtEnabled;
            this.dom.inputShake.checked = this.config.shakeEnabled;
        }

        saveSettings() {
            localStorage.setItem('crimson_settings', JSON.stringify(this.config));
        }

        applyVisuals() {
            const crt = document.querySelector('.crt-overlay');
            if (crt) {
                crt.style.display = this.config.crtEnabled ? 'block' : 'none';
            }
        }

        // Ermöglicht game.js auf Änderungen zu reagieren
        onChange(callback) {
            this.callbacks.push(callback);
        }

        notifyChange(type) {
            this.callbacks.forEach(cb => cb(type, this.config));
        }

        // Globaler Zugriff auf Werte
        get() { return this.config; }
    }

    // Exportieren für andere Dateien
    window.GameSettings = new SettingsManager();

})();