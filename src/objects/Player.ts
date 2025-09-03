/**
 * Hlavní objekt hráče - ovládá loď, zbraně a interakce
 *
 * Funkce:
 * - Spravuje všechny komponenty hráče (pohyb, zbraně, health, kolize)
 * - Řídí systém štítů namísto přímého poškození
 * - Poskytuje duální zbraňový systém (primární a sekundární)
 * - Řeší respawn a smrt hráče
 *
 * Princip:
 * Container-based architektura s komponentami pro různé funkce
 * Event-driven komunikace pro interakci s ostatními systémy
 * Štíty slouží jako ochrana před asteroidem místo života
 */

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
    // Grafické komponenty lodi
    private shipSprite!: Phaser.GameObjects.Sprite;
    private shipEngineSprite!: Phaser.GameObjects.Sprite;
    private shipEngineThrusterSprite!: Phaser.GameObjects.Sprite;

    // Herní komponenty
    private keyboardInputComponent!: KeyboardInputComponent;
    private horizontalMovementComponent!: HorizontalMovementComponent;
    private verticalMovementComponent!: VerticalMovementComponent;
    private playerWeaponComponent!: WeaponComponent;
    private playerSecondaryWeaponComponent!: WeaponComponent;
    private playerHealthComponent!: HealthComponent;
    private playerColliderComponent!: ColliderComponent;
    private eventBusComponent: EventBusComponent;

    // Systém sekundární zbraně
    private secondaryWeaponCooldown: number = 0;
    private readonly secondaryWeaponCooldownTime: number = 10000; // 10 sekund

    // Systém štítů místo damage
    private readonly maxShield: number = 3;
    private currentShield: number = 3;

    constructor(scene: Phaser.Scene, eventBusComponent: EventBusComponent) {
        // Umístit hráče do spodního středu obrazovky
        super(scene, scene.scale.width / 2, scene.scale.height - 32);

        this.eventBusComponent = eventBusComponent;

        // Vytvořit grafické elementy
        this.createSprites();

        // Přidat do scény
        scene.add.existing(this);

        // Povolit fyziku
        scene.physics.add.existing(this);

        // Nastavit fyzikální tělo
        this.setupPhysicsBody();

        // Nastavit hloubku pro správné renderování
        this.setDepth(2);

        // Vytvořit komponenty
        this.createComponents();

        // Začít skrytý a čekat na spawn event
        this.hide();

        // Nastavit event listenery
        this.setupEventListeners();

        // Počáteční spawn
        this.eventBusComponent.emit(CUSTOM_EVENTS.PLAYER_SPAWN);
    }

    // Gettery pro přístup k komponentám z vnějšku
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

    public getSecondaryCooldown(): number {
        return this.secondaryWeaponCooldown;
    }

    /**
     * Nastaví fyzikální tělo hráče
     */
    private setupPhysicsBody(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(24, 24);
        body.setOffset(-12, -12);
        body.setCollideWorldBounds(true);
    }

    /**
     * Vytvoří všechny sprite komponenty lodi
     */
    private createSprites(): void {
        // Vytvořit sprite komponenty lodi (pořadí je důležité pro renderování)
        this.shipEngineThrusterSprite = this.scene.add.sprite(0, 30, 'fire00'); // Posunout více dozadu
        this.shipEngineSprite = this.scene.add.sprite(0, 0, 'shipEngine');
        this.shipSprite = this.scene.add.sprite(0, 0, 'playerShip1_blue');

        // Přidat do kontejneru
        this.add([this.shipEngineThrusterSprite, this.shipEngineSprite, this.shipSprite]);

        // Nastavit engine thrust animaci - zpočátku skrytý
        this.shipEngineThrusterSprite.setVisible(false);
        this.shipEngineThrusterSprite.play('engineThrust');

        // Inicializovat štíty
        this.currentShield = this.maxShield;
    }

    /**
     * Aktualizuje vizualizaci štítů
     */
    private updateShieldVisualization(): void {
        // Zobrazit normální loď - štíty jsou neviditelné ale ochranné
        this.shipSprite.setTexture('playerShip1_blue');

        // Přidat efekt štítů podle úrovně štítů
        if (this.currentShield > 0) {
            // V budoucnu zde může být přidán efekt záře štítů
            this.shipSprite.setTint(0xffffff); // Normální barva
        } else {
            // Bez štítů - normální vzhled
            this.shipSprite.setTint(0xffffff);
        }
    }

    /**
     * Vytvoří všechny herní komponenty
     */
    private createComponents(): void {
        // Komponenta vstupu
        this.keyboardInputComponent = new KeyboardInputComponent(this.scene);

        // Komponenty pohybu
        this.horizontalMovementComponent = new HorizontalMovementComponent(
            this,
            this.keyboardInputComponent,
            Config.PLAYER_MOVEMENT_HORIZONTAL_VELOCITY
        );

        this.verticalMovementComponent = new VerticalMovementComponent(
            this,
            this.keyboardInputComponent,
            Config.PLAYER_MOVEMENT_HORIZONTAL_VELOCITY // Použít stejnou rychlost pro vertikální pohyb
        );

        // Komponenta zdraví
        this.playerHealthComponent = new HealthComponent(Config.PLAYER_HEALTH);

        // Komponenta kolizí
        this.playerColliderComponent = new ColliderComponent(this.playerHealthComponent, this.eventBusComponent);

        // Primární zbraňová komponenta
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

        // Sekundární zbraňová komponenta (silnější, duální laser)
        this.playerSecondaryWeaponComponent = new WeaponComponent(
            this,
            this.keyboardInputComponent,
            {
                maxCount: Config.PLAYER_SECONDARY_BULLET_MAX_COUNT, // Zvýšeno na 10
                interval: 200, // Rychlejší střelba
                speed: -400, // Rychlejší střely
                lifespan: Config.PLAYER_BULLET_LIFESPAN,
                yOffset: -20,
                flipY: false
            },
            this.eventBusComponent
        );
    }

    /**
     * Nastaví všechny event listenery
     */
    private setupEventListeners(): void {
        // Poslouchat update event ze scény
        this.scene.events.on('update', this.update, this);

        // Poslouchat spawn event hráče
        this.eventBusComponent.on(CUSTOM_EVENTS.PLAYER_SPAWN, this.spawn, this);

        // Poslouchat hit event pro aktualizaci damage vizualizace
        this.eventBusComponent.on(CUSTOM_EVENTS.SHIP_HIT, this.onDamageTaken, this);

        // Poslouchat event vyčerpání štítů - kdy by hráč měl zemřít
        this.eventBusComponent.on('SHIELD_DEPLETED', this.onShieldDepleted, this);

        // Vyčistit při zničení
        this.scene.events.once('destroy', this.cleanup, this);
    }

    /**
     * Zpracovává přijaté poškození
     */
    private onDamageTaken(): void {
        console.log('Player.onDamageTaken volán - emituju SHIELD_HIT event');

        // Emitovat SHIELD_HIT aby ShieldDisplayComponent mohl zpracovat logiku štítů
        this.eventBusComponent.emit('SHIELD_HIT');

        // Přidat efekt otřesu obrazovky pro dopad
        this.scene.cameras.main.shake(200, 0.02);

        // Nechat ShieldDisplayComponent zpracovat logiku štítů
        // Budeme poslouchat SHIELD_DEPLETED abychom věděli, kdy hráč má zemřít
    }

    /**
     * Zpracovává vyčerpání štítů
     */
    private onShieldDepleted(): void {
        console.log('Player.onShieldDepleted volán - štíty vyčerpány, hráč umírá!');
        // Štíty jsou pryč, hráč umírá
        this.playerHealthComponent.die();
        // PLAYER_DESTROYED bude automaticky emitován handleDeath()
    }

    /**
     * Hlavní update loop hráče
     */
    public update(time: number, deltaTime: number): void {
        if (!this.active) return;

        // Zkontrolovat, zda je mrtvý
        if (this.playerHealthComponent.isDeadState) {
            this.handleDeath();
            return;
        }

        // Aktualizovat komponenty
        this.updateComponents(deltaTime);

        // Zpracovat sekundární zbraň
        this.handleSecondaryWeapon(deltaTime);
    }

    /**
     * Aktualizuje všechny komponenty hráče
     */
    private updateComponents(deltaTime: number): void {
        this.keyboardInputComponent.update();
        this.horizontalMovementComponent.update();
        this.verticalMovementComponent.update();
        this.playerWeaponComponent.update(deltaTime);

        // Aktualizovat engine thrust efekt podle pohybu
        this.updateEngineThrust();

        // Aktualizovat cooldown sekundární zbraně
        if (this.secondaryWeaponCooldown > 0) {
            this.secondaryWeaponCooldown -= deltaTime;
        }
    }

    /**
     * Řídí viditelnost engine thrust podle pohybu
     */
    private updateEngineThrust(): void {
        // Zobrazit engine thrust pokud se loď pohybuje
        const isMoving = this.keyboardInputComponent.upIsDown || 
                        this.keyboardInputComponent.downIsDown || 
                        this.keyboardInputComponent.leftIsDown || 
                        this.keyboardInputComponent.rightIsDown;

        if (isMoving && !this.shipEngineThrusterSprite.visible) {
            this.shipEngineThrusterSprite.setVisible(true);
            // Animace už běží z createSprites, jen zobrazíme sprite
        } else if (!isMoving && this.shipEngineThrusterSprite.visible) {
            this.shipEngineThrusterSprite.setVisible(false);
        }
    }

    /**
     * Zpracovává sekundární zbraň
     */
    private handleSecondaryWeapon(deltaTime: number): void {
        // Aktualizovat sekundární zbraň pokud je cooldown připraven
        if (this.keyboardInputComponent.shootSecondaryIsDown && this.secondaryWeaponCooldown <= 0) {
            this.fireSecondaryWeapon();
            this.secondaryWeaponCooldown = this.secondaryWeaponCooldownTime; // Reset cooldown
        }
    }

    /**
     * Vystřelí sekundární zbraň - duální lasery
     */
    private fireSecondaryWeapon(): void {
        // Vystřelit duální lasery - vytvořit dvě střely vedle sebe z křídel
        const bulletGroup = this.playerSecondaryWeaponComponent.bulletGameObjectGroup;

        // Získat dvě dostupné střely
        const bullets: any[] = [];
        const children = bulletGroup.getChildren();

        for (let i = 0; i < children.length && bullets.length < 2; i++) {
            const bullet = children[i];
            if (!bullet.active) {
                bullets.push(bullet);
            }
        }

        // Vystřelit střelu z levého křídla
        if (bullets[0]) {
            this.createSecondaryBullet(bullets[0], this.x - 20, this.y - 25);
        }

        // Vystřelit střelu z pravého křídla
        if (bullets[1]) {
            this.createSecondaryBullet(bullets[1], this.x + 20, this.y - 25);
        }

        // Emitovat eventy pouze pokud byla vystřelena alespoň jedna střela
        if (bullets.length > 0) {
            this.eventBusComponent.emit('SHIP_SHOOT_SECONDARY');
            this.eventBusComponent.emit(CUSTOM_EVENTS.SHIP_SHOOT);
        }
    }

    /**
     * Vytvoří a nakonfiguruje sekundární střelu
     */
    private createSecondaryBullet(bullet: any, x: number, y: number): void {
        bullet.enableBody(true, x, y, true, true);
        bullet.setScale(1.3); // Větší střely pro sekundární zbraň
        bullet.body.setSize(16, 24);
        bullet.setFlipY(false);
        bullet.body.setVelocityY(-450); // Rychlejší než primární
        bullet.setState(3000); // Životnost
    }

    /**
     * Zpracovává smrt hráče
     */
    private handleDeath(): void {
        // Přehrát animaci exploze
        this.setVisible(true);
        this.shipSprite.play('explosion');
        this.hide();

        // Emitovat event zničení hráče
        this.eventBusComponent.emit(CUSTOM_EVENTS.PLAYER_DESTROYED);
    }

    /**
     * Skryje hráče a zablokuje vstup
     */
    private hide(): void {
        this.setActive(false);
        this.setVisible(false);
        this.shipEngineSprite.setVisible(false);
        this.shipEngineThrusterSprite.setVisible(false);

        // Zablokovat vstup
        this.keyboardInputComponent.lockInput(true);
    }

    /**
     * Spawnuje hráče na počáteční pozici
     */
    private spawn(): void {
        // Reset pozice
        this.setPosition(this.scene.scale.width / 2, this.scene.scale.height - 32);

        // Učinit viditelným a aktivním
        this.setActive(true);
        this.setVisible(true);
        this.shipEngineSprite.setVisible(true);
        // Engine thrust zůstane skrytý - zobrazí se jen při pohybu
        this.shipEngineThrusterSprite.setVisible(false);

        // Reset zdraví a stav štítů
        this.currentShield = this.maxShield;
        this.playerHealthComponent.reset();

        // Reset na normální texturu lodi
        this.shipSprite.setTexture('playerShip1_blue');
        this.updateShieldVisualization();

        // Odblokovat vstup
        this.keyboardInputComponent.lockInput(false);
    }

    /**
     * Vyčistí event listenery při zničení objektu
     */
    private cleanup(): void {
        this.scene.events.off('update', this.update, this);
        this.eventBusComponent.off(CUSTOM_EVENTS.PLAYER_SPAWN, this.spawn, this);
        this.eventBusComponent.off(CUSTOM_EVENTS.SHIP_HIT, this.onDamageTaken, this);
        this.scene.events.off('destroy', this.cleanup, this);
    }
}
