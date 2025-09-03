import * as Phaser from 'phaser';
import { InputComponent } from './input/InputComponent';
import { HealthComponent } from './health/HealthComponent';
import { ColliderComponent } from './collider/ColliderComponent';
import { WeaponComponent } from './weapons/WeaponComponent';
import * as GameConfig from '../config/GameConfig';
import { EventBusComponent, CUSTOM_EVENTS } from './events/EventBusComponent';

export class Enemy extends Phaser.GameObjects.Container {
    public inputComponent: InputComponent;
    public healthComponent: HealthComponent;
    public colliderComponent: ColliderComponent;
    public weaponComponent?: WeaponComponent;
    public eventBusComponent: EventBusComponent;
    public sprite: Phaser.GameObjects.Sprite;
    protected velocity: { x: number; y: number } = { x: 0, y: 0 };

    constructor(scene: Phaser.Scene, x: number, y: number, spriteKey: string, inputComponent: InputComponent, health: number = 1) {
        super(scene, x, y);

        // Add to scene
        scene.add.existing(this);

        // Create sprite
        this.sprite = new Phaser.GameObjects.Sprite(scene, 0, 0, spriteKey);
        this.add(this.sprite);

        // Initialize components
        this.eventBusComponent = new EventBusComponent();
        this.inputComponent = inputComponent;
        this.healthComponent = new HealthComponent(health);
        this.colliderComponent = new ColliderComponent(this.healthComponent, this.eventBusComponent);

        // Set up physics body
        scene.physics.add.existing(this);

        // Configure physics body
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setSize(this.sprite.width * 0.8, this.sprite.height * 0.8);
        }

        // Set initial position
        this.setPosition(x, y);
    }

    public addWeapon(bulletConfig: any): void {
        this.weaponComponent = new WeaponComponent(this, this.inputComponent, bulletConfig, this.eventBusComponent);
    }

    public update(deltaTime: number): void {
        // Update input (access protected method through inheritance or direct call)
        if (this.inputComponent instanceof InputComponent) {
            // Update movement based on input
            this.updateMovement();
        }

        // Update weapon if it exists
        if (this.weaponComponent) {
            this.weaponComponent.update(deltaTime);
        }

        // Apply movement
        this.x += this.velocity.x * deltaTime / 1000;
        this.y += this.velocity.y * deltaTime / 1000;

        // Check if off screen (below the screen)
        if (this.y > 700) { // Assuming screen height of 600 + buffer
            this.destroy();
        }

        // Check if dead
        if (this.healthComponent.isDeadState) {
            this.onDeath();
        }
    }

    protected updateMovement(): void {
        // Basic movement based on input
        this.velocity.x = 0;
        this.velocity.y = 0;

        // Access input state (these are public properties)
        if (this.inputComponent.leftIsDown) {
            this.velocity.x = -100;
        }
        if (this.inputComponent.rightIsDown) {
            this.velocity.x = 100;
        }
        if (this.inputComponent.upIsDown) {
            this.velocity.y = -100;
        }
        if (this.inputComponent.downIsDown) {
            this.velocity.y = 100;
        }
    }

    protected onDeath(): void {
        this.eventBusComponent.emit(CUSTOM_EVENTS.ENEMY_DESTROYED, this);
        this.destroy();
    }

    public takeDamage(): void {
        this.healthComponent.hit();
    }

    public getHealth(): number {
        return this.healthComponent.life;
    }

    public getBulletGroup(): Phaser.Physics.Arcade.Group | undefined {
        return this.weaponComponent?.bulletGameObjectGroup;
    }

    public destroy(fromScene?: boolean): void {
        // Clean up components - no destroy methods, just let GC handle it
        super.destroy(fromScene);
    }
}
