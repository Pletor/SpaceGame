import * as Phaser from 'phaser';
import { Asteroid } from './Asteroid';
import { EventBusComponent, CUSTOM_EVENTS } from './events/EventBusComponent';

export class AsteroidSpawnerComponent {
    private scene: Phaser.Scene;
    private eventBusComponent: EventBusComponent;
    private asteroids: Phaser.GameObjects.Group;
    private spawnTimer: number = 0;
    private spawnInterval: number = 2000; // Spawn every 2 seconds
    private isActive: boolean = false;

    constructor(scene: Phaser.Scene, eventBusComponent: EventBusComponent) {
        this.scene = scene;
        this.eventBusComponent = eventBusComponent;

        // Create group for asteroids
        this.asteroids = scene.add.group();
    }

    public start(): void {
        this.isActive = true;
        this.spawnTimer = 0;
    }

    public stop(): void {
        this.isActive = false;
    }

    public update(deltaTime: number): void {
        if (!this.isActive) return;

        this.spawnTimer += deltaTime;

        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnAsteroid();
            this.spawnTimer = 0;
        }
    }

    private spawnAsteroid(): void {
        // Random position along top of screen
        const x = Phaser.Math.Between(50, this.scene.scale.width - 50);
        const y = -50; // Start above screen

        // Choose random asteroid size and properties
        const asteroidTypes = [
            {
                textures: ['meteor1', 'meteor2', 'meteor3', 'meteor4'],
                scale: 1.0,
                health: 3,
                speed: 100,
                score: 100
            },
            {
                textures: ['meteorMed1', 'meteorMed2'],
                scale: 0.7,
                health: 2,
                speed: 120,
                score: 150
            },
            {
                textures: ['meteorSmall1', 'meteorSmall2'],
                scale: 0.5,
                health: 1,
                speed: 150,
                score: 200
            }
        ];

        const randomType = Phaser.Utils.Array.GetRandom(asteroidTypes);
        const randomTexture = Phaser.Utils.Array.GetRandom(randomType.textures);

        // Create asteroid with specific properties
        const asteroid = new Asteroid(this.scene, x, y, this.eventBusComponent, randomType.health, randomType.speed, randomType.score);
        asteroid.setTexture(randomTexture);
        asteroid.setScale(randomType.scale);

        // Add to group
        this.asteroids.add(asteroid);

        // Clean up destroyed asteroids
        this.cleanupDestroyedAsteroids();
    }

    private cleanupDestroyedAsteroids(): void {
        if (!this.asteroids || !this.asteroids.children) return;

        // Use getChildren() method instead of entries
        const children = this.asteroids.getChildren() as Asteroid[];
        if (!children || children.length === 0) return;

        for (let i = children.length - 1; i >= 0; i--) {
            const asteroid = children[i];
            if (!asteroid || !asteroid.active) {
                this.asteroids.remove(asteroid, true, true);
            }
        }
    }

    public get asteroidGroup(): Phaser.GameObjects.Group {
        return this.asteroids;
    }

    public destroy(): void {
        this.asteroids.destroy(true);
    }
}
