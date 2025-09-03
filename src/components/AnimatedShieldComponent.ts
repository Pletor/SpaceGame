/**
 * Animated Shield Component - poskytuje animovaný vizuální štít reagující na štítový bar
 *
 * Funkce:
 * - Zobrazuje animovaný štít kolem hráče na základě stavu štítového baru
 * - Používá shield1-shield3 textury pro plynulou animaci
 * - Reaguje na změny štítového baru (aktivace/deaktivace)
 * - Poskytuje vizuální feedback při zásazích a opravách
 *
 * Princip:
 * Event-driven system propojený se ShieldDisplayComponent
 * Frame-based animation using shield1.png, shield2.png, shield3.png
 * Dynamic opacity and scale based on shield health
 * Automatic synchronization with shield bar state
 */

import * as Phaser from 'phaser';
import { EventBusComponent } from './events/EventBusComponent';
import { ShieldTimerComponent } from './ui/ShieldTimerComponent';

export class AnimatedShieldComponent {
    private scene: Phaser.Scene;
    private eventBusComponent: EventBusComponent;
    private player: Phaser.GameObjects.Container;

    // Štít stav
    private isVisible: boolean = false;
    private currentShieldLevel: number = 0; // 0-3 úroveň štítu
    private maxShieldLevel: number = 3;

    // Dočasný štít stav
    private isTemporaryShieldActive: boolean = false;
    private temporaryShieldTimer?: Phaser.Time.TimerEvent;
    private temporaryShieldDuration: number = 15000; // 15 sekund

    // Vizuální komponenty
    private shieldSprite?: Phaser.GameObjects.Sprite;
    private pulsingTween?: Phaser.Tweens.Tween;
    private shieldTimerComponent: ShieldTimerComponent;

    constructor(scene: Phaser.Scene, player: Phaser.GameObjects.Container, eventBusComponent: EventBusComponent) {
        this.scene = scene;
        this.player = player;
        this.eventBusComponent = eventBusComponent;

        // Inicializovat timer komponentu
        this.shieldTimerComponent = new ShieldTimerComponent(scene);

        // Nastavit event listenery
        this.setupEventListeners();

        // Inicializovat s plným štítem
        this.currentShieldLevel = this.maxShieldLevel;
        this.updateShieldVisuals();
    }

    /**
     * Nastaví event listenery pro komunikaci se štítovým barem a power-upy
     */
    private setupEventListeners(): void {
        // Reagovat na zásahy štítu
        this.eventBusComponent.on('SHIELD_HIT', this.onShieldHit, this);

        // Reagovat na opravu štítu
        this.eventBusComponent.on('SHIELD_UP_SOUND', this.onShieldRepair, this);

        // Reagovat na reset hráče
        this.eventBusComponent.on('PLAYER_SPAWN', this.onPlayerSpawn, this);

        // Reagovat na vyčerpání štítu
        this.eventBusComponent.on('SHIELD_DEPLETED', this.onShieldDepleted, this);

        // Reagovat na sebrání power-up štítu
        this.eventBusComponent.on('SHIELD_POWERUP_COLLECTED', this.onPowerUpCollected, this);

        // Reagovat na kontrolu dočasného štítu
        this.eventBusComponent.on('TEMPORARY_SHIELD_CHECK', this.handleTemporaryShieldCheck, this);
    }    /**
     * Zpracuje zásah štítu - snižuje úroveň a poskytuje vizuální feedback
     */
    private onShieldHit(): void {
        if (this.currentShieldLevel > 0) {
            this.currentShieldLevel--;
            console.log(`AnimatedShield: Shield hit, level now: ${this.currentShieldLevel}`);

            this.updateShieldVisuals();
            this.playHitEffect();
        }
    }

    /**
     * Zpracuje opravu štítu - zvyšuje úroveň
     */
    private onShieldRepair(): void {
        if (this.currentShieldLevel < this.maxShieldLevel) {
            this.currentShieldLevel++;
            console.log(`AnimatedShield: Shield repaired, level now: ${this.currentShieldLevel}`);

            this.updateShieldVisuals();
            this.playRepairEffect();
        }
    }

    /**
     * Reset při respawnu hráče
     */
    private onPlayerSpawn(): void {
        this.currentShieldLevel = this.maxShieldLevel;
        this.updateShieldVisuals();
        console.log('AnimatedShield: Player respawned with full shield');
    }

    /**
     * Zpracuje sebrání power-up štítu
     */
    private onPowerUpCollected(): void {
        console.log('AnimatedShield: Power-up shield collected!');

        // Aktivovat dočasný štít
        this.activateTemporaryShield();
    }

    /**
     * Aktivuje dočasný štít z power-upu
     */
    private activateTemporaryShield(): void {
        // Pokud už je dočasný štít aktivní, prodlužíme ho
        if (this.isTemporaryShieldActive) {
            this.resetTemporaryShieldTimer();
            this.shieldTimerComponent.extendTimer(this.temporaryShieldDuration);
            console.log('AnimatedShield: Temporary shield extended!');
            return;
        }

        // Aktivovat dočasný štít
        this.isTemporaryShieldActive = true;
        this.startTemporaryShieldTimer();

        // Spustit UI timer
        this.shieldTimerComponent.startTimer(this.temporaryShieldDuration);

        // Zobrazit štít s speciální barvou (standardní štít se skryje)
        this.updateShieldAppearance();

        console.log('AnimatedShield: Temporary shield activated for', this.temporaryShieldDuration / 1000, 'seconds');
    }

