import * as Phaser from 'phaser';
import { InputComponent } from '../input/InputComponent';
import * as Config from '../../config/GameConfig';

export class BotScoutInputComponent extends InputComponent {
    private gameObject?: Phaser.GameObjects.Container;
    private startX: number = 0;
    private maxXMovement: number;

    constructor(gameObject?: Phaser.GameObjects.Container) {
        super();
        this.gameObject = gameObject;
        this.startX = gameObject?.x || 0;
        this.maxXMovement = Config.ENEMY_SCOUT_MOVEMENT_MAX_X;

        // Start moving down and to the right
        this.down = true;
        this.right = true;
    }

    public set startXPosition(value: number) {
        this.startX = value;
    }

    public setGameObject(gameObject: Phaser.GameObjects.Container): void {
        this.gameObject = gameObject;
        this.startX = gameObject.x;
    }

    public update(): void {
        super.update();

        // Always move down
        this.down = true;

        // Wave pattern movement - only if we have a game object
        if (this.gameObject) {
            if (this.gameObject.x > this.startX + this.maxXMovement) {
                this.left = true;
                this.right = false;
            } else if (this.gameObject.x < this.startX - this.maxXMovement) {
                this.left = false;
                this.right = true;
            }
        }
    }
}
