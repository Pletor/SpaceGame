import * as Phaser from 'phaser';
import { HealthComponent } from './health/HealthComponent';
import { ColliderComponent } from './collider/ColliderComponent';
import { EventBusComponent, CUSTOM_EVENTS } from './events/EventBusComponent';
import { AsteroidShard } from './AsteroidShard';
import { AsteroidHealthBarComponent } from './ui/AsteroidHealthBarComponent';

export class Asteroid extends Phaser.GameObjects.Sprite {
    // Components
    public healthComponent!: HealthComponent;
    public colliderComponent!: ColliderComponent;
    private eventBusComponent: EventBusComponent;
    private speed: number;
    private scoreValue: number;
    private healthBarComponent?: AsteroidHealthBarComponent;
    private maxHealth: number;

    constructor(scene: Phaser.Scene, x: number, y: number, eventBusComponent: EventBusComponent, health: number = 3, speed: number = 100, scoreValue: number = 100) {
        // Use meteor texture for asteroids
        super(scene, x, y, 'meteor1');

        this.eventBusComponent = eventBusComponent;
        this.speed = speed;
        this.scoreValue = scoreValue;
        this.maxHealth = health;

        // Add to scene
        scene.add.existing(this);

        // Enable physics
        scene.physics.add.existing(this);

        // Set up physics body
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(this.width * 0.8, this.height * 0.8);
        body.setOffset(this.width * 0.1, this.height * 0.1);

        // Set depth for rendering order
        this.setDepth(1);

        // Create components with specified health
        this.createComponents(health);

        // Create health bar component (only for asteroids with more than 1 health)
        if (health > 1) {
            this.healthBarComponent = new AsteroidHealthBarComponent(scene, this, health);
        }

        // Set up event listeners
        this.setupEventListeners();

        // Start moving down at specified speed
        const physicsBody = this.body as Phaser.Physics.Arcade.Body;
        physicsBody.setVelocityY(this.speed);
    }

    private createComponents(health: number): void {
        // Health component with specified health
        this.healthComponent = new HealthComponent(health);

        // Collider component
        this.colliderComponent = new ColliderComponent(this.healthComponent, this.eventBusComponent, this);
    }    private setupEventListeners(): void {
        // Listen for asteroid destruction
        this.eventBusComponent.on(CUSTOM_EVENTS.ENEMY_DESTROYED, (asteroid: Asteroid) => {
            if (asteroid === this && this.active) {
                // Create shatter effect before disabling
                this.shatterIntoShards();

                // Destroy health bar immediately when asteroid is destroyed
                if (this.healthBarComponent) {
                    this.healthBarComponent.destroy();
                    this.healthBarComponent = undefined;
                }

                this.setActive(false);
                this.setVisible(false);
                // Don't destroy immediately
            }
        });

        // Update movement
        this.scene.events.on('update', this.update, this);

        // Cleanup on destroy
        this.scene.events.on('destroy', this.cleanup, this);
    }

    public update(): void {
        // Check if asteroid is still active and scene exists
        if (!this.active || !this.scene) return;

        // Update health bar position if it exists and asteroid is still active
        if (this.healthBarComponent && this.active) {
            this.healthBarComponent.updatePosition();
        }

        // Check if asteroid is out of bounds (below screen)
        if (this.y > this.scene.scale.height + 50) {
            this.destroy();
        }
    }

    public takeDamage(): void {
        if (this.healthComponent) {
            this.healthComponent.hit();

            // Update health bar if it exists
            if (this.healthBarComponent) {
                this.healthBarComponent.updateHealth(this.healthComponent.life);
            }
        }
    }

    public getScoreValue(): number {
        return this.scoreValue;
    }

    public destroyAsteroid(): void {
        // Immediately destroy health bar
        if (this.healthBarComponent) {
            this.healthBarComponent.destroy();
            this.healthBarComponent = undefined;
        }

        // Deactivate asteroid
        this.setActive(false);
        this.setVisible(false);
    }

    private shatterIntoShards(): void {
        // Create 3-5 shards at the asteroid's position
        const shardCount = Phaser.Math.Between(3, 5);

        // Get smaller meteor textures for shards
        const shardTextures = ['meteorSmall1', 'meteorSmall2'];

        for (let i = 0; i < shardCount; i++) {
            // Random position near the asteroid center
            const offsetX = Phaser.Math.Between(-20, 20);
            const offsetY = Phaser.Math.Between(-20, 20);
            const shardX = this.x + offsetX;
            const shardY = this.y + offsetY;

            // Random texture for variety
            const texture = Phaser.Utils.Array.GetRandom(shardTextures);

            // Create the shard
            const shard = new AsteroidShard(this.scene, shardX, shardY, texture);

            // Play shatter sound effect
            if (i === 0) { // Only play sound once per shatter
                this.eventBusComponent.emit('ASTEROID_SHATTER_SOUND');
            }
        }
    }

    private cleanup(): void {
        // Destroy health bar component if it still exists
        if (this.healthBarComponent) {
            this.healthBarComponent.destroy();
            this.healthBarComponent = undefined;
        }

        if (this.scene && this.scene.events) {
            this.scene.events.off('update', this.update, this);
            this.scene.events.off('destroy', this.cleanup, this);
        }
        if (this.eventBusComponent) {
            this.eventBusComponent.off(CUSTOM_EVENTS.ENEMY_DESTROYED, this.cleanup, this);
        }
    }
}
