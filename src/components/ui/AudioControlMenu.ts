import * as Phaser from 'phaser';
import { AudioManagerComponent } from '../audio/AudioManagerComponent';

export class AudioControlMenu {
    private scene: Phaser.Scene;
    private audioManager: AudioManagerComponent;
    private menuContainer: Phaser.GameObjects.Container;
    private isVisible: boolean = false;
    private x: number;
    private y: number;

    // UI elements
    private menuButton: Phaser.GameObjects.Text;
    private menuPanel: Phaser.GameObjects.Rectangle;
    private volumeSlider: Phaser.GameObjects.Rectangle;
    private volumeHandle: Phaser.GameObjects.Arc;
    private muteButton: Phaser.GameObjects.Text;
    private closeButton: Phaser.GameObjects.Text;

    private currentVolume: number = 0.5;
    private isDragging: boolean = false;

    constructor(scene: Phaser.Scene, audioManager: AudioManagerComponent, x?: number, y?: number) {
        this.scene = scene;
        this.audioManager = audioManager;
        this.x = x || scene.scale.width - 60;
        this.y = y || 20;

        this.createMenuButton();
        this.createMenuPanel();
        this.setupInteractions();
    }

    private createMenuButton(): void {
        // Create small music icon button at specified position
        this.menuButton = this.scene.add.text(
            this.x,
            this.y,
            '♪',
            {
                fontSize: '24px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }
        );
        this.menuButton.setOrigin(0.5);
        this.menuButton.setInteractive({ useHandCursor: true });
        this.menuButton.setDepth(1000);

        // Add hover effect
        this.menuButton.on('pointerover', () => {
            this.menuButton.setColor('#ffff00');
        });

        this.menuButton.on('pointerout', () => {
            this.menuButton.setColor('#ffffff');
        });

        this.menuButton.on('pointerdown', () => {
            this.toggleMenu();
        });
    }

    private createMenuPanel(): void {
        this.menuContainer = this.scene.add.container(0, 0);
        this.menuContainer.setDepth(1001);

        // Semi-transparent background panel
        this.menuPanel = this.scene.add.rectangle(
            this.x,
            this.y + 80,
            200,
            150,
            0x000000,
            0.8
        );
        this.menuPanel.setStrokeStyle(2, 0xffffff);

        // Volume label
        const volumeLabel = this.scene.add.text(
            this.x,
            this.y + 40,
            'Volume',
            {
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }
        );
        volumeLabel.setOrigin(0.5);

        // Volume slider background
        this.volumeSlider = this.scene.add.rectangle(
            this.x,
            this.y + 65,
            120,
            8,
            0x444444
        );

        // Volume slider handle
        this.volumeHandle = this.scene.add.circle(
            this.x - 60 + (this.currentVolume * 120),
            this.y + 65,
            8,
            0xffffff
        );
        this.volumeHandle.setInteractive({ draggable: true });

        // Mute button
        this.muteButton = this.scene.add.text(
            this.x,
            this.y + 95,
            'Mute',
            {
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }
        );
        this.muteButton.setOrigin(0.5);
        this.muteButton.setInteractive({ useHandCursor: true });

        // Close button
        this.closeButton = this.scene.add.text(
            this.x,
            this.y + 125,
            'Close',
            {
                fontSize: '12px',
                color: '#ff0000',
                fontFamily: 'Arial'
            }
        );
        this.closeButton.setOrigin(0.5);
        this.closeButton.setInteractive({ useHandCursor: true });

        // Add all elements to container
        this.menuContainer.add([
            this.menuPanel,
            volumeLabel,
            this.volumeSlider,
            this.volumeHandle,
            this.muteButton,
            this.closeButton
        ]);

        // Hide menu initially
        this.menuContainer.setVisible(false);
    }

    private setupInteractions(): void {
        // Volume slider drag
        this.volumeHandle.on('dragstart', () => {
            this.isDragging = true;
        });

        this.volumeHandle.on('drag', (pointer: Phaser.Input.Pointer) => {
            if (!this.isDragging) return;

            const sliderLeft = this.x - 60;
            const sliderRight = this.x + 60;

            // Constrain handle to slider bounds
            const newX = Phaser.Math.Clamp(pointer.x, sliderLeft, sliderRight);
            this.volumeHandle.x = newX;

            // Calculate volume (0-1)
            this.currentVolume = (newX - sliderLeft) / 120;

            // Update audio manager volume
            this.audioManager.setVolume(this.currentVolume);
        });

        this.volumeHandle.on('dragend', () => {
            this.isDragging = false;

            // Calculate final position and volume
            const sliderLeft = this.x - 60;
            const newVolume = (this.volumeHandle.x - sliderLeft) / 120;
            this.currentVolume = Phaser.Math.Clamp(newVolume, 0, 1);

            // Update audio manager
            this.audioManager.setVolume(this.currentVolume);
        });

        // Mute button
        this.muteButton.on('pointerdown', () => {
            this.audioManager.toggleMute();
            this.updateMuteButtonText();
        });

        this.muteButton.on('pointerover', () => {
            this.muteButton.setColor('#ffff00');
        });

        this.muteButton.on('pointerout', () => {
            this.muteButton.setColor('#ffffff');
        });

        // Close button
        this.closeButton.on('pointerdown', () => {
            this.hideMenu();
        });

        this.closeButton.on('pointerover', () => {
            this.closeButton.setColor('#ffff00');
        });

        this.closeButton.on('pointerout', () => {
            this.closeButton.setColor('#ff0000');
        });
    }

    private toggleMenu(): void {
        if (this.isVisible) {
            this.hideMenu();
        } else {
            this.showMenu();
        }
    }

    private showMenu(): void {
        this.menuContainer.setVisible(true);
        this.isVisible = true;
        this.updateMuteButtonText();
    }

    private hideMenu(): void {
        this.menuContainer.setVisible(false);
        this.isVisible = false;
    }

    private updateMuteButtonText(): void {
        if (this.audioManager.isMutedState) {
            this.muteButton.setText('Unmute');
        } else {
            this.muteButton.setText('Mute');
        }
    }

    public destroy(): void {
        if (this.menuButton) {
            this.menuButton.destroy();
        }
        if (this.menuContainer) {
            this.menuContainer.destroy();
        }
    }
}
