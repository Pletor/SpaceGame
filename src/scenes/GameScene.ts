/**
 * Hlavní herní scéna - řídí celý průběh hry
 *
 * Funkce:
 * - Orchestruje všechny herní systémy (hráč, asteroidy, UI, audio)
 * - Řeší kolize mezi objekty
 * - Zobrazuje herní UI (skóre, životy, munice, štíty)
 * - Spravuje restart hry a game over stav
 *
 * Princip:
 * Event-driven architektura - komponenty komunikují přes EventBusComponent
 * Všechny UI prvky jsou umístěny strategicky pro lepší UX
 * Kolize jsou řešeny centrálně v této scéně
 */

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

export class GameScene extends Phaser.Scene {
    // Hlavní herní objekty
    private player!: Player;
    private eventBusComponent!: EventBusComponent;
    private asteroidSpawner!: AsteroidSpawnerComponent;

    // UI komponenty
    private scoreComponent!: ScoreComponent;
    private livesComponent!: LivesComponent;
    private cooldownBar!: CooldownBarComponent;
    private ammoDisplay!: AmmoDisplayComponent;
    private shieldDisplay!: ShieldDisplayComponent;
    private audioControlMenu!: AudioControlMenu;

    // Audio systém
    private audioManager!: AudioManagerComponent;

    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        console.log('Herní scéna načtena');

        // Vyčistit existující event listenery
        if (this.eventBusComponent) {
            this.eventBusComponent.removeAllListeners();
        }

        // Nastavit hranice světa podle velikosti obrazovky
        this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

        // Vytvořit statické pozadí
        this.createBackground();

        // Vytvořit event bus pro komunikaci mezi komponentami
        this.eventBusComponent = new EventBusComponent();

        // Vytvořit hráče na počáteční pozici (střed dole)
        this.player = new Player(this, this.eventBusComponent);

        // Vytvořit spawner asteroidů
        this.asteroidSpawner = new AsteroidSpawnerComponent(this, this.eventBusComponent);
        this.asteroidSpawner.start();

        // Inicializovat UI komponenty
        this.initializeUIComponents();

        // Vytvořit audio manager a spustit hudbu
        this.audioManager = new AudioManagerComponent(this, this.eventBusComponent);
        this.startBackgroundMusicWithFallback();

        // Vytvořit ovládání audia (pravý horní roh)
        this.audioControlMenu = new AudioControlMenu(this, this.audioManager, this.scale.width - 60, 220);

        // Nastavit detekci kolizí
        this.setupCollisions();

        // Nastavit event listenery
        this.setupEventListeners();

