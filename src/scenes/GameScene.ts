import * as Phaser from 'phaser';
import { Player } from '../objects/Player';
import { EventBusComponent, CUSTOM_EVENTS } from '../components/events/EventBusComponent';
import { AsteroidSpawnerComponent } from '../components/AsteroidSpawnerComponent';
import { ScoreComponent } from '../components/ui/ScoreComponent';
import { LivesComponent } from '../components/ui/LivesComponent';
import { CooldownBarComponent } from '../components/ui/CooldownBarComponent';
import { AmmoDisplayComponent } from '../components/ui/AmmoDisplayComponent';
import { AudioControlMenu } from '../components/ui/AudioControlMenu';
import { ShieldDisplayComponent } from '../components/ui/ShieldDisplayComponent';
import { AudioManagerComponent } from '../components/audio/AudioManagerComponent';
import * as Config from '../config/GameConfig';

export class GameScene extends Phaser.Scene {
    private player!: Player;
    private eventBusComponent!: EventBusComponent;
    private asteroidSpawner!: AsteroidSpawnerComponent;
    private scoreComponent!: ScoreComponent;
    private livesComponent!: LivesComponent;
    private cooldownBar!: CooldownBarComponent;
    private ammoDisplay!: AmmoDisplayComponent;
    private shieldDisplay!: ShieldDisplayComponent;
    private audioManager!: AudioManagerComponent;
    private audioControlMenu!: AudioControlMenu;

    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        console.log('Game scene loaded');

        // Clean up any existing event listeners
        if (this.eventBusComponent) {
            this.eventBusComponent.removeAllListeners();
        }

        // Set world bounds to match screen size
        this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

        // Create static background
        this.createBackground();

        // Create event bus component for communication between components
        this.eventBusComponent = new EventBusComponent();

        // Create player at initial position (bottom center)
        this.player = new Player(this, this.eventBusComponent);

        // Create asteroid spawner
        this.asteroidSpawner = new AsteroidSpawnerComponent(this, this.eventBusComponent);
        this.asteroidSpawner.start();

        // Left side UI layout - score, lives, and ammo displays
        this.scoreComponent = new ScoreComponent(this, 40, 40, this.eventBusComponent);
        this.livesComponent = new LivesComponent(this, 40, 80, this.eventBusComponent);
        this.ammoDisplay = new AmmoDisplayComponent(this, 40, 130);

        // Right side UI layout - moved closer to edge and down for better visibility
        const rightX = this.scale.width - 260; // Closer to right edge
        this.cooldownBar = new CooldownBarComponent(this, rightX, 60, 240, 30, 10000); // Moved down
        this.shieldDisplay = new ShieldDisplayComponent(this, rightX, 150, this.eventBusComponent); // Moved down

                // Create audio manager and start background music
        this.audioManager = new AudioManagerComponent(this, this.eventBusComponent);

        // Start background music with user interaction fallback
        this.startBackgroundMusicWithFallback();

        // Create audio control menu (top right corner)
        this.audioControlMenu = new AudioControlMenu(this, this.audioManager, this.scale.width - 60, 220);

        // Set up collision detection
        this.setupCollisions();

        // Listen for player destroyed event to respawn player
        this.eventBusComponent.on(CUSTOM_EVENTS.PLAYER_DESTROYED, this.handlePlayerDestroyed, this);

        // Listen for game over event
        this.eventBusComponent.on(CUSTOM_EVENTS.GAME_OVER, this.handleGameOver, this);

