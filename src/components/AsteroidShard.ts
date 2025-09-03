/**
 * Asteroid Shard - fragmenty asteroidů po roztříštění
 *
 * Funkce:
 * - Létají náhodným směrem po roztříštění asteroidu
 * - Postupně se ztrácejí (fade out) po krátkém čase
 * - Rotují se s náhodnou rychlostí pro realismus
 * - Nekolidují s hráčem - pouze vizuální efekt
 *
 * Princip:
 * Physics-based movement s náhodným směrem a rychlostí
 * Time-based fading s smooth alpha interpolací
 * Auto-cleanup po vypršení životnosti
 * Particle-like behavior pro realistický efekt
 */

import * as Phaser from 'phaser';

export class AsteroidShard extends Phaser.GameObjects.Sprite {
    private velocityX: number;
    private velocityY: number;
    private rotationSpeed: number;
    private lifespan: number;
    private fadeStartTime: number;
    private initialAlpha: number;
    private startTime: number;

    // Identifikační vlastnost pro rozpoznání shardů
    public readonly isAsteroidShard: boolean = true;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);

        // Add to scene
        scene.add.existing(this);

        // Enable physics for movement
        scene.physics.add.existing(this);

        // Set random movement direction and speed - vyšší rozsah rychlostí
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const speed = Phaser.Math.FloatBetween(80, 200); // Větší rozsah rychlostí
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;

        // Random rotation speed - rychlejší rotace pro dramatičnost
        this.rotationSpeed = Phaser.Math.FloatBetween(-0.15, 0.15);

        // Lifespan properties - delší životnost, plynulejší fade out
        this.lifespan = 3000; // 3 sekundy pro lepší vizuální efekt
        this.fadeStartTime = 1800; // Začne se ztrácet po 60% času
        this.initialAlpha = 0.9; // Vyšší počáteční průhlednost
        this.startTime = scene.time.now;

        // Set initial properties
        this.setAlpha(this.initialAlpha);
        this.setScale(Phaser.Math.FloatBetween(0.2, 0.5)); // Ještě menší fragmenty
        this.setDepth(0.5); // Za asteroidy ale před pozadím

        // Start movement - vyšší rychlosti pro dramatičtější efekt
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(this.velocityX, this.velocityY);
        body.setCollideWorldBounds(false); // Fragmenty mohou létat pryč z obrazovky

        // Set up update loop
        scene.events.on('update', this.update, this);

        // Auto-destroy after lifespan
        scene.time.delayedCall(this.lifespan, () => {
            this.destroy();
        });
    }

    public update(time: number, deltaTime: number): void {
        if (!this.active) return;

        // Apply rotation
        this.rotation += this.rotationSpeed;

        // Calculate how long this shard has existed
        const age = this.scene.time.now - this.startTime;

        // Start fading out after fadeStartTime
        if (age > this.fadeStartTime) {
            const fadeProgress = (age - this.fadeStartTime) / (this.lifespan - this.fadeStartTime);
            const alpha = this.initialAlpha * (1 - fadeProgress);
            this.setAlpha(Math.max(0, alpha));
        }
    }

    public destroy(): void {
        // Remove from update loop
        if (this.scene && this.scene.events) {
            this.scene.events.off('update', this.update, this);
        }

        super.destroy();
    }
}
