import * as Phaser from 'phaser';
import { KeyboardInputComponent } from '../components/input/KeyboardInputComponent';
import { HorizontalMovementComponent } from '../components/movement/HorizontalMovementComponent';
import { VerticalMovementComponent } from '../components/movement/VerticalMovementComponent';
import { WeaponComponent } from '../components/weapons/WeaponComponent';
import { HealthComponent } from '../components/health/HealthComponent';
import { ColliderComponent } from '../components/collider/ColliderComponent';
import { EventBusComponent, CUSTOM_EVENTS } from '../components/events/EventBusComponent';
import * as Config from '../config/GameConfig';

export class Player extends Phaser.GameObjects.Container {
    private shipSprite!: Phaser.GameObjects.Sprite;
    private shipEngineSprite!: Phaser.GameObjects.Sprite;
    private shipEngineThrusterSprite!: Phaser.GameObjects.Sprite;

    // Components
    private keyboardInputComponent!: KeyboardInputComponent;
    private horizontalMovementComponent!: HorizontalMovementComponent;
    private verticalMovementComponent!: VerticalMovementComponent;
    private playerWeaponComponent!: WeaponComponent;
    private playerSecondaryWeaponComponent!: WeaponComponent;
    private playerHealthComponent!: HealthComponent;
    private playerColliderComponent!: ColliderComponent;
    private eventBusComponent: EventBusComponent;
    private secondaryWeaponCooldown: number = 0;
    private secondaryWeaponCooldownTime: number = 10000; // 10 seconds

    // Shield system instead of damage
    private maxShield: number = 3;
    private currentShield: number = 3;
    private shieldDisplayComponent?: any; // Reference to shield display component

    constructor(scene: Phaser.Scene, eventBusComponent: EventBusComponent) {
        // Position player at bottom center of screen
        super(scene, scene.scale.width / 2, scene.scale.height - 32);

        this.eventBusComponent = eventBusComponent;

        // Create sprites
        this.createSprites();

        // Add to scene
        scene.add.existing(this);

        // Enable physics
        scene.physics.add.existing(this);

        // Set up physics body
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(24, 24);
        body.setOffset(-12, -12);
        body.setCollideWorldBounds(true);

        // Set depth for rendering order
        this.setDepth(2);

        // Create components
        this.createComponents();

        // Start hidden and wait for spawn event
        this.hide();

        // Listen for events
        this.setupEventListeners();

        // Initial spawn
        this.eventBusComponent.emit(CUSTOM_EVENTS.PLAYER_SPAWN);
    }

    public get weaponGameObjectGroup(): Phaser.Physics.Arcade.Group {
        return this.playerWeaponComponent.bulletGameObjectGroup;
    }

    public get secondaryWeaponGameObjectGroup(): Phaser.Physics.Arcade.Group {
        return this.playerSecondaryWeaponComponent.bulletGameObjectGroup;
    }

    public get weaponComponent(): WeaponComponent {
        return this.playerWeaponComponent;
    }

    public get secondaryWeaponComponent(): WeaponComponent {
        return this.playerSecondaryWeaponComponent;
    }

    public get colliderComponent(): ColliderComponent {
        return this.playerColliderComponent;
    }

    public get healthComponent(): HealthComponent {
        return this.playerHealthComponent;
    }

    private createSprites(): void {
        // Create ship sprites (order matters for rendering)
        this.shipEngineThrusterSprite = this.scene.add.sprite(0, 0, 'shipEngineThrust');
        this.shipEngineSprite = this.scene.add.sprite(0, 0, 'shipEngine');
        this.shipSprite = this.scene.add.sprite(0, 0, 'playerShip1_blue');

        // Add to container
        this.add([this.shipEngineThrusterSprite, this.shipEngineSprite, this.shipSprite]);

        // Start thruster animation
        this.shipEngineThrusterSprite.play('shipEngineThrust');

        // Initialize shield
        this.currentShield = this.maxShield;
    }

