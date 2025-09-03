/**
 * Shield Power-Up - vylepšení štítu které padá z asteroidů
 *
 * Funkce:
 * - Létá po obrazovke směrem dolů po zničení asteroidu
 * - Při sebrání hráčem poskytuje dočasný štít
 * - Automaticky se zničí po opuštění obrazovky
 * - Má vizuální efekt rotace a záře
 *
 * Princip:
 * Physics-based movement dolů s rotací
 * Collision detection s hráčem
 * Auto-cleanup při opuštění obrazovky
 * Event-driven communication pro efekty
 */

import * as Phaser from 'phaser';
import { EventBusComponent } from './events/EventBusComponent';

export class ShieldPowerUp extends Phaser.GameObjects.Sprite {
    private eventBusComponent: EventBusComponent;
    private rotationSpeed: number;
    private fallSpeed: number;

    constructor(scene: Phaser.Scene, x: number, y: number, eventBusComponent: EventBusComponent) {
        super(scene, x, y, 'powerupBlue_shield');

        this.eventBusComponent = eventBusComponent;

        // Nastavit physics
        scene.physics.world.enable(this);
        scene.add.existing(this);

        // Nastavit vlastnosti
        this.fallSpeed = Phaser.Math.Between(80, 120);
        this.rotationSpeed = Phaser.Math.FloatBetween(-0.05, 0.05);

        // Nastavit scale a alpha efekty
        this.setScale(0.8);
        this.setAlpha(0.9);

        // Nastavit fyzikální tělo
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setVelocityY(this.fallSpeed);
            body.setCollideWorldBounds(false);
        }

        // Nastavit depth
        this.setDepth(1);

        // Přidat pulsující efekt
        this.addGlowEffect();

        // Auto-destroy při opuštění obrazovky
        this.checkBounds();
    }

    /**
     * Přidá pulsující světelný efekt
     */
    private addGlowEffect(): void {
        this.scene.tweens.add({
            targets: this,
            alpha: { from: 0.7, to: 1.0 },
            scale: { from: 0.7, to: 0.9 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * Kontroluje hranice obrazovky pro auto-destroy
     */
    private checkBounds(): void {
        this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                if (this.y > this.scene.scale.height + 50) {
                    this.destroy();
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    /**
     * Update loop pro rotaci
     */
    public update(): void {
        if (!this.active) return;

        this.rotation += this.rotationSpeed;
    }

    /**
     * Obsluha sebrání power-upu hráčem
     */
    public collect(): void {
        // Emitovat event pro aktivaci štítu
        this.eventBusComponent.emit('SHIELD_POWERUP_COLLECTED');

        // Vizuální efekt sebrání
        this.scene.tweens.add({
            targets: this,
            scale: 1.5,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                this.destroy();
            }
        });
    }

    /**
     * Vyčištění při destroy
     */
    public destroy(): void {
        // Zastavit všechny tweeny
        this.scene.tweens.killTweensOf(this);

        super.destroy();
    }
}
