import * as Phaser from 'phaser';
import { InputComponent } from '../input/InputComponent';

export class VerticalMovementComponent {
    private gameObject: Phaser.Physics.Arcade.Sprite | Phaser.GameObjects.Container;
    private inputComponent: InputComponent;
    private velocity: number;

    constructor(gameObject: Phaser.Physics.Arcade.Sprite | Phaser.GameObjects.Container, inputComponent: InputComponent, velocity: number) {
        this.gameObject = gameObject;
        this.inputComponent = inputComponent;
        this.velocity = velocity;

        // Set up physics properties
        const body = this.gameObject.body as Phaser.Physics.Arcade.Body;
        body.setMaxVelocity(500, 500); // Allow full movement
        body.setDamping(true);
        body.setDrag(0.1, 0.1);
    }

    public update(): void {
        const body = this.gameObject.body as Phaser.Physics.Arcade.Body;

        if (this.inputComponent.downIsDown) {
            body.setVelocityY(this.velocity);
        } else if (this.inputComponent.upIsDown) {
            body.setVelocityY(-this.velocity);
        } else {
            // Only reset Y velocity if not moving vertically
            if (Math.abs(body.velocity.y) > 0) {
                body.setVelocityY(0);
            }
        }
    }

    public reset(): void {
        const body = this.gameObject.body as Phaser.Physics.Arcade.Body;
        body.setVelocityY(0);
        body.setAngularVelocity(0);
    }
}
