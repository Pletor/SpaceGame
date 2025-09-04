/**
 * ShieldUIComponent - Zobrazuje počet štítů a cooldown timer
 *
 * Funkce:
 * - Zobrazuje počet zbývajících štítů (5, 4, 3, 2, 1, 0)
 * - Zobrazuje cooldown timer v sekundách
 * - Reaguje na eventy z SimpleShieldComponent
 */

import * as Phaser from 'phaser';
import { EventBusComponent } from '../events/EventBusComponent';

export class ShieldUIComponent {
    private scene: Phaser.Scene;
    private eventBusComponent: EventBusComponent;

    // UI elementy
    private shieldCountText?: Phaser.GameObjects.Text;
    private cooldownText?: Phaser.GameObjects.Text;
    private instructionText?: Phaser.GameObjects.Text;
    private shieldIcon?: Phaser.GameObjects.Sprite;
    private activeShieldBar?: Phaser.GameObjects.Graphics;
    private cooldownBar?: Phaser.GameObjects.Graphics;

    // Progress tracking
    private isShowingActiveShield: boolean = false;
    private isShowingCooldown: boolean = false;

    constructor(scene: Phaser.Scene, eventBusComponent: EventBusComponent) {
        this.scene = scene;
        this.eventBusComponent = eventBusComponent;

        this.createUI();
        this.setupEventListeners();
    }

    /**
     * Vytvoří UI elementy
     */
    private createUI(): void {
        const { width, height } = this.scene.scale;

        // Ikona štítu - vedle shield baru, více doleva aby byla vidět
        this.shieldIcon = this.scene.add.sprite(width - 80, 180, 'powerupBlue_shield');
        this.shieldIcon.setScale(0.8);
        this.shieldIcon.setDepth(1001);

        // Počet štítů - vedle ikony
        this.shieldCountText = this.scene.add.text(width - 55, 175, '5', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#88ff88',
            fontStyle: 'bold'
        }).setOrigin(1, 0).setDepth(1001);

