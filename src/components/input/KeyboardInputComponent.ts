/**
 * Keyboard Input Component - zpracovává klávesnicový vstup
 *
 * Funkce:
 * - Mapuje klávesy na herní akce (pohyb, střelba)
 * - Podporuje primární a sekundární střelbu
 * - Rozšiřuje základní InputComponent
 * - Poskytuje responsive ovládání lodi
 *
 * Princip:
 * Direct key polling - kontroluje stav kláves každý frame
 * Cursor keys pro pohyb + Space a Alt pro střelbu
 * Abstrakce nad Phaser input systémem
 */

import * as Phaser from 'phaser';
import { InputComponent } from './InputComponent';

export class KeyboardInputComponent extends InputComponent {
    private cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
    private altKey: Phaser.Input.Keyboard.Key;

    constructor(scene: Phaser.Scene) {
        super();

        // Inicializovat klávesové mapování
        this.initializeKeyMapping(scene);
    }

    /**
     * Inicializuje mapování kláves
     */
    private initializeKeyMapping(scene: Phaser.Scene): void {
        this.cursorKeys = scene.input.keyboard!.createCursorKeys();
        this.altKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ALT);
    }

    /**
     * Aktualizuje stav všech kláves
     */
    public update(): void {
        super.update();

        // Mapovat klávesy na herní akce
        this.up = this.cursorKeys.up.isDown;
        this.down = this.cursorKeys.down.isDown;
        this.left = this.cursorKeys.left.isDown;
        this.right = this.cursorKeys.right.isDown;
        this.shoot = this.cursorKeys.space.isDown;
        this.shootSecondary = this.altKey.isDown;
    }
}