    /**
     * Spustí timer pro dočasný štít
     */
    private startTemporaryShieldTimer(): void {
        this.temporaryShieldTimer = this.scene.time.delayedCall(this.temporaryShieldDuration, () => {
            this.deactivateTemporaryShield();
        });
    }

    /**
     * Resetuje timer dočasného štítu
     */
    private resetTemporaryShieldTimer(): void {
        if (this.temporaryShieldTimer) {
            this.temporaryShieldTimer.destroy();
        }
        this.startTemporaryShieldTimer();
    }

    /**
     * Deaktivuje dočasný štít
     */
    private deactivateTemporaryShield(): void {
        this.isTemporaryShieldActive = false;

        if (this.temporaryShieldTimer) {
            this.temporaryShieldTimer.destroy();
            this.temporaryShieldTimer = undefined;
        }

        // Zastavit UI timer
        this.shieldTimerComponent.stopTimer();

        // Obnovit standardní štít
        this.updateShieldAppearance();

        console.log('AnimatedShield: Temporary shield expired, returning to standard shield');
    }

    /**
     * Zpracuje úplné vyčerpání štítu
     */
    private onShieldDepleted(): void {
        this.currentShieldLevel = 0;
        this.updateShieldVisuals();
        this.playDepletedEffect();
        console.log('AnimatedShield: Shield completely depleted');
    }

    /**
     * Kontroluje stav dočasného štítu
     */
    private handleTemporaryShieldCheck(callback: (isProtected: boolean) => void): void {
        // Dočasný štít poskytuje úplnou ochranu
        callback(this.isTemporaryShieldActive);
    }

    /**
     * Aktualizuje vizuální stav štítu na základě současné úrovně
     */
    private updateShieldVisuals(): void {
        if (this.currentShieldLevel <= 0) {
            // Žádný štít - skrýt
            this.hideShield();
        } else {
            // Zobrazit štít s příslušnou úrovní
            this.showShield();
            this.updateShieldAppearance();
        }
    }

    /**
     * Zobrazí štít pokud není viditelný
     */
    private showShield(): void {
        if (!this.isVisible) {
            this.createShieldSprite();
            this.isVisible = true;
        }
    }

    /**
     * Skryje štít
     */
    private hideShield(): void {
        if (this.isVisible) {
            this.destroyShieldSprite();
            this.isVisible = false;
        }
    }

    /**
     * Vytvoří štítový sprite s animací
     */
    private createShieldSprite(): void {
        if (this.shieldSprite) {
            this.destroyShieldSprite();
        }

        // Vytvořit animovaný sprite
        this.shieldSprite = this.scene.add.sprite(0, 0, 'shield1');
        this.shieldSprite.setScale(1.2); // Menší scale pro decentnější vzhled
        this.shieldSprite.setAlpha(0.3); // Velmi nízká základní opacity
        this.shieldSprite.setDepth(1.5); // Mezi loď a UI

        // Přidat do player containeru
        this.player.add(this.shieldSprite);

        // Spustit animaci
        this.shieldSprite.play('shieldPulsing');

        // Spustit pulsování
        this.startShieldAnimations();
    }