        // Instrukce - pod ikonou
        this.instructionText = this.scene.add.text(width - 55, 200, 'Press [C]', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#cccccc',
            fontStyle: 'normal'
        }).setOrigin(1, 0).setDepth(1001);

        // Progress bar pro aktivní štít (skrytý na začátku)
        this.activeShieldBar = this.scene.add.graphics();
        this.activeShieldBar.setPosition(width - 120, 225);
        this.activeShieldBar.setDepth(1000);
        this.activeShieldBar.setVisible(false);

        // Progress bar pro cooldown (skrytý na začátku)
        this.cooldownBar = this.scene.add.graphics();
        this.cooldownBar.setPosition(width - 120, 225);
        this.cooldownBar.setDepth(1000);
        this.cooldownBar.setVisible(false);

        // Cooldown text
        this.cooldownText = this.scene.add.text(width - 20, 230, '', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffaa00',
            fontStyle: 'normal'
        }).setOrigin(1, 0).setDepth(1000);
    }

    /**
     * Nastavení event listenerů
     */
    private setupEventListeners(): void {
        // Poslouchat aktivaci štítu
        this.eventBusComponent.on('SHIELD_ACTIVATED', (data: any) => {
            this.updateShieldCount(data.remaining);
            this.hideInstruction();
            this.showActiveShieldBar(data.duration);
        });

        // Poslouchat deaktivaci štítu
        this.eventBusComponent.on('SHIELD_DEACTIVATED', () => {
            this.hideActiveShieldBar();
        });

        // Poslouchat začátek cooldownu
        this.eventBusComponent.on('SHIELD_COOLDOWN_STARTED', (data: any) => {
            this.startCooldownDisplay(data.duration);
        });

        // Poslouchat konec cooldownu
        this.eventBusComponent.on('SHIELD_COOLDOWN_FINISHED', () => {
            this.cooldownText?.setText('');
            this.showInstruction();
        });

        // Poslouchat když nejsou štíty
        this.eventBusComponent.on('SHIELD_NO_CHARGES', () => {
            this.showNoShieldsMessage();
        });

        // Poslouchat když je štít na cooldownu
        this.eventBusComponent.on('SHIELD_ON_COOLDOWN', () => {
            this.showCooldownMessage();
        });
    }

    /**
     * Aktualizuje zobrazení počtu štítů
     */
    private updateShieldCount(remaining: number): void {
        if (!this.shieldCountText) return;

        this.shieldCountText.setText(`${remaining}`);

        // Změnit barvu podle počtu - méně výrazné barvy
        if (remaining <= 0) {
            this.shieldCountText.setColor('#cc6666'); // Tlumená červená
        } else if (remaining <= 2) {
            this.shieldCountText.setColor('#cc9966'); // Tlumená oranžová
        } else {
            this.shieldCountText.setColor('#88cc88'); // Tlumená zelená
        }
    }

    /**
     * Zobrazí progress bar pro aktivní štít
     */
    private showActiveShieldBar(duration: number): void {
        if (!this.activeShieldBar) return;

        this.isShowingActiveShield = true;
        this.activeShieldBar.setVisible(true);
        this.cooldownBar?.setVisible(false);

        const startTime = this.scene.time.now;
        const barWidth = 100;
        const barHeight = 8;

        // Timer pro aktualizaci progress baru
        this.scene.time.addEvent({
            delay: 50, // Aktualizace každých 50ms
            callback: () => {
                if (!this.activeShieldBar || !this.isShowingActiveShield) return false;

                const elapsed = this.scene.time.now - startTime;
                const remaining = Math.max(0, duration - elapsed);
                const progress = remaining / duration;

                // Vykreslit progress bar
                this.activeShieldBar.clear();

                // Pozadí
                this.activeShieldBar.fillStyle(0x333333, 0.8);
                this.activeShieldBar.fillRoundedRect(0, 0, barWidth, barHeight, 2);

                // Progress (cyan barva jako štít)
                if (progress > 0) {
                    this.activeShieldBar.fillStyle(0x00ffff, 0.9);
                    this.activeShieldBar.fillRoundedRect(1, 1, (barWidth - 2) * progress, barHeight - 2, 1);
                }

                if (remaining <= 0) {
                    this.isShowingActiveShield = false;
                    return false; // Zastavit timer
                }

                return true; // Pokračovat
            },
            callbackScope: this,
            loop: true
        });
    }

    /**
     * Skryje progress bar pro aktivní štít
     */
    private hideActiveShieldBar(): void {
        this.isShowingActiveShield = false;
        if (this.activeShieldBar) {
            this.activeShieldBar.setVisible(false);
            this.activeShieldBar.clear();
        }
    }

    /**
     * Spustí zobrazení cooldown timeru s progress barem
     */
    private startCooldownDisplay(duration: number): void {
        if (!this.cooldownText || !this.cooldownBar) return;

        this.isShowingCooldown = true;
        this.cooldownBar.setVisible(true);
        this.activeShieldBar?.setVisible(false);

        // Spustit timer pro pravidelnou aktualizaci cooldownu
        this.scene.time.addEvent({
            delay: 100, // Aktualizace každých 100ms
            callback: () => {
                this.updateCooldownDisplay();
                return this.isShowingCooldown; // Pokračovat dokud je cooldown aktivní
            },
            callbackScope: this,
            loop: true
        });
    }

    /**
     * Aktualizuje zobrazení cooldownu (volá se z update)
     */
    public updateCooldownDisplay(): void {
        if (!this.isShowingCooldown || !this.cooldownText || !this.cooldownBar) return;

        // Získat zbývající čas přímo z SimpleShieldComponent přes event
        this.eventBusComponent.emit('GET_SHIELD_COOLDOWN_TIME', (remaining: number) => {
            if (remaining <= 0) {
                // Cooldown skončil
                this.cooldownText?.setText('');
                this.cooldownBar?.setVisible(false);
                this.cooldownBar?.clear();
                this.isShowingCooldown = false;
                return;
            }

            // Zobrazit zbývající čas
            const seconds = Math.ceil(remaining / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            const timeText = minutes > 0 ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}` : `${remainingSeconds}s`;
            this.cooldownText?.setText(`${timeText}`);

            // Vykreslit cooldown progress bar
            const totalDuration = 120000; // 2 minuty
            const progress = 1 - (remaining / totalDuration); // Progress roste zleva doprava
            const barWidth = 100;
            const barHeight = 8;

            this.cooldownBar?.clear();

            // Pozadí
            this.cooldownBar?.fillStyle(0x333333, 0.8);
            this.cooldownBar?.fillRoundedRect(0, 0, barWidth, barHeight, 2);

            // Progress (oranžová barva pro cooldown)
            if (progress > 0) {
                this.cooldownBar?.fillStyle(0xffaa00, 0.9);
                this.cooldownBar?.fillRoundedRect(1, 1, (barWidth - 2) * progress, barHeight - 2, 1);
            }
        });
    }

    /**
     * Skryje instrukci
     */
    private hideInstruction(): void {
        if (this.instructionText) {
            this.instructionText.setVisible(false);
        }
    }

    /**
     * Zobrazí instrukci
     */
    private showInstruction(): void {
        if (this.instructionText) {
            this.instructionText.setVisible(true);
        }
    }

    /**
     * Zobrazí zprávu o nedostupných štítech
     */
    private showNoShieldsMessage(): void {
        const { width, height } = this.scene.scale;

        const message = this.scene.add.text(width / 2, height / 2 - 50, 'No shields remaining!', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#cc6666',
            fontStyle: 'normal'
        }).setOrigin(0.5).setDepth(1001);

        // Fade out po 2 sekundách
        this.scene.tweens.add({
            targets: message,
            alpha: 0,
            duration: 2000,
            onComplete: () => message.destroy()
        });
    }

    /**
     * Zobrazí zprávu o cooldownu
     */
    private showCooldownMessage(): void {
        const { width, height } = this.scene.scale;

        const message = this.scene.add.text(width / 2, height / 2 - 20, 'Shield on cooldown!', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ccaa66',
            fontStyle: 'normal'
        }).setOrigin(0.5).setDepth(1001);

        // Fade out po 1 sekundě
        this.scene.tweens.add({
            targets: message,
            alpha: 0,
            duration: 1000,
            onComplete: () => message.destroy()
        });
    }

    /**
     * Update metoda - volá se z GameScene pro aktualizaci UI
     */
    public update(): void {
        // Aktualizovat cooldown display pokud je aktivní
        if (this.isShowingCooldown) {
            this.updateCooldownDisplay();
        }
    }

    /**
     * Vyčištění
     */
    public destroy(): void {
        if (this.shieldCountText) {
            this.shieldCountText.destroy();
        }
        if (this.cooldownText) {
            this.cooldownText.destroy();
        }
        if (this.instructionText) {
            this.instructionText.destroy();
        }
        if (this.shieldIcon) {
            this.shieldIcon.destroy();
        }
        if (this.activeShieldBar) {
            this.activeShieldBar.destroy();
        }
        if (this.cooldownBar) {
            this.cooldownBar.destroy();
        }

        // Odpojit event listenery
        this.eventBusComponent.off('SHIELD_ACTIVATED');
        this.eventBusComponent.off('SHIELD_DEACTIVATED');
        this.eventBusComponent.off('SHIELD_COOLDOWN_STARTED');
        this.eventBusComponent.off('SHIELD_COOLDOWN_FINISHED');
        this.eventBusComponent.off('SHIELD_NO_CHARGES');
        this.eventBusComponent.off('SHIELD_ON_COOLDOWN');
    }
}
