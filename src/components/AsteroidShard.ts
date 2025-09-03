import * as Phaser from 'phaser';

export class AsteroidShard extends Phaser.GameObjects.Sprite {
    private velocityX: number;
    private velocityY: number;
    private rotationSpeed: number;
    private lifespan: number;
    private fadeStartTime: number;
    private initialAlpha: number;
    private startTime: number;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);

        // Add to scene
        scene.add.existing(this);

        // Enable physics for movement
        scene.physics.add.existing(this);

        // Set random movement direction and speed
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const speed = Phaser.Math.FloatBetween(50, 150);
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;

        // Random rotation speed
        this.rotationSpeed = Phaser.Math.FloatBetween(-0.1, 0.1);

        // Lifespan properties
        this.lifespan = 2000; // 2 seconds
        this.fadeStartTime = 1000; // Start fading after 1 second
        this.initialAlpha = 0.8;
        this.startTime = scene.time.now;

        // Set initial properties
        this.setAlpha(this.initialAlpha);
        this.setScale(Phaser.Math.FloatBetween(0.3, 0.6)); // Smaller than original asteroid
        this.setDepth(0.5); // Behind asteroids but in front of background

        // Start movement
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(this.velocityX, this.velocityY);

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