    private updateShieldVisualization(): void {
        // Show normal ship - shield is invisible but protective
        this.shipSprite.setTexture('playerShip1_blue');

        // Add shield effect based on shield level
        if (this.currentShield > 0) {
            // Could add shield glow effect here in future
            this.shipSprite.setTint(0xffffff); // Normal color
        } else {
            // No shield - normal appearance
            this.shipSprite.setTint(0xffffff);
        }
    }

    private createComponents(): void {
        // Input component
        this.keyboardInputComponent = new KeyboardInputComponent(this.scene);

        // Movement components
        this.horizontalMovementComponent = new HorizontalMovementComponent(
            this,
            this.keyboardInputComponent,
            Config.PLAYER_MOVEMENT_HORIZONTAL_VELOCITY
        );

        this.verticalMovementComponent = new VerticalMovementComponent(
            this,
            this.keyboardInputComponent,
            Config.PLAYER_MOVEMENT_HORIZONTAL_VELOCITY // Use same speed for vertical
        );

        // Health component
        this.playerHealthComponent = new HealthComponent(Config.PLAYER_HEALTH);

        // Collider component
        this.playerColliderComponent = new ColliderComponent(this.playerHealthComponent, this.eventBusComponent);

        // Weapon component
        this.playerWeaponComponent = new WeaponComponent(
            this,
            this.keyboardInputComponent,
            {
                maxCount: Config.PLAYER_BULLET_MAX_COUNT,
                interval: Config.PLAYER_BULLET_INTERVAL,
                speed: -Config.PLAYER_BULLET_SPEED,
                lifespan: Config.PLAYER_BULLET_LIFESPAN,
                yOffset: -20,
                flipY: false
            },
            this.eventBusComponent
        );

        // Secondary weapon component (stronger, dual laser)
        this.playerSecondaryWeaponComponent = new WeaponComponent(
            this,
            this.keyboardInputComponent,
            {
                maxCount: Config.PLAYER_SECONDARY_BULLET_MAX_COUNT, // Increased to 10
                interval: 200, // Faster fire rate
                speed: -400, // Faster bullets
                lifespan: Config.PLAYER_BULLET_LIFESPAN,
                yOffset: -20,
                flipY: false
            },
            this.eventBusComponent
        );
    }

    private setupEventListeners(): void {
        // Listen for scene update event
        this.scene.events.on('update', this.update, this);

        // Listen for player spawn event
        this.eventBusComponent.on(CUSTOM_EVENTS.PLAYER_SPAWN, this.spawn, this);

        // Listen for ship hit event to update damage visualization
        this.eventBusComponent.on(CUSTOM_EVENTS.SHIP_HIT, this.onDamageTaken, this);

        // Listen for shield depleted event - when player should die
        this.eventBusComponent.on('SHIELD_DEPLETED', this.onShieldDepleted, this);

        // Clean up when destroyed
        this.scene.events.once('destroy', this.cleanup, this);
    }

    private onDamageTaken(): void {
        console.log('Player.onDamageTaken called - emitting SHIELD_HIT event');

        // Emit SHIELD_HIT so ShieldDisplayComponent can handle shield logic
        this.eventBusComponent.emit('SHIELD_HIT');

        // Add screen shake effect for impact
        this.scene.cameras.main.shake(200, 0.02);

        // Let ShieldDisplayComponent handle the shield logic
        // We'll listen for SHIELD_DEPLETED to know when player should die
    }

    private onShieldDepleted(): void {
        console.log('Player.onShieldDepleted called - shield depleted, player dies!');
        // Shield is gone, player dies
        this.playerHealthComponent.die();
        // PLAYER_DESTROYED will be emitted by handleDeath() automatically
    }

    public update(time: number, deltaTime: number): void {
        if (!this.active) return;

        // Check if dead
        if (this.playerHealthComponent.isDeadState) {
            this.handleDeath();
            return;
        }

        // Update damage frame based on health (but don't use frames for player ship)
        // const damageFrame = Config.PLAYER_HEALTH - this.playerHealthComponent.life;
        // this.shipSprite.setFrame(damageFrame.toString());

        // Update components
        this.keyboardInputComponent.update();
        this.horizontalMovementComponent.update();
        this.verticalMovementComponent.update();
        this.playerWeaponComponent.update(deltaTime);

        // Update secondary weapon cooldown
        if (this.secondaryWeaponCooldown > 0) {
            this.secondaryWeaponCooldown -= deltaTime;
        }

        // Update secondary weapon if cooldown is ready
        if (this.keyboardInputComponent.shootSecondaryIsDown && this.secondaryWeaponCooldown <= 0) {
            this.fireSecondaryWeapon(deltaTime);
            this.secondaryWeaponCooldown = this.secondaryWeaponCooldownTime; // Reset cooldown
        }
    }