        // Spawn player initially
        this.eventBusComponent.emit(CUSTOM_EVENTS.PLAYER_SPAWN);
    }

    update(time: number, deltaTime: number) {
        // Update asteroid spawner
        this.asteroidSpawner.update(deltaTime);

        // Update cooldown bar
        if (this.player && this.cooldownBar) {
            this.cooldownBar.updateCooldown(this.player.getSecondaryCooldown());
        }

        // Update ammo display
        if (this.player && this.ammoDisplay) {
            this.ammoDisplay.updatePrimaryAmmo(
                this.player.weaponComponent.getCurrentAmmo(),
                this.player.weaponComponent.getMaxAmmo()
            );
            this.ammoDisplay.updateSecondaryAmmo(
                this.player.secondaryWeaponComponent.getCurrentAmmo(),
                this.player.secondaryWeaponComponent.getMaxAmmo()
            );
        }
    }

    private createBackground() {
        // Create main background - use the black space background
        this.add.image(0, 0, 'black')
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);
    }

    private setupCollisions() {
        // Player vs Asteroids collision - when player hits asteroid, respawn player at initial position
        this.physics.add.overlap(
            this.player,
            this.asteroidSpawner.asteroidGroup,
            this.handlePlayerAsteroidCollision,
            undefined,
            this
        );

        // Player bullets vs Asteroids collision - asteroids can be destroyed by shooting
        this.physics.add.overlap(
            this.asteroidSpawner.asteroidGroup,
            this.player.weaponGameObjectGroup,
            this.handleAsteroidProjectileCollision,
            undefined,
            this
        );

        // Player secondary bullets vs Asteroids collision
        this.physics.add.overlap(
            this.asteroidSpawner.asteroidGroup,
            this.player.secondaryWeaponGameObjectGroup,
            this.handleAsteroidSecondaryProjectileCollision,
            undefined,
            this
        );
    }

    private handlePlayerDestroyed(): void {
        console.log('Player destroyed - lives system will handle respawn');
        // LivesComponent now handles respawn logic based on remaining lives
    }

    private startBackgroundMusicWithFallback(): void {
        // Try to start music immediately
        this.audioManager.startBackgroundMusic();

        // Set up fallback for user interaction
        const startMusicOnInteraction = () => {
            this.audioManager.startBackgroundMusic();
            // Remove listeners after first successful start
            this.input.off('pointerdown', startMusicOnInteraction);
            this.input.keyboard?.off('keydown', startMusicOnInteraction);
        };

        // Listen for any user interaction to start music
        this.input.once('pointerdown', startMusicOnInteraction);
        this.input.keyboard?.once('keydown', startMusicOnInteraction);
    }

    private handlePlayerAsteroidCollision(player: any, asteroid: any) {
        if (!player.active || !asteroid.active) return;

        // Properly destroy asteroid with health bar cleanup
        if (asteroid.destroyAsteroid) {
            asteroid.destroyAsteroid();
        } else {
            // Fallback for other asteroid types
            if (asteroid.healthBarComponent) {
                asteroid.healthBarComponent.destroy();
                asteroid.healthBarComponent = undefined;
            }
            asteroid.setActive(false);
            asteroid.setVisible(false);
        }

        // Player collides with asteroid - player gets hit and respawns
        // The ColliderComponent will handle the SHIP_HIT event emission
        if (player.colliderComponent) {
            player.colliderComponent.collideWithEnemyShip();
        }
    }

    private handleAsteroidProjectileCollision(asteroid: any, projectile: any) {
        if (!asteroid.active || !projectile.active) return;

        // Hit the asteroid with primary weapon (1 damage)
        if (asteroid.takeDamage) {
            asteroid.takeDamage();
        }

        // Destroy the bullet
        if (this.player && this.player.weaponComponent) {
            this.player.weaponComponent.destroyBullet(projectile);
        }

        // Check if asteroid is destroyed
        if (asteroid.healthComponent && asteroid.healthComponent.isDeadState) {
            // Store score value before destroying
            const scoreValue = asteroid.getScoreValue ? asteroid.getScoreValue() : 100;

            // Properly destroy asteroid with health bar cleanup
            if (asteroid.destroyAsteroid) {
                asteroid.destroyAsteroid();
            } else {
                asteroid.setActive(false);
                asteroid.setVisible(false);
            }

            // Play asteroid destruction sound
            this.eventBusComponent.emit(CUSTOM_EVENTS.ENEMY_DESTROYED, asteroid);

            // Add score for destroying asteroid
            this.eventBusComponent.emit(CUSTOM_EVENTS.SCORE_CHANGE, scoreValue);
        }
    }

    private handleAsteroidSecondaryProjectileCollision(asteroid: any, projectile: any) {
        if (!asteroid.active || !projectile.active) return;

        // Hit the asteroid with secondary weapon (2 damage)
        if (asteroid.takeDamage) {
            asteroid.takeDamage();
            asteroid.takeDamage(); // Second hit for double damage
        }

        // Destroy the bullet
        if (this.player && this.player.secondaryWeaponComponent) {
            this.player.secondaryWeaponComponent.destroyBullet(projectile);
        }

        // Check if asteroid is destroyed
        if (asteroid.healthComponent && asteroid.healthComponent.isDeadState) {
            // Store score value before destroying
            const scoreValue = asteroid.getScoreValue ? asteroid.getScoreValue() : 200;

            // Properly destroy asteroid with health bar cleanup
            if (asteroid.destroyAsteroid) {
                asteroid.destroyAsteroid();
            } else {
                asteroid.setActive(false);
                asteroid.setVisible(false);
            }

            // Play asteroid destruction sound
            this.eventBusComponent.emit(CUSTOM_EVENTS.ENEMY_DESTROYED, asteroid);

            // Add score for destroying asteroid
            this.eventBusComponent.emit(CUSTOM_EVENTS.SCORE_CHANGE, scoreValue);
        }
    }

    private handleGameOver(): void {
        console.log('Game Over triggered');

        // Stop all game activity
        if (this.asteroidSpawner) {
            this.asteroidSpawner.stop();
        }

        // Stop player updates
        if (this.player) {
            this.player.setActive(false);
        }

        // Stop background music
        if (this.audioManager) {
            this.audioManager.stopBackgroundMusic();
        }

        // Create semi-transparent overlay
        const overlay = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            0x000000,
            0.8
        );
        overlay.setDepth(1000);

        // Game Over title
        const gameOverText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 - 100,
            'GAME OVER',
            {
                fontSize: '64px',
                color: '#ff0000',
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        gameOverText.setDepth(1001);

        // Final score
        const finalScore = this.scoreComponent ? this.scoreComponent.getScore() : 0;
        const scoreText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 - 20,
            `Final Score: ${finalScore}`,
            {
                fontSize: '32px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5);
        scoreText.setDepth(1001);

        // Restart instructions
        const restartText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 + 40,
            'Press R to Restart',
            {
                fontSize: '24px',
                color: '#00ff00',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5);
        restartText.setDepth(1001);

        // Listen for restart key
        const restartKey = this.input.keyboard?.addKey('R');
        if (restartKey) {
            restartKey.on('down', () => {
                console.log('Restarting game...');
                this.scene.restart();
            });
        }
    }
}
