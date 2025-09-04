/**
 * Asteroid Spawner Component - spravuje spawn a životní cyklus asteroidů
 *
 * Funkce:
 * - Pravidelně spawnuje asteroidy různých velikostí a vlastností
 * - Řídí časování spawnu a obtížnost hry
 * - Spravuje skupinu asteroidů pro kolizní detekci
 * - Automaticky čistí zničené asteroidy z paměti
 *
 * Princip:
 * Timer-based spawning s konfigurovatelnými intervaly
 * Variety asteroidů s různými vlastnostmi (health, rychlost, skóre)
 * Group management pro efektivní správu objektů
 */

import * as Phaser from 'phaser';
import { Asteroid } from './Asteroid';
import { EventBusComponent, CUSTOM_EVENTS } from './events/EventBusComponent';

export class AsteroidSpawnerComponent {
    private scene: Phaser.Scene;
    private eventBusComponent: EventBusComponent;
    private asteroids: Phaser.GameObjects.Group;
    private spawnTimer: number = 0;
    private spawnInterval: number = 2000; // Spawn každé 2 sekundy
    private isActive: boolean = false;

    constructor(scene: Phaser.Scene, eventBusComponent: EventBusComponent) {
        this.scene = scene;
        this.eventBusComponent = eventBusComponent;

        // Vytvořit skupinu pro asteroidy
        this.asteroids = scene.add.group();
    }

    /**
     * Spustí spawning asteroidů
     */
    public start(): void {
        this.isActive = true;
        this.spawnTimer = 0;
    }

    /**
     * Zastaví spawning asteroidů
     */
    public stop(): void {
        this.isActive = false;
    }

    /**
     * Hlavní update loop - řídí časování spawnu
     */
    public update(deltaTime: number): void {
        if (!this.isActive) return;

        this.spawnTimer += deltaTime;

        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnAsteroid();
            this.spawnTimer = 0;
        }
    }

    /**
     * Vytvoří nový asteroid s náhodnými vlastnostmi
     */
    private spawnAsteroid(): void {
        // Získat dostupné typy asteroidů
        const availableTypes = this.getAvailableAsteroidTypes();

        if (availableTypes.length === 0) {
            this.stop();
            return;
        }

        // Náhodná pozice podél horní části obrazovky
        const x = Phaser.Math.Between(50, this.scene.scale.width - 50);
        const y = -50; // Začít nad obrazovkou

        // Vybrat dostupný typ
        const randomType = Phaser.Utils.Array.GetRandom(availableTypes);
        const randomTexture = Phaser.Utils.Array.GetRandom(randomType.textures);

        // Vytvořit asteroid s konkrétními vlastnostmi
        const asteroid = new Asteroid(this.scene, x, y, this.eventBusComponent, randomType.health, randomType.speed, randomType.score);
        asteroid.setTexture(randomTexture);
        asteroid.setScale(randomType.scale);

        // Nastavit typ pro tracking
        (asteroid as any).asteroidType = randomType.type;

        // Emitovat event o spawnu
        this.eventBusComponent.emit('ASTEROID_SPAWNED', randomType.type);

        // Přidat do skupiny
        this.asteroids.add(asteroid);

        // Vyčistit zničené asteroidy
        this.cleanupDestroyedAsteroids();
    }

    /**
     * Definuje typy asteroidů s jejich vlastnostmi
     */
    private getAsteroidTypes(): Array<{type: string, textures: string[], scale: number, health: number, speed: number, score: number}> {
        return [
            {
                type: 'large',
                textures: ['meteorBrown_big1', 'meteorBrown_big2', 'meteorGrey_big1', 'meteorGrey_big2'],
                scale: 1.0,
                health: 3,
                speed: 80,
                score: 100
            },
            {
                type: 'medium',
                textures: ['meteorBrown_med1', 'meteorBrown_med3', 'meteorGrey_med1', 'meteorGrey_med2'],
                scale: 0.7,
                health: 2,
                speed: 100,
                score: 150
            },
            {
                type: 'small',
                textures: ['meteorBrown_small1', 'meteorBrown_small2', 'meteorGrey_small1', 'meteorGrey_small2'],
                scale: 0.5,
                health: 1,
                speed: 120,
                score: 200
            }
        ];
    }

    /**
     * Získá dostupné typy asteroidů (které se ještě mohou spawnovat)
     */
    private getAvailableAsteroidTypes(): Array<{type: string, textures: string[], scale: number, health: number, speed: number, score: number}> {
        const allTypes = this.getAsteroidTypes();

        return allTypes.filter(type => {
            // Emitovat dotaz na tracker zda se může asteroid spawnovat
            let canSpawn = false;
            this.eventBusComponent.emit('CAN_SPAWN_ASTEROID', type.type, (result: boolean) => {
                canSpawn = result;
            });
            return canSpawn;
        });
    }

    /**
     * Vyčistí neaktivní asteroidy ze skupiny
     */
    private cleanupDestroyedAsteroids(): void {
        if (!this.asteroids || !this.asteroids.children) return;

        // Použít getChildren() metodu místo entries
        const children = this.asteroids.getChildren() as Asteroid[];
        if (!children || children.length === 0) return;

        for (let i = children.length - 1; i >= 0; i--) {
            const asteroid = children[i];
            if (!asteroid || !asteroid.active) {
                this.asteroids.remove(asteroid, true, true);
            }
        }
    }

    /**
     * Vrací skupinu asteroidů pro kolizní detekci
     */
    public get asteroidGroup(): Phaser.GameObjects.Group {
        return this.asteroids;
    }

    /**
     * Vyčistí všechny asteroidy při zničení komponenty
     */
    public destroy(): void {
        this.asteroids.destroy(true);
    }
}