    private fireSecondaryWeapon(deltaTime: number): void {
        // Fire dual lasers - create two bullets side by side from wings
        const bulletGroup = this.playerSecondaryWeaponComponent.bulletGameObjectGroup;

        // Get two available bullets
        const bullets: any[] = [];
        const children = bulletGroup.getChildren();

        for (let i = 0; i < children.length && bullets.length < 2; i++) {
            const bullet = children[i];
            if (!bullet.active) {
                bullets.push(bullet);
            }
        }

        // Fire left wing bullet
        if (bullets[0]) {
            const leftBullet = bullets[0];
            const x = this.x - 20; // Left wing position
            const y = this.y - 25; // Slightly forward from ship
            leftBullet.enableBody(true, x, y, true, true);
            leftBullet.setScale(1.3); // Bigger bullets for secondary weapon
            leftBullet.body.setSize(16, 24);
            leftBullet.setFlipY(false);
            leftBullet.body.setVelocityY(-450); // Faster than primary
            leftBullet.setState(3000); // Lifespan
        }

        // Fire right wing bullet
        if (bullets[1]) {
            const rightBullet = bullets[1];
            const x = this.x + 20; // Right wing position
            const y = this.y - 25; // Slightly forward from ship
            rightBullet.enableBody(true, x, y, true, true);
            rightBullet.setScale(1.3); // Bigger bullets for secondary weapon
            rightBullet.body.setSize(16, 24);
            rightBullet.setFlipY(false);
            rightBullet.body.setVelocityY(-450); // Faster than primary
            rightBullet.setState(3000); // Lifespan
        }

        // Only emit events if at least one bullet was fired
        if (bullets.length > 0) {
            this.eventBusComponent.emit('SHIP_SHOOT_SECONDARY');
            this.eventBusComponent.emit(CUSTOM_EVENTS.SHIP_SHOOT);
        }
    }

    private handleDeath(): void {
        // Play explosion animation
        this.setVisible(true);
        this.shipSprite.play('explosion');
        this.hide();

        // Emit player destroyed event
        this.eventBusComponent.emit(CUSTOM_EVENTS.PLAYER_DESTROYED);

        return;
    }

    private hide(): void {
        this.setActive(false);
        this.setVisible(false);
        this.shipEngineSprite.setVisible(false);
        this.shipEngineThrusterSprite.setVisible(false);

        // Lock input
        this.keyboardInputComponent.lockInput(true);
    }

    private spawn(): void {
        // Reset position
        this.setPosition(this.scene.scale.width / 2, this.scene.scale.height - 32);

        // Make visible and active
        this.setActive(true);
        this.setVisible(true);
        this.shipEngineSprite.setVisible(true);
        this.shipEngineThrusterSprite.setVisible(true);

        // Reset health and shield state
        this.currentShield = this.maxShield;
        this.playerHealthComponent.reset();

        // Reset to normal ship texture
        this.shipSprite.setTexture('playerShip1_blue');
        this.updateShieldVisualization();

        // Unlock input
        this.keyboardInputComponent.lockInput(false);
    }

    public getSecondaryCooldown(): number {
        return this.secondaryWeaponCooldown;
    }

    private cleanup(): void {
        this.scene.events.off('update', this.update, this);
        this.eventBusComponent.off(CUSTOM_EVENTS.PLAYER_SPAWN, this.spawn, this);
        this.eventBusComponent.off(CUSTOM_EVENTS.SHIP_HIT, this.onDamageTaken, this);
        this.scene.events.off('destroy', this.cleanup, this);
    }
}
