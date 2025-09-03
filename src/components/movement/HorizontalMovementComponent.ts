import * as Phaser from 'phaser';
import { InputComponent } from '../input/InputComponent';

export class HorizontalMovementComponent {
    private gameObject: Phaser.Physics.Arcade.Sprite | Phaser.GameObjects.Container;
    private inputComponent: InputComponent;
    private velocity: number;

    constructor(gameObject: Phaser.Physics.Arcade.Sprite | Phaser.GameObjects.Container, inputComponent: InputComponent, velocity: number) {
        this.gameObject = gameObject;
        this.inputComponent = inputComponent;
        this.velocity = velocity;

        // Set up physics properties
        const body = this.gameObject.body as Phaser.Physics.Arcade.Body;
        body.setMaxVelocity(500, 500); // Allow both horizontal and vertical movement
        body.setDamping(true);
        body.setDrag(0.1, 0.1);
    }

    public update(): void {
        const body = this.gameObject.body as Phaser.Physics.Arcade.Body;

        if (this.inputComponent.leftIsDown) {
            body.setVelocityX(-this.velocity);
        } else if (this.inputComponent.rightIsDown) {
            body.setVelocityX(this.velocity);
        } else {
            // Only reset X velocity if not moving horizontally
            if (Math.abs(body.velocity.x) > 0) {
                body.setVelocityX(0);
            }
        }
    }

    public reset(): void {
        const body = this.gameObject.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(0);
        body.setAngularVelocity(0);
    }
}
