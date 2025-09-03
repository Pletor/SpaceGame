import * as Phaser from 'phaser';
import { InputComponent } from '../input/InputComponent';

export class BotFighterInputComponent extends InputComponent {
    constructor() {
        super();

        // Always move down and shoot
        this.down = true;
        this.shoot = true;
    }

    public update(): void {
        super.update();

        // Always move down and shoot
        this.down = true;
        this.shoot = true;
    }
}
