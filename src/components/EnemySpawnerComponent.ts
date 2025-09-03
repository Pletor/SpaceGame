import * as Phaser from 'phaser';
import { ScoutEnemy } from './ScoutEnemy';
import { FighterEnemy } from './FighterEnemy';
import * as GameConfig from '../config/GameConfig';
import { EventBusComponent, CUSTOM_EVENTS } from './events/EventBusComponent';

export class EnemySpawnerComponent {
    private scene: Phaser.Scene;
    private eventBusComponent: EventBusComponent;
    private scoutSpawnTimer: number = 0;
    private fighterSpawnTimer: number = 0;
    private isActive: boolean = false;

    // Enemy groups for collision detection and management
    public scoutEnemyGroup: Phaser.GameObjects.Group;
    public fighterEnemyGroup: Phaser.GameObjects.Group;
    public allEnemyGroups: Phaser.GameObjects.Group[];

    constructor(scene: Phaser.Scene, eventBusComponent: EventBusComponent) {
        this.scene = scene;
        this.eventBusComponent = eventBusComponent;

        // Create enemy groups
        this.scoutEnemyGroup = scene.add.group();
        this.fighterEnemyGroup = scene.add.group();
        this.allEnemyGroups = [this.scoutEnemyGroup, this.fighterEnemyGroup];

        // Set initial spawn timers
        this.scoutSpawnTimer = GameConfig.ENEMY_SCOUT_GROUP_SPAWN_START;
        this.fighterSpawnTimer = GameConfig.ENEMY_FIGHTER_GROUP_SPAWN_START;

        // Listen for enemy destroyed events
        this.eventBusComponent.on(CUSTOM_EVENTS.ENEMY_DESTROYED, this.onEnemyDestroyed, this);
    }

    public start(): void {
        this.isActive = true;
    }

    public stop(): void {
        this.isActive = false;
    }

    public update(deltaTime: number): void {
        if (!this.isActive) return;

        // Update spawn timers
        this.scoutSpawnTimer -= deltaTime;
        this.fighterSpawnTimer -= deltaTime;

        // Spawn scout enemies
        if (this.scoutSpawnTimer <= 0) {
            this.spawnScoutGroup();
            this.scoutSpawnTimer = GameConfig.ENEMY_SCOUT_GROUP_SPAWN_INTERVAL;
        }

        // Spawn fighter enemies
        if (this.fighterSpawnTimer <= 0) {
            this.spawnFighterGroup();
            this.fighterSpawnTimer = GameConfig.ENEMY_FIGHTER_GROUP_SPAWN_INTERVAL;
        }
    }

    private spawnScoutGroup(): void {
        // Spawn 3-5 scout enemies in a row
        const groupSize = Phaser.Math.Between(3, 5);
        const startX = Phaser.Math.Between(100, 700);
        const spacing = 80;

        for (let i = 0; i < groupSize; i++) {
            const x = startX + (i * spacing);
            const y = -50; // Start above screen

            // Make sure enemies don't spawn outside screen bounds
            if (x >= 50 && x <= 750) {
                const scoutEnemy = new ScoutEnemy(this.scene, x, y);
                this.scoutEnemyGroup.add(scoutEnemy);
            }
        }
    }

    private spawnFighterGroup(): void {
        // Spawn 1-2 fighter enemies
        const groupSize = Phaser.Math.Between(1, 2);

        for (let i = 0; i < groupSize; i++) {
            const x = Phaser.Math.Between(100, 700);
            const y = -50; // Start above screen

            const fighterEnemy = new FighterEnemy(this.scene, x, y);
            this.fighterEnemyGroup.add(fighterEnemy);
        }
    }

    private onEnemyDestroyed(enemy: ScoutEnemy | FighterEnemy): void {
        // Remove enemy from appropriate group
        if (enemy instanceof ScoutEnemy) {
            this.scoutEnemyGroup.remove(enemy);
        } else if (enemy instanceof FighterEnemy) {
            this.fighterEnemyGroup.remove(enemy);
        }
    }

    public getActiveEnemyCount(): number {
        return this.scoutEnemyGroup.getLength() + this.fighterEnemyGroup.getLength();
    }

    public destroyAllEnemies(): void {
        this.scoutEnemyGroup.clear(true, true);
        this.fighterEnemyGroup.clear(true, true);
    }

    public destroy(): void {
        this.eventBusComponent.off(CUSTOM_EVENTS.ENEMY_DESTROYED, this.onEnemyDestroyed, this);
        this.destroyAllEnemies();
        this.scoutEnemyGroup.destroy();
        this.fighterEnemyGroup.destroy();
    }
}
