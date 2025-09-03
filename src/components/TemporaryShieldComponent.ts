/**
 * Temporary Shield Component - spravuje dočasný štít z power-upů
 *
 * Funkce:
 * - Poskytuje dočasnou ochranu před asteroidními zásahy
 * - Zobrazuje vizuální efekt štítu kolem lodi
 * - Řídí časovač štítu s možností resetování
 * - Poskytuje audio a vizuální feedback
 *
 * Princip:
 * Timer-based system s automatickým vypnutím
 * Visual overlay přes hráče pro indikaci štítu
 * Event-driven communication pro aktivaci/deaktivaci
 * Reset mechanismus pro prodloužení štítu
 */

import * as Phaser from 'phaser';
import { EventBusComponent } from './events/EventBusComponent';

export class TemporaryShieldComponent {
    private scene: Phaser.Scene;
    private eventBusComponent: EventBusComponent;
    private player: Phaser.GameObjects.Container;

    // Štít stav
    private isActive: boolean = false;
    private shieldDuration: number = 15000; // 15 sekund
    private shieldTimer?: Phaser.Time.TimerEvent;

    // Vizuální efekty
    private shieldSprite?: Phaser.GameObjects.Sprite;
    private shieldGraphics?: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, player: Phaser.GameObjects.Container, eventBusComponent: EventBusComponent) {
        this.scene = scene;
        this.player = player;
        this.eventBusComponent = eventBusComponent;

        // Nastavit event listenery
        this.setupEventListeners();
    }

    /**
     * Nastaví event listenery
     */
    private setupEventListeners(): void {
        this.eventBusComponent.on('SHIELD_POWERUP_COLLECTED', this.activateShield, this);
        this.eventBusComponent.on('TEMPORARY_SHIELD_CHECK', this.handleShieldCheck, this);
    }

    /**
     * Aktivuje dočasný štít
     */
    private activateShield(): void {
        // Pokud už je štít aktivní, resetuj timer
        if (this.isActive) {
            this.resetShieldTimer();
            this.eventBusComponent.emit('SHIELD_UP_SOUND');
            console.log('Štít prodloužen!');
            return;
        }

        // Aktivovat štít
        this.isActive = true;
        this.createShieldVisuals();
        this.startShieldTimer();

        // Přehrát zvuk aktivace
        this.eventBusComponent.emit('SHIELD_UP_SOUND');

        console.log('Dočasný štít aktivován na', this.shieldDuration / 1000, 'sekund');
    }

    /**
     * Vytvoří vizuální efekt štítu
     */
    private createShieldVisuals(): void {
        // Vytvořit štítový sprite efekt
        this.shieldSprite = this.scene.add.sprite(0, 0, 'shield1');

        if (!this.shieldSprite) {
            console.error('Nepodařilo se vytvořit shield sprite');
            return;
        }

        this.shieldSprite.setScale(1.2);
        this.shieldSprite.setAlpha(0.6);
        this.shieldSprite.setTint(0x00ffff); // Cyan barva
        this.shieldSprite.setDepth(1.5); // Mezi loď a UI

        // Přidat štít do player containeru
        this.player.add(this.shieldSprite);

        // Animace pulsování
        this.scene.tweens.add({
            targets: this.shieldSprite,
            alpha: { from: 0.4, to: 0.8 },
            scale: { from: 1.1, to: 1.3 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Rotační animace
        this.scene.tweens.add({
            targets: this.shieldSprite,
            rotation: Math.PI * 2,
            duration: 4000,
            repeat: -1,
            ease: 'Linear'
        });
    }

    /**
     * Spustí štítový timer
     */
    private startShieldTimer(): void {
        this.shieldTimer = this.scene.time.delayedCall(this.shieldDuration, () => {
            this.deactivateShield();
        });
    }

    /**
     * Resetuje štítový timer (při sebrání dalšího power-upu)
     */
    private resetShieldTimer(): void {
        if (this.shieldTimer) {
            this.shieldTimer.destroy();
        }
        this.startShieldTimer();
    }

    /**
     * Deaktivuje štít
     */
    private deactivateShield(): void {
        this.isActive = false;

        // Odstranit vizuální efekty
        if (this.shieldSprite && this.shieldSprite.active) {
            // Zastavit všechny tweeny na sprite
            this.scene.tweens.killTweensOf(this.shieldSprite);

            // Fade out efekt
            this.scene.tweens.add({
                targets: this.shieldSprite,
                alpha: 0,
                scale: 0.5,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    if (this.shieldSprite && this.shieldSprite.destroy) {
                        this.shieldSprite.destroy();
                        this.shieldSprite = undefined;
                    }
                },
                onCompleteScope: this
            });
        }

        // Vyčistit timer
        if (this.shieldTimer) {
            this.shieldTimer.destroy();
            this.shieldTimer = undefined;
        }

        // Přehrát zvuk deaktivace
        this.eventBusComponent.emit('SHIELD_DOWN_SOUND');

        console.log('Dočasný štít deaktivován');
    }

    /**
     * Kontroluje zda je štít aktivní (volá se při kolizi s asteroidem)
     */
    private handleShieldCheck(callback: (isProtected: boolean) => void): void {
        callback(this.isActive);
    }

    /**
     * Getter pro stav štítu
     */
    public get isShieldActive(): boolean {
        return this.isActive;
    }

    /**
     * Vyčištění komponentu
     */
    public destroy(): void {
        // Vyčistit event listenery
        this.eventBusComponent.off('SHIELD_POWERUP_COLLECTED', this.activateShield, this);
        this.eventBusComponent.off('TEMPORARY_SHIELD_CHECK', this.handleShieldCheck, this);

        // Deaktivovat štít
        if (this.isActive) {
            this.deactivateShield();
        }
    }
}
