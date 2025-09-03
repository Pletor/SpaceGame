import * as Phaser from 'phaser';
import { Enemy } from './Enemy';
import { BotScoutInputComponent } from './input/BotScoutInputComponent';
import * as GameConfig from '../config/GameConfig';

export class ScoutEnemy extends Enemy {
    private scoutInput: BotScoutInputComponent;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Create a temporary input component for the parent constructor
        const tempInput = new BotScoutInputComponent();

        // Call parent constructor with scout-specific settings
        super(scene, x, y, 'enemyBlue1', tempInput, GameConfig.ENEMY_SCOUT_HEALTH);

        // Now set up the scout input component properly
        this.scoutInput = tempInput;
        this.scoutInput.setGameObject(this);
        this.scoutInput.startXPosition = x;
    }

    protected updateMovement(): void {
        // Update scout input to handle wave movement
        this.scoutInput.update();

        // Apply scout-specific movement
        this.velocity.x = 0;
        this.velocity.y = GameConfig.ENEMY_SCOUT_MOVEMENT_VERTICAL_VELOCITY;

        if (this.inputComponent.leftIsDown) {
            this.velocity.x = -GameConfig.ENEMY_SCOUT_MOVEMENT_HORIZONTAL_VELOCITY;
        }
        if (this.inputComponent.rightIsDown) {
            this.velocity.x = GameConfig.ENEMY_SCOUT_MOVEMENT_HORIZONTAL_VELOCITY;
        }
    }
}
