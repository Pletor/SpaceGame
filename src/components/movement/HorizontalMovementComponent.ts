/**
 * Horizontal Movement Component - řídí horizontální pohyb objektů
 *
 * Funkce:
 * - Řídí horizontální pohyb na základě vstupu
 * - Nastavuje fyzikální vlastnosti jako drag a max velocity
 * - Poskytuje reset funkcionalitu pro spawn
 * - Podporuje různé typy game objektů (Sprite i Container)
 *
 * Princip:
 * Input-driven movement - reaguje na stisk kláves
 * Physics-based pohyb s realistic damping
 * Immediate response na vstup pro responsive ovládání
 */

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

        // Nastavit fyzikální vlastnosti
        this.setupPhysicsProperties();
    }

    /**
     * Nastaví fyzikální vlastnosti objektu
     */
    private setupPhysicsProperties(): void {
        const body = this.gameObject.body as Phaser.Physics.Arcade.Body;
        body.setMaxVelocity(500, 500); // Povolit horizontální i vertikální pohyb
        body.setDamping(true);
        body.setDrag(0.1, 0.1);
    }

    /**
     * Aktualizuje horizontální pohyb na základě vstupu
     */
    public update(): void {
        const body = this.gameObject.body as Phaser.Physics.Arcade.Body;

        if (this.inputComponent.leftIsDown) {
            body.setVelocityX(-this.velocity);
        } else if (this.inputComponent.rightIsDown) {
            body.setVelocityX(this.velocity);
        } else {
            // Reset pouze X velocity pokud se nepohybujeme horizontálně
            if (Math.abs(body.velocity.x) > 0) {
                body.setVelocityX(0);
            }
        }
    }

    /**
     * Resetuje pohyb objektu - používá se při spawnu
     */
    public reset(): void {
        const body = this.gameObject.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(0);
        body.setAngularVelocity(0);
    }
}
