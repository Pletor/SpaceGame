/**
 * Asteroid - hlavní nepřátelský objekt ve hře
 *
 * Funkce:
 * - Pohybuje se dolů obrazovkou s konfigurovatelnou rychlostí
 * - Má konfigurovatelné zdraví a hodnotu skóre
 * - Při zničení se rozpadá na menší fragmenty
 * - Zobrazuje health bar pro asteroidy s více než 1 životem
 *
 * Princip:
 * Component-based architektura s HealthComponent a ColliderComponent
 * Physics-driven movement s Arcade Physics
 * Visual feedback s health barem a shatter efektem
 * Event-driven communication pro audio a skóre systémy
 */

import * as Phaser from 'phaser';
import { HealthComponent } from './health/HealthComponent';
import { ColliderComponent } from './collider/ColliderComponent';
import { EventBusComponent, CUSTOM_EVENTS } from './events/EventBusComponent';
import { AsteroidShard } from './AsteroidShard';
import { ShieldPowerUp } from './ShieldPowerUp';
import { AsteroidHealthBarComponent } from './ui/AsteroidHealthBarComponent';

export class Asteroid extends Phaser.GameObjects.Sprite {
    // Komponenty
    public healthComponent!: HealthComponent;
    public colliderComponent!: ColliderComponent;
    private eventBusComponent: EventBusComponent;
    private speed: number;
    private scoreValue: number;
    private healthBarComponent?: AsteroidHealthBarComponent;
    private maxHealth: number;

    constructor(scene: Phaser.Scene, x: number, y: number, eventBusComponent: EventBusComponent, health: number = 3, speed: number = 100, scoreValue: number = 100) {
        // Použít meteor texturu pro asteroidy
        super(scene, x, y, 'meteor1');

        this.eventBusComponent = eventBusComponent;
        this.speed = speed;
        this.scoreValue = scoreValue;
        this.maxHealth = health;

        // Inicializovat asteroid
        this.initializeAsteroid(scene, health);
    }

    /**
     * Inicializuje asteroid s fyzikou a komponentami
     */
    private initializeAsteroid(scene: Phaser.Scene, health: number): void {
        // Přidat do scény
        scene.add.existing(this);

        // Povolit fyziku
        scene.physics.add.existing(this);

        // Nastavit fyzikální tělo
        this.setupPhysicsBody();

        // Nastavit hloubku pro renderovací pořadí
        this.setDepth(1);

        // Vytvořit komponenty se specifikovaným zdravím
        this.createComponents(health);

        // Vytvořit health bar komponentu (pouze pro asteroidy s více než 1 životem)
        this.createHealthBarIfNeeded(health);

        // Nastavit event listenery
        this.setupEventListeners();

        // Začít pohyb dolů se specifikovanou rychlostí
        this.startMovement();
    }

    /**
     * Nastaví fyzikální tělo asteroidu
     */
    private setupPhysicsBody(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(this.width * 0.8, this.height * 0.8);
        body.setOffset(this.width * 0.1, this.height * 0.1);
    }

    /**
     * Vytvoří health bar pokud je potřeba
     */
    private createHealthBarIfNeeded(health: number): void {
        if (health > 1) {
            this.healthBarComponent = new AsteroidHealthBarComponent(this.scene, this, health);
        }
    }

    /**
     * Spustí pohyb asteroidu
     */
    private startMovement(): void {
        const physicsBody = this.body as Phaser.Physics.Arcade.Body;
        physicsBody.setVelocityY(this.speed);
    }

    /**
     * Vytvoří komponenty asteroidu
     */
    private createComponents(health: number): void {
        // Health komponenta se specifikovaným zdravím
        this.healthComponent = new HealthComponent(health);

        // Collider komponenta
        this.colliderComponent = new ColliderComponent(this.healthComponent, this.eventBusComponent, this);
    }

