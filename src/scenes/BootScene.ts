import * as Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Load animations JSON file that we need for preload scene
        this.load.json('animationsJSON', 'assets/data/animations.json');
    }

    create() {
        console.log('Boot scene loaded');
        this.scene.start('PreloadScene');
    }
}
