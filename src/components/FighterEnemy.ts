import * as Phaser from 'phaser';
import { Enemy } from './Enemy';
import { BotFighterInputComponent } from './input/BotFighterInputComponent';
import * as GameConfig from '../config/GameConfig';

export class FighterEnemy extends Enemy {
    private fighterInput: BotFighterInputComponent;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Create fighter input component
        const fighterInput = new BotFighterInputComponent();

        // Call parent constructor with fighter-specific settings
        super(scene, x, y, 'enemyRed1', fighterInput, GameConfig.ENEMY_FIGHTER_HEALTH);

        this.fighterInput = fighterInput;

        // Add weapon to fighter enemy
        const bulletConfig = {
            maxCount: GameConfig.ENEMY_FIGHTER_BULLET_MAX_COUNT,
            interval: GameConfig.ENEMY_FIGHTER_BULLET_INTERVAL,
            speed: GameConfig.ENEMY_FIGHTER_BULLET_SPEED,
            lifespan: GameConfig.ENEMY_FIGHTER_BULLET_LIFESPAN,
            yOffset: 20, // Offset bullets to appear below the ship
            flipY: true  // Enemy bullets go downward
        };

        this.addWeapon(bulletConfig);
    }

    protected updateMovement(): void {
        // Update fighter input
        this.fighterInput.update();

        // Apply fighter-specific movement (straight down)
        this.velocity.x = 0;
        this.velocity.y = GameConfig.ENEMY_FIGHTER_MOVEMENT_VERTICAL_VELOCITY;
    }
}
