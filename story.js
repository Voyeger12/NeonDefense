/**
 * CRIMSON DEFENSE
 * Story Module
 * Handles narrative sequences and typewriting effects.
 */

(function() {
    'use strict';

    const STORY_DATA = [
        "WARNUNG: KRITISCHER SYSTEMFEHLER.",
        "FIREWALL STATUS: DURCHBROCHEN.",
        "QUELLE: CRIMSON_VIRUS.EXE",
        "PROTOKOLL: MANUELLE VERTEIDIGUNG ERFORDERLICH.",
        "LADE WAFFENSYSTEME...",
        "VIEL GLÜCK, USER."
    ];

    class StoryEngine {
        constructor() {
            this.active = false;
            this.timeouts = [];
            this.onComplete = null;
            
            this.dom = {
                layer: document.getElementById('story-layer'),
                terminal: document.getElementById('story-terminal'),
                overlay: document.getElementById('overlay') // Referenz zum Startscreen
            };

            // Event Listener für Skip
            this.dom.layer.addEventListener('click', () => this.skip());
            document.addEventListener('keydown', (e) => {
                if(this.active && e.key === 'Escape') this.skip();
            });
        }

        play(onCompleteCallback) {
            this.active = true;
            this.onComplete = onCompleteCallback;
            this.timeouts = [];

            // UI umschalten
            this.dom.overlay.classList.add('hidden'); // Startscreen weg
            this.dom.layer.classList.remove('hidden'); // Story an
            this.dom.terminal.innerText = "";

            let delay = 0;

            STORY_DATA.forEach((line) => {
                // Zeile schreiben
                const t1 = setTimeout(() => {
                    this.typeLine(line);
                    // Optional: Sound triggern via Global Event oder Callback, 
                    // aber wir halten es hier simpel.
                }, delay);
                this.timeouts.push(t1);

                // Zeit berechnen: Länge des Textes * Speed + Pause
                delay += (line.length * 40) + 800;
            });

            // Auto-Ende
            const tEnd = setTimeout(() => {
                this.finish();
            }, delay + 1000);
            this.timeouts.push(tEnd);
        }

        typeLine(text) {
            if(!this.active) return;
            this.dom.terminal.innerText += text + "\n\n";
            window.scrollTo(0, document.body.scrollHeight);
        }

        skip() {
            if(!this.active) return;
            this.finish();
        }

        finish() {
            this.active = false;
            // Alle Timer killen
            this.timeouts.forEach(t => clearTimeout(t));
            this.timeouts = [];

            // UI aufräumen
            this.dom.layer.classList.add('hidden');
            
            // Spiel starten signalisieren
            if(this.onComplete) this.onComplete();
        }
    }

    // Export
    window.StoryModule = new StoryEngine();

})();