import * as Phaser from 'phaser';
import { InputComponent } from './InputComponent';

export class KeyboardInputComponent extends InputComponent {
    private cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
    private altKey: Phaser.Input.Keyboard.Key;

    constructor(scene: Phaser.Scene) {
        super();
        this.cursorKeys = scene.input.keyboard!.createCursorKeys();
        this.altKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ALT);
    }

    public update(): void {
        super.update();

        this.up = this.cursorKeys.up.isDown;
        this.down = this.cursorKeys.down.isDown;
        this.left = this.cursorKeys.left.isDown;
        this.right = this.cursorKeys.right.isDown;
        this.shoot = this.cursorKeys.space.isDown;
        this.shootSecondary = this.altKey.isDown;
    }
}