    /**
     * Nastaví event listenery pro asteroid
     */
    private setupEventListeners(): void {
        // Poslouchat zničení asteroidu
        this.eventBusComponent.on(CUSTOM_EVENTS.ENEMY_DESTROYED, (asteroid: Asteroid) => {
            if (asteroid === this && this.active) {
                // Vytvořit shatter efekt před deaktivací
                this.shatterIntoShards();

                // Okamžitě zničit health bar když je asteroid zničen
                this.destroyHealthBarImmediate();

                this.setActive(false);
                this.setVisible(false);
                // Nezničit okamžitě
            }
        });

        // Aktualizovat pohyb
        this.scene.events.on('update', this.update, this);

        // Vyčistit při zničení
        this.scene.events.on('destroy', this.cleanup, this);
    }

    /**
     * Okamžitě zničí health bar
     */
    private destroyHealthBarImmediate(): void {
        if (this.healthBarComponent) {
            this.healthBarComponent.destroy();
            this.healthBarComponent = undefined;
        }
    }

    /**
     * Hlavní update loop asteroidu
     */
    public update(): void {
        // Zkontrolovat zda je asteroid stále aktivní a scéna existuje
        if (!this.active || !this.scene) return;

        // Aktualizovat pozici health baru pokud existuje a asteroid je stále aktivní
        if (this.healthBarComponent && this.active) {
            this.healthBarComponent.updatePosition();
        }

        // Zkontrolovat zda je asteroid mimo hranice (pod obrazovkou)
        if (this.y > this.scene.scale.height + 50) {
            this.destroy();
        }
    }

    /**
     * Zpracuje poškození asteroidu
     */
    public takeDamage(): void {
        if (this.healthComponent) {
            this.healthComponent.hit();

            // Aktualizovat health bar pokud existuje
            if (this.healthBarComponent) {
                this.healthBarComponent.updateHealth(this.healthComponent.life);
            }
        }
    }

    /**
     * Vrací hodnotu skóre za zničení
     */
    public getScoreValue(): number {
        return this.scoreValue;
    }

    /**
     * Zničí asteroid kompletně
     */
    public destroyAsteroid(): void {
        // Okamžitě zničit health bar
        this.destroyHealthBarImmediate();

        // Deaktivovat asteroid
        this.setActive(false);
        this.setVisible(false);
    }

    /**
     * Roztříští asteroid na menší fragmenty
     */
    private shatterIntoShards(): void {
        // Vytvořit 3-5 fragmentů na pozici asteroidu
        const shardCount = Phaser.Math.Between(3, 5);

        // Získat menší meteor textury pro fragmenty
        const shardTextures = ['meteorSmall1', 'meteorSmall2'];

        for (let i = 0; i < shardCount; i++) {
            // Náhodná pozice blízko středu asteroidu
            const offsetX = Phaser.Math.Between(-20, 20);
            const offsetY = Phaser.Math.Between(-20, 20);
            const shardX = this.x + offsetX;
            const shardY = this.y + offsetY;

            // Náhodná textura pro rozmanitost
            const texture = Phaser.Utils.Array.GetRandom(shardTextures);

            // Vytvořit fragment
            const shard = new AsteroidShard(this.scene, shardX, shardY, texture);

            // Přehrát zvuk roztříštění
            if (i === 0) { // Přehrát zvuk pouze jednou za roztříštění
                this.eventBusComponent.emit('ASTEROID_SHATTER_SOUND');
            }
        }

        // Šance na drop shield power-upu (15% šance)
        this.tryDropShieldPowerUp();
    }

    /**
     * Zkusí spawnnout shield power-up s určitou pravděpodobností
     */
    private tryDropShieldPowerUp(): void {
        const dropChance = Math.random();

        // 15% šance na drop shield power-upu
        if (dropChance < 0.15) {
            console.log('Spawning shield power-up at:', this.x, this.y);

            // Vytvořit ShieldPowerUp
            new ShieldPowerUp(this.scene, this.x, this.y, this.eventBusComponent);
        }
    }

    /**
     * Vyčistí event listenery a komponenty
     */
    private cleanup(): void {
        // Zničit health bar komponentu pokud stále existuje
        this.destroyHealthBarImmediate();

        if (this.scene && this.scene.events) {
            this.scene.events.off('update', this.update, this);
            this.scene.events.off('destroy', this.cleanup, this);
        }
        if (this.eventBusComponent) {
            this.eventBusComponent.off(CUSTOM_EVENTS.ENEMY_DESTROYED, this.cleanup, this);
        }
    }
}