        // Spawnout hráče na začátku
        this.eventBusComponent.emit(CUSTOM_EVENTS.PLAYER_SPAWN);
    }

    update(time: number, deltaTime: number) {
        // Aktualizovat spawner asteroidů
        this.asteroidSpawner.update(deltaTime);

        // Aktualizovat cooldown bar
        if (this.player && this.cooldownBar) {
            this.cooldownBar.updateCooldown(this.player.getSecondaryCooldown());
        }

        // Aktualizovat displej munice
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

    /**
     * Inicializuje všechny UI komponenty na správných pozicích
     */
    private initializeUIComponents(): void {
        // Levá strana UI - skóre, životy a munice
        this.scoreComponent = new ScoreComponent(this, 40, 40, this.eventBusComponent);
        this.livesComponent = new LivesComponent(this, 40, 80, this.eventBusComponent);
        this.ammoDisplay = new AmmoDisplayComponent(this, 40, 130);

        // Pravá strana UI - blíže k okraji pro lepší viditelnost
        const rightX = this.scale.width - 260;
        this.cooldownBar = new CooldownBarComponent(this, rightX, 60, 240, 30, 10000);
        this.shieldDisplay = new ShieldDisplayComponent(this, rightX, 150, this.eventBusComponent);
    }

    /**
     * Nastaví event listenery pro herní události
     */
    private setupEventListeners(): void {
        // Poslouchat událost zničení hráče
        this.eventBusComponent.on(CUSTOM_EVENTS.PLAYER_DESTROYED, this.handlePlayerDestroyed, this);

        // Poslouchat událost game over
        this.eventBusComponent.on(CUSTOM_EVENTS.GAME_OVER, this.handleGameOver, this);
    }

    /**
     * Vytvoří jednoduché černé pozadí
     */
    private createBackground(): void {
        this.add.image(0, 0, 'black')
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);
    }

    /**
     * Nastaví všechny typy kolizí ve hře
     */
    private setupCollisions(): void {
        // Kolize hráč vs asteroidy - při kolizi se hráč respawnuje
        this.physics.add.overlap(
            this.player,
            this.asteroidSpawner.asteroidGroup,
            this.handlePlayerAsteroidCollision,
            undefined,
            this
        );

        // Kolize střely hráče vs asteroidy - asteroidy mohou být zničeny střelbou
        this.physics.add.overlap(
            this.asteroidSpawner.asteroidGroup,
            this.player.weaponGameObjectGroup,
            this.handleAsteroidProjectileCollision,
            undefined,
            this
        );

        // Kolize sekundární střely hráče vs asteroidy
        this.physics.add.overlap(
            this.asteroidSpawner.asteroidGroup,
            this.player.secondaryWeaponGameObjectGroup,
            this.handleAsteroidSecondaryProjectileCollision,
            undefined,
            this
        );

        // Nastavit obecnou kolizní detekci pro power-upy
        this.setupPowerUpCollisions();
    }

    /**
     * Nastaví kolizní detekci pro power-upy
     */
    private setupPowerUpCollisions(): void {
        // Periodická kontrola kolizí s power-upy
        this.time.addEvent({
            delay: 50, // Kontrola každých 50ms
            callback: this.checkPowerUpCollisions,
            callbackScope: this,
            loop: true
        });
    }

    /**
     * Kontrola kolizí mezi hráčem a power-upy
     */
    private checkPowerUpCollisions(): void {
        if (!this.player || !this.player.active) return;

        // Najít všechny ShieldPowerUp objekty ve scéně - použít lepší detekci
        const powerUps = this.children.list.filter(child => {
            // Zkontrolovat více způsobů identifikace ShieldPowerUp
            return (child.constructor.name === 'ShieldPowerUp' ||
                   (child as any).texture?.key === 'powerupBlue_shield' ||
                   (child as any).isPowerUp === true) &&
                   (child as any).active;
        });

        powerUps.forEach((powerUp: any) => {
            // Kontrola vzdálenosti pro kolizi - zvětšený poloměr pro snadnější sebrání
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                powerUp.x, powerUp.y
            );

            if (distance < 60) { // Zvětšeno z 40px na 60px pro snadnější sebrání
                console.log('Power-up collected at distance:', distance);
                powerUp.collect();
            }
        });
    }

    /**
     * Zpracovává událost zničení hráče
     */
    private handlePlayerDestroyed(): void {
        console.log('Hráč zničen - systém životů řeší respawn');
        // LivesComponent nyní řeší logiku respawnu na základě zbývajících životů
    }

    /**
     * Spustí hudbu na pozadí s fallbackem pro uživatelskou interakci
     */
    private startBackgroundMusicWithFallback(): void {
        // Pokusit se spustit hudbu okamžitě
        this.audioManager.startBackgroundMusic();

        // Nastavit fallback pro uživatelskou interakci
        const startMusicOnInteraction = () => {
            this.audioManager.startBackgroundMusic();
            // Odstranit listenery po prvním úspěšném spuštění
            this.input.off('pointerdown', startMusicOnInteraction);
            this.input.keyboard?.off('keydown', startMusicOnInteraction);
        };

        // Poslouchat jakoukoliv uživatelskou interakci pro spuštění hudby
        this.input.once('pointerdown', startMusicOnInteraction);
        this.input.keyboard?.once('keydown', startMusicOnInteraction);
    }

    /**
     * Zpracovává kolizi hráče s asteroidem
     */
    private handlePlayerAsteroidCollision(player: any, asteroid: any): void {
        if (!player.active || !asteroid.active) return;

        // Ignorovat kolize s fragmenty asteroidů (shardy)
        if (asteroid.isAsteroidShard) {
            return; // Shardy nekolidují s hráčem
        }

        // Zkontrolovat dočasný štít
        if (player.tempShieldComponent && player.tempShieldComponent.isShieldActive) {
            console.log('Kolize blokována dočasným štítem!');
            // Správně zničit asteroid bez poškození hráče
            this.destroyAsteroidProperly(asteroid);
            return; // Štít absorbnul zásah
        }

        // Správně zničit asteroid s vyčištěním health baru
        this.destroyAsteroidProperly(asteroid);

        // Hráč kolliduje s asteroidem - hráč dostane zásah a respawnuje se
        // ColliderComponent zpracuje emisi SHIP_HIT eventu
        if (player.colliderComponent) {
            player.colliderComponent.collideWithEnemyShip();
        }
    }

    /**
     * Zpracovává kolizi asteroidu s primární střelou
     */
    private handleAsteroidProjectileCollision(asteroid: any, projectile: any): void {
        if (!asteroid.active || !projectile.active) return;

        // Zasáhnout asteroid primární zbraní (1 damage)
        if (asteroid.takeDamage) {
            asteroid.takeDamage();
        }

        // Zničit střelu
        if (this.player && this.player.weaponComponent) {
            this.player.weaponComponent.destroyBullet(projectile);
        }

        // Zkontrolovat, zda je asteroid zničen
        this.checkAsteroidDestruction(asteroid, 100);
    }

    /**
     * Zpracovává kolizi asteroidu se sekundární střelou
     */
    private handleAsteroidSecondaryProjectileCollision(asteroid: any, projectile: any): void {
        if (!asteroid.active || !projectile.active) return;

        // Zasáhnout asteroid sekundární zbraní (2 damage)
        if (asteroid.takeDamage) {
            asteroid.takeDamage();
            asteroid.takeDamage(); // Druhý zásah pro dvojnásobné poškození
        }

        // Zničit střelu
        if (this.player && this.player.secondaryWeaponComponent) {
            this.player.secondaryWeaponComponent.destroyBullet(projectile);
        }

        // Zkontrolovat, zda je asteroid zničen
        this.checkAsteroidDestruction(asteroid, 200);
    }

    /**
     * Správně zničí asteroid s vyčištěním všech komponent
     */
    private destroyAsteroidProperly(asteroid: any): void {
        if (asteroid.destroyAsteroid) {
            asteroid.destroyAsteroid();
        } else {
            // Fallback pro jiné typy asteroidů
            if (asteroid.healthBarComponent) {
                asteroid.healthBarComponent.destroy();
                asteroid.healthBarComponent = undefined;
            }
            asteroid.setActive(false);
            asteroid.setVisible(false);
        }
    }

    /**
     * Zkontroluje, zda je asteroid zničen a zpracuje následky
     */
    private checkAsteroidDestruction(asteroid: any, scoreValue: number): void {
        if (asteroid.healthComponent && asteroid.healthComponent.isDeadState) {
            // Uložit skóre před zničením
            const actualScoreValue = asteroid.getScoreValue ? asteroid.getScoreValue() : scoreValue;

            // Emitovat ENEMY_DESTROYED event pro spuštění shatter efektu
            if (asteroid.eventBusComponent) {
                asteroid.eventBusComponent.emit(CUSTOM_EVENTS.ENEMY_DESTROYED, asteroid);
            }

            // Přidat skóre za zničení asteroidu
            this.eventBusComponent.emit(CUSTOM_EVENTS.SCORE_CHANGE, actualScoreValue);
        }
    }

    /**
     * Zpracovává stav Game Over
     */
    private handleGameOver(): void {
        console.log('Game Over spuštěn');

        // Zastavit všechnu herní aktivitu
        this.stopGameActivity();

        // Vytvořit poloprůhledný overlay
        const overlay = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            0x000000,
            0.8
        );
        overlay.setDepth(1000);

        // Zobrazit Game Over UI
        this.displayGameOverUI();

        // Nastavit restart funkcionalitu
        this.setupRestartFunctionality();
    }

    /**
     * Zastaví všechnu herní aktivitu
     */
    private stopGameActivity(): void {
        if (this.asteroidSpawner) {
            this.asteroidSpawner.stop();
        }

        if (this.player) {
            this.player.setActive(false);
        }

        if (this.audioManager) {
            this.audioManager.stopBackgroundMusic();
        }
    }

    /**
     * Zobrazí Game Over UI elementy
     */
    private displayGameOverUI(): void {
        // Game Over nadpis
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

        // Finální skóre
        const finalScore = this.scoreComponent ? this.scoreComponent.getScore() : 0;
        const scoreText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 - 20,
            `Finální skóre: ${finalScore}`,
            {
                fontSize: '32px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5);
        scoreText.setDepth(1001);

        // Instrukce pro restart
        const restartText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 + 40,
            'Stiskni R pro restart',
            {
                fontSize: '24px',
                color: '#00ff00',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5);
        restartText.setDepth(1001);
    }

    /**
     * Nastaví funkcionalitu restartu hry
     */
    private setupRestartFunctionality(): void {
        const restartKey = this.input.keyboard?.addKey('R');
        if (restartKey) {
            restartKey.on('down', () => {
                console.log('Restartování hry...');
                this.scene.restart();
            });
        }
    }
}
