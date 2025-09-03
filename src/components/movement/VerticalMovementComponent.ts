/**
 * Vertical Movement Component - řídí vertikální pohyb objektů
 *
 * Funkce:
 * - Řídí vertikální pohyb na základě vstupu (nahoru/dolů)
 * - Nastavuje fyzikální vlastnosti pro smooth movement
 * - Poskytuje reset funkcionalitu pro spawn
 * - Pracuje v tandemu s HorizontalMovementComponent
 *
 * Princip:
 * Input-driven movement - reaguje na klávesy W/S nebo šipky
 * Physics-based pohyb s damping pro realistic feel
 * Immediate response na vstup pro přesné ovládání
 */

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

        // Nastavit fyzikální vlastnosti
        this.setupPhysicsProperties();
    }

    /**
     * Nastaví fyzikální vlastnosti objektu
     */
    private setupPhysicsProperties(): void {
        const body = this.gameObject.body as Phaser.Physics.Arcade.Body;
        body.setMaxVelocity(500, 500); // Povolit plný pohyb
        body.setDamping(true);
        body.setDrag(0.1, 0.1);
    }

    /**
     * Aktualizuje vertikální pohyb na základě vstupu
     */
    public update(): void {
        const body = this.gameObject.body as Phaser.Physics.Arcade.Body;

        if (this.inputComponent.downIsDown) {
            body.setVelocityY(this.velocity);
        } else if (this.inputComponent.upIsDown) {
            body.setVelocityY(-this.velocity);
        } else {
            // Reset pouze Y velocity pokud se nepohybujeme vertikálně
            if (Math.abs(body.velocity.y) > 0) {
                body.setVelocityY(0);
            }
        }
    }

    /**
     * Resetuje pohyb objektu - používá se při spawnu
     */
    public reset(): void {
        const body = this.gameObject.body as Phaser.Physics.Arcade.Body;
        body.setVelocityY(0);
        body.setAngularVelocity(0);
    }
}
