import * as Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // Load progress bar background
        this.add.rectangle(400, 300, 320, 50, 0x000000);
        this.add.rectangle(400, 300, 300, 30, 0x333333);

        // Progress bar
        const progressBar = this.add.rectangle(400, 300, 0, 30, 0x00ff00);

        // Loading text
        const loadingText = this.add.text(400, 260, 'Loading...', {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Update progress bar
        this.load.on('progress', (value: number) => {
            progressBar.width = 300 * value;
        });

        this.load.on('complete', () => {
            loadingText.setText('Complete!');
        });

        // Load all game assets manually
        this.loadAssets();
    }

    private loadAssets() {
        // Load player ship
        this.load.image('playerShip1_blue', 'assets/sprites/game/playerShip1_blue.png');

        // Load player ship damage states
        this.load.image('playerShip1_damage1', 'assets/sprites/game/Damage/playerShip1_damage1.png');
        this.load.image('playerShip1_damage2', 'assets/sprites/game/Damage/playerShip1_damage2.png');
        this.load.image('playerShip1_damage3', 'assets/sprites/game/Damage/playerShip1_damage3.png');

        // Load ship parts
        this.load.image('shipEngine', 'assets/sprites/game/Parts/engine1.png');

        // Load engine thrust animation frames
        for (let i = 0; i < 20; i++) {
            const frameNumber = i.toString().padStart(2, '0');
            this.load.image(`fire${frameNumber}`, `assets/sprites/game/Effects/fire${frameNumber}.png`);
        }

        // Load weapons
        this.load.image('laserBlue01', 'assets/sprites/game/Lasers/laserBlue01.png');

        // Load backgrounds
        this.load.image('black', 'assets/sprites/game/Backgrounds/black.png');
        this.load.image('blue', 'assets/sprites/game/Backgrounds/blue.png');
        this.load.image('darkPurple', 'assets/sprites/game/Backgrounds/darkPurple.png');
        this.load.image('purple', 'assets/sprites/game/Backgrounds/purple.png');

        // Load enemies
        this.load.image('enemyBlack1', 'assets/sprites/game/Enemies/enemyBlack1.png');
        this.load.image('enemyBlue1', 'assets/sprites/game/Enemies/enemyBlue1.png');
        this.load.image('enemyRed1', 'assets/sprites/game/Enemies/enemyRed1.png');
        this.load.image('enemyGreen1', 'assets/sprites/game/Enemies/enemyGreen1.png');
        this.load.image('enemyBlack2', 'assets/sprites/game/Enemies/enemyBlack2.png');
        this.load.image('enemyBlue2', 'assets/sprites/game/Enemies/enemyBlue2.png');
        this.load.image('enemyRed2', 'assets/sprites/game/Enemies/enemyRed2.png');
        this.load.image('enemyGreen2', 'assets/sprites/game/Enemies/enemyGreen2.png');

        // Load meteors/asteroids
        this.load.image('meteor1', 'assets/sprites/game/Meteors/meteorBrown_big1.png');
        this.load.image('meteor2', 'assets/sprites/game/Meteors/meteorBrown_big2.png');
        this.load.image('meteor3', 'assets/sprites/game/Meteors/meteorGrey_big1.png');
        this.load.image('meteor4', 'assets/sprites/game/Meteors/meteorGrey_big2.png');
        this.load.image('meteorMed1', 'assets/sprites/game/Meteors/meteorBrown_med1.png');
        this.load.image('meteorMed2', 'assets/sprites/game/Meteors/meteorGrey_med2.png');
        this.load.image('meteorSmall1', 'assets/sprites/game/Meteors/meteorBrown_small1.png');
        this.load.image('meteorSmall2', 'assets/sprites/game/Meteors/meteorGrey_small2.png');

        // Load effects
        this.load.image('explosion', 'assets/sprites/game/Effects/fire01.png');
        this.load.image('shield1', 'assets/sprites/game/Effects/shield1.png');
        this.load.image('shield2', 'assets/sprites/game/Effects/shield2.png');
        this.load.image('shield3', 'assets/sprites/game/Effects/shield3.png');

        // Load power-ups
        this.load.image('powerupBlue_shield', 'assets/sprites/game/Power-ups/powerupBlue_shield.png');
        this.load.image('powerupGreen_shield', 'assets/sprites/game/Power-ups/powerupGreen_shield.png');
        this.load.image('powerupYellow_shield', 'assets/sprites/game/Power-ups/powerupYellow_shield.png');
        this.load.image('powerupRed_shield', 'assets/sprites/game/Power-ups/powerupRed_shield.png');

        // Load audio
        console.log('PreloadScene: Loading audio files...');
        this.load.audio('explosion', [
            'assets/sounds/sfx_lose.mp3',
            'assets/sounds/sfx_lose.ogg'
        ]);
        this.load.audio('shot1', [
            'assets/sounds/sfx_laser1.mp3',
            'assets/sounds/sfx_laser1.ogg'
        ]);
        this.load.audio('shot2', [
            'assets/sounds/sfx_laser2.mp3',
            'assets/sounds/sfx_laser2.ogg'
        ]);
        this.load.audio('hit', [
            'assets/sounds/sfx_shieldDown.mp3',
            'assets/sounds/sfx_shieldDown.ogg'
        ]);
        this.load.audio('shieldUp', [
            'assets/sounds/sfx_shieldUp.mp3',
            'assets/sounds/sfx_shieldUp.ogg'
        ]);
        this.load.audio('twoTone', [
            'assets/sounds/sfx_twoTone.mp3',
            'assets/sounds/sfx_twoTone.ogg'
        ]);
        this.load.audio('zap', [
            'assets/sounds/sfx_zap.mp3',
            'assets/sounds/sfx_zap.ogg'
        ]);
        console.log('PreloadScene: Loading background music...');
        this.load.audio('bg', [
            'assets/music/background_loop.mp3',
            'assets/music/background_loop.ogg'
        ]);
    }

    create() {
        console.log('Preload scene loaded');
        console.log('Checking if bg audio exists:', this.sound.get('bg') ? 'YES' : 'NO');

        // Create animations from JSON data
        this.createAnimations();

        this.scene.start('GameScene');
    }

    private createAnimations() {
        const data = this.cache.json.get('animationsJSON');

        // Check if animation data exists
        if (!data) {
            console.error('animationsJSON not found in cache');
            return;
        }

        if (!Array.isArray(data)) {
            console.error('animationsJSON is not an array:', data);
            return;
        }

        data.forEach((animationConfig: any) => {
            let frames: Phaser.Types.Animations.AnimationFrame[];

            // Check if the texture exists
            if (!this.textures.exists(animationConfig.assetKey)) {
                console.warn(`Texture ${animationConfig.assetKey} not found, skipping animation ${animationConfig.key}`);
                return;
            }

            try {
                if (animationConfig.frames) {
                    frames = this.anims.generateFrameNumbers(animationConfig.assetKey, {
                        frames: animationConfig.frames
                    });
                } else {
                    // For simple images, create a single frame animation
                    frames = [{ key: animationConfig.assetKey, frame: null }];
                }

                this.anims.create({
                    key: animationConfig.key,
                    frames: frames,
                    frameRate: animationConfig.frameRate,
                    repeat: animationConfig.repeat
                });
            } catch (error) {
                console.warn(`Failed to create animation ${animationConfig.key}:`, error);
            }
        });

        // Vytvořit animaci engine thrust z fire efektů
        this.createEngineAnimations();

        // Vytvořit animaci štítu
        this.createShieldAnimations();
    }

    /**
     * Vytváří animace pro štít efekty
     */
    private createShieldAnimations(): void {
        // Vytvořit frames array pro shield animaci
        const shieldFrames: Phaser.Types.Animations.AnimationFrame[] = [
            { key: 'shield1', frame: null },
            { key: 'shield2', frame: null },
            { key: 'shield3', frame: null }
        ];

        // Vytvořit shield animaci
        this.anims.create({
            key: 'shieldPulsing',
            frames: shieldFrames,
            frameRate: 4, // 4 FPS pro jemnější, pomalejší animaci
            repeat: -1 // Nekonečná smyčka
        });

        console.log('Shield pulsing animation created');
    }

    /**
     * Vytváří animace pro engine thrust efekty
     */
    private createEngineAnimations(): void {
        // Vytvořit frames array pro fire animaci
        const fireFrames: Phaser.Types.Animations.AnimationFrame[] = [];

        for (let i = 0; i < 20; i++) {
            const frameNumber = i.toString().padStart(2, '0');
            fireFrames.push({ key: `fire${frameNumber}`, frame: null });
        }

        // Vytvořit engine thrust animaci
        this.anims.create({
            key: 'engineThrust',
            frames: fireFrames,
            frameRate: 15, // 15 FPS pro plynulý efekt
            repeat: -1 // Nekonečná smyčka
        });

        console.log('Engine thrust animation created with', fireFrames.length, 'frames');
    }
}
