/**
 * Weapon Component - spravuje zbraňový systém s object poolingem
 *
 * Funkce:
 * - Vytváří a spravuje pool střel pro optimální výkon
 * - Řídí interval střelby a rychlost střel
 * - Automaticky recykluje střely které opustily obrazovku
 * - Poskytuje konfigurovatelné parametry zbraně
 *
 * Princip:
 * Object pooling pattern - pre-vytváří objekty a recykluje je
 * Event-driven firing - střelba se aktivuje přes input komponentu
 * Automatické řízení životního cyklu střel s timeoutem
 */

import * as Phaser from 'phaser';
import { InputComponent } from '../input/InputComponent';
import { EventBusComponent, CUSTOM_EVENTS } from '../events/EventBusComponent';

interface BulletConfig {
    maxCount: number;     // Maximální počet střel v poolu
    interval: number;     // Interval mezi střelbami (ms)
    speed: number;        // Rychlost střely
    lifespan: number;     // Životnost střely (ms)
    yOffset: number;      // Offset pozice střelby od objektu
    flipY: boolean;       // Otočení směru střely
}

export class WeaponComponent {
    private gameObject: Phaser.GameObjects.Container;
    private inputComponent: InputComponent;
    private bulletConfig: BulletConfig;
    private bulletGroup: Phaser.Physics.Arcade.Group;
    private fireBulletInterval: number = 0;
    private eventBusComponent?: EventBusComponent;

    constructor(
        gameObject: Phaser.GameObjects.Container,
        inputComponent: InputComponent,
        bulletConfig: BulletConfig,
        eventBusComponent?: EventBusComponent
    ) {
        this.gameObject = gameObject;
        this.inputComponent = inputComponent;
        this.bulletConfig = bulletConfig;
        this.eventBusComponent = eventBusComponent;

        // Vytvořit skupinu střel
        this.bulletGroup = gameObject.scene.physics.add.group({
            name: `bullets_${Phaser.Math.RND.uuid()}`,
            enable: false
        });

        // Vytvořit pool střel
        this.createBulletPool();

        // Nastavit event listenery
        this.setupEventListeners();
    }

    /**
     * Vytvoří pool střel pro optimální výkon
     */
    private createBulletPool(): void {
        this.bulletGroup.createMultiple({
            key: 'laserBlue01',
            quantity: this.bulletConfig.maxCount,
            active: false,
            visible: false
        });
    }

    /**
     * Nastaví event listenery pro čištění
     */
    private setupEventListeners(): void {
        // Poslouchat physics world step pro aktualizaci životnosti střel
        this.gameObject.scene.physics.world.on('worldstep', this.worldStep, this);
        this.gameObject.scene.events.once('destroy', this.cleanup, this);
    }

    public get bulletGameObjectGroup(): Phaser.Physics.Arcade.Group {
        return this.bulletGroup;
    }

    public update(deltaTime: number): void {
        // Update fire interval
        this.fireBulletInterval -= deltaTime;

        // Check if we can fire
        if (this.fireBulletInterval > 0) return;

        if (this.inputComponent.shootIsDown) {
            const bullet = this.bulletGroup.getFirstDead();

            if (!bullet) return;

            // Calculate bullet position
            const x = this.gameObject.x;
            const y = this.gameObject.y + this.bulletConfig.yOffset;

            // Enable and position bullet
            bullet.enableBody(true, x, y, true, true);

            // Set bullet properties
            bullet.setScale(0.8);
            bullet.body.setSize(14, 18);
            bullet.setFlipY(this.bulletConfig.flipY);
            bullet.body.setVelocityY(this.bulletConfig.speed);
            bullet.setState(this.bulletConfig.lifespan);
            bullet.play('laserBlue01');

            // Reset fire interval
            this.fireBulletInterval = this.bulletConfig.interval;

            // Emit shoot event
            if (this.eventBusComponent) {
                this.eventBusComponent.emit(CUSTOM_EVENTS.SHIP_SHOOT);
            }
        }
    }

    public destroyBullet(bullet: Phaser.Physics.Arcade.Sprite): void {
        bullet.setState(-1); // Set to negative to trigger immediate removal
        bullet.disableBody(true, true); // Immediately disable the bullet
        bullet.setActive(false);
        bullet.setVisible(false);
    }

    private worldStep(deltaTime: number): void {
        this.bulletGroup.getChildren().forEach((bullet: any) => {
            if (!bullet.active) return;

            // Update bullet lifespan
            bullet.state -= deltaTime;

            if (bullet.state <= 0) {
                bullet.disableBody(true, true);
                bullet.setActive(false);
                bullet.setVisible(false);
            }
        });
    }

    private cleanup(): void {
        this.gameObject.scene.physics.world.off('worldstep', this.worldStep, this);
        this.gameObject.scene.events.off('destroy', this.cleanup, this);
    }

    public getAvailableAmmo(): number {
        return this.bulletGroup.countActive(false);
    }

    public getMaxAmmo(): number {
        return this.bulletConfig.maxCount;
    }

    public getCurrentAmmo(): number {
        return this.bulletConfig.maxCount - this.bulletGroup.countActive(true);
    }
}