    /**
     * Spustí animace štítu (pouze jemné pulsování, bez rotace)
     */
    private startShieldAnimations(): void {
        if (!this.shieldSprite) return;

        // Velmi jemná animace pulsování pro minimální rušení
        this.pulsingTween = this.scene.tweens.add({
            targets: this.shieldSprite,
            alpha: { from: 0.25, to: 0.4 }, // Velmi nízké hodnoty pro minimální opacity
            duration: 3000, // Ještě pomalejší pulsování
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Rotace odstraněna - štít zůstává statický
    }

    /**
     * Aktualizuje vzhled štítu podle současné úrovně
     */
    private updateShieldAppearance(): void {
        if (!this.shieldSprite) return;

        // Pokud je aktivní dočasný štít z power-upu
        if (this.isTemporaryShieldActive) {
            this.shieldSprite.setVisible(true);

            // Speciální zlatá/oranžová barva pro power-up štít
            this.shieldSprite.setTint(0xFFB000); // Zlatooranžová
            this.shieldSprite.setAlpha(0.8); // Vyšší viditelnost pro indikaci
            this.shieldSprite.setScale(1.4); // Větší scale pro power-up

            console.log('AnimatedShield: Displaying temporary power-up shield');
            return;
        }

        // Standardní štít podle úrovně zdraví
        // Pokud je štít na úrovni 0 nebo méně, skryj ho
        if (this.currentShieldLevel <= 0) {
            this.shieldSprite.setVisible(false);
            return;
        }

        // Zobrazit standardní štít
        this.shieldSprite.setVisible(true);

        let tintColor: number;
        let alpha: number;
        let scale: number;

        switch (this.currentShieldLevel) {
            case 3: // Plný štít - cyan
                tintColor = 0x00ffff;
                alpha = 0.35; // Velmi nízká opacity pro minimální rušení
                scale = 1.2; // Menší scale
                break;
            case 2: // Střední úroveň - žlutá
                tintColor = 0xffff00;
                alpha = 0.3; // Velmi nízká opacity
                scale = 1.15; // Menší scale
                break;
            case 1: // Nízká úroveň - červená
                tintColor = 0xff6666; // Světlejší červená
                alpha = 0.25; // Velmi nízká opacity
                scale = 1.1; // Menší scale
                break;
            default:
                tintColor = 0xffffff;
                alpha = 0.2; // Minimální opacity
                scale = 1.0;
        }

        this.shieldSprite.setTint(tintColor);
        this.shieldSprite.setAlpha(alpha);
        this.shieldSprite.setScale(scale);

        // Aktualizovat rychlost animace podle úrovně
        if (this.shieldSprite.anims && this.shieldSprite.anims.currentAnim) {
            const frameRate = 4 + (this.currentShieldLevel * 2); // 6-10 FPS podle úrovně
            this.shieldSprite.anims.currentAnim.frameRate = frameRate;
        }
    }

    /**
     * Velmi jemný efekt při zásahu štítu
     */
    private playHitEffect(): void {
        if (!this.shieldSprite) return;

        // Minimální flash efekt
        this.scene.tweens.add({
            targets: this.shieldSprite,
            alpha: 0.5, // Velmi jemná změna
            scale: this.shieldSprite.scale + 0.05, // Minimální nárůst
            duration: 120, // Krátká doba
            yoyo: true,
            ease: 'Power2'
        });

        // Velmi jemné červené bliknutí
        const originalTint = this.shieldSprite.tintTopLeft;
        this.shieldSprite.setTint(0xff9999); // Ještě světlejší červená

        this.scene.time.delayedCall(80, () => { // Kratší doba bliknutí
            if (this.shieldSprite) {
                this.updateShieldAppearance(); // Obnovit původní barvu
            }
        });
    }

    /**
     * Velmi jemný efekt při opravě štítu
     */
    private playRepairEffect(): void {
        if (!this.shieldSprite) return;

        // Minimální zelený flash při opravě
        this.scene.tweens.add({
            targets: this.shieldSprite,
            alpha: 0.6, // Velmi jemná změna
            scale: this.shieldSprite.scale + 0.08, // Minimální nárůst
            duration: 200, // Krátká animace
            yoyo: true,
            ease: 'Power2'
        });

        // Velmi jemné zelené bliknutí
        const originalTint = this.shieldSprite.tintTopLeft;
        this.shieldSprite.setTint(0x99ff99); // Ještě světlejší zelená

        this.scene.time.delayedCall(150, () => { // Kratší doba bliknutí
            if (this.shieldSprite) {
                this.updateShieldAppearance(); // Obnovit původní barvu
            }
        });
    }

    /**
     * Efekt při úplném vyčerpání štítu
     */
    private playDepletedEffect(): void {
        if (!this.shieldSprite) return;

        // Dramatický fade-out efekt
        this.scene.tweens.add({
            targets: this.shieldSprite,
            alpha: 0,
            scale: 0.5,
            rotation: this.shieldSprite.rotation + Math.PI,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                this.hideShield();
            }
        });
    }

    /**
     * Zničí štítový sprite a vyčistí animace
     */
    private destroyShieldSprite(): void {
        if (this.shieldSprite) {
            // Zastavit animace
            if (this.pulsingTween) {
                this.pulsingTween.destroy();
                this.pulsingTween = undefined;
            }

            // Zastavit všechny tweeny na sprite
            this.scene.tweens.killTweensOf(this.shieldSprite);

            // Zničit sprite
            this.shieldSprite.destroy();
            this.shieldSprite = undefined;
        }
    }

    /**
     * Getter pro současnou úroveň štítu
     */
    public getCurrentLevel(): number {
        return this.currentShieldLevel;
    }

    /**
     * Getter pro stav viditelnosti
     */
    public get isShieldVisible(): boolean {
        return this.isVisible;
    }

    /**
     * Vyčištění komponentu
     */
    public destroy(): void {
        // Vyčistit event listenery
        this.eventBusComponent.off('SHIELD_HIT', this.onShieldHit, this);
        this.eventBusComponent.off('SHIELD_UP_SOUND', this.onShieldRepair, this);
        this.eventBusComponent.off('PLAYER_SPAWN', this.onPlayerSpawn, this);
        this.eventBusComponent.off('SHIELD_DEPLETED', this.onShieldDepleted, this);

        // Vyčistit dočasný štít timer
        if (this.temporaryShieldTimer) {
            this.temporaryShieldTimer.destroy();
            this.temporaryShieldTimer = undefined;
        }

        // Vyčistit timer komponentu
        if (this.shieldTimerComponent) {
            this.shieldTimerComponent.destroy();
        }

        // Zničit vizuální komponenty
        this.destroyShieldSprite();

        console.log('AnimatedShieldComponent destroyed');
    }
}
