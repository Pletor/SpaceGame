/**
 * Audio Control Menu - interaktivní menu pro ovládání zvuku
 *
 * Funkce:
 * - Poskytuje volume slider pro přesné nastavení hlasitosti
 * - Obsahuje mute/unmute toggle button
 * - Skládací menu s elegantním designem
 * - Drag & drop interface pro slider
 *
 * Princip:
 * Toggle-based menu - kliknutím na ikonu hudby se otevře/zavře
 * Real-time volume control - okamžitá změna hlasitosti při tažení
 * Interactive UI elements s hover efekty pro lepší UX
 */

import * as Phaser from 'phaser';
import { AudioManagerComponent } from '../audio/AudioManagerComponent';

export class AudioControlMenu {
    private scene: Phaser.Scene;
    private audioManager: AudioManagerComponent;
    private menuContainer: Phaser.GameObjects.Container;
    private isVisible: boolean = false;
    private x: number;
    private y: number;

    // UI elementy
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

        // Vytvořit všechny UI komponenty
        this.createMenuButton();
        this.createMenuPanel();
        this.setupInteractions();
    }

    /**
     * Vytvoří hlavní menu button s hudební ikonou
     */
    private createMenuButton(): void {
        // Vytvořit malou ikonu hudby na specifikované pozici
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

        // Přidat hover efekt
        this.setupMenuButtonHover();

        this.menuButton.on('pointerdown', () => {
            this.toggleMenu();
        });
    }

    /**
     * Nastaví hover efekty pro menu button
     */
    private setupMenuButtonHover(): void {
        this.menuButton.on('pointerover', () => {
            this.menuButton.setColor('#ffff00');
        });

        this.menuButton.on('pointerout', () => {
            this.menuButton.setColor('#ffffff');
        });
    }

    /**
     * Vytvoří rozbalovací menu panel s ovládacími prvky
     */
    private createMenuPanel(): void {
        this.menuContainer = this.scene.add.container(0, 0);
        this.menuContainer.setDepth(1001);

        // Poloprůhledný panel pozadí
        this.menuPanel = this.scene.add.rectangle(
            this.x,
            this.y + 80,
            200,
            150,
            0x000000,
            0.8
        );
        this.menuPanel.setStrokeStyle(2, 0xffffff);

        // Vytvořit všechny ovládací prvky
        const volumeLabel = this.createVolumeLabel();
        this.createVolumeSlider();
        this.createMuteButton();
        this.createCloseButton();

        // Přidat všechny elementy do kontejneru
        this.menuContainer.add([
            this.menuPanel,
            volumeLabel,
            this.volumeSlider,
            this.volumeHandle,
            this.muteButton,
            this.closeButton
        ]);

        // Skrýt menu na začátku
        this.menuContainer.setVisible(false);
    }

    /**
     * Vytvoří label pro volume slider
     */
    private createVolumeLabel(): Phaser.GameObjects.Text {
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
        return volumeLabel;
    }

    /**
     * Vytvoří volume slider s handle
     */
    private createVolumeSlider(): void {
        // Pozadí slideru
        this.volumeSlider = this.scene.add.rectangle(
            this.x,
            this.y + 65,
            120,
            8,
            0x444444
        );

        // Handle slideru
        this.volumeHandle = this.scene.add.circle(
            this.x - 60 + (this.currentVolume * 120),
            this.y + 65,
            8,
            0xffffff
        );
        this.volumeHandle.setInteractive({ draggable: true });
    }

    /**
     * Vytvoří mute/unmute button
     */
    private createMuteButton(): void {
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
    }

    /**
     * Vytvoří close button
     */
    private createCloseButton(): void {
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
    }

    /**
     * Nastaví všechny interakce pro UI prvky
     */
    private setupInteractions(): void {
        this.setupVolumeSliderInteractions();
        this.setupMuteButtonInteractions();
        this.setupCloseButtonInteractions();
    }

    /**
     * Nastaví drag & drop pro volume slider
     */
    private setupVolumeSliderInteractions(): void {
        // Volume slider drag
        this.volumeHandle.on('dragstart', () => {
            this.isDragging = true;
        });

        this.volumeHandle.on('drag', (pointer: Phaser.Input.Pointer) => {
            if (!this.isDragging) return;

            const sliderLeft = this.x - 60;
            const sliderRight = this.x + 60;

            // Omezit handle na hranice slideru
            const newX = Phaser.Math.Clamp(pointer.x, sliderLeft, sliderRight);
            this.volumeHandle.x = newX;

            // Vypočítat volume (0-1)
            this.currentVolume = (newX - sliderLeft) / 120;

            // Aktualizovat volume v audio manageru
            this.audioManager.setVolume(this.currentVolume);
        });

        this.volumeHandle.on('dragend', () => {
            this.isDragging = false;

            // Vypočítat finální pozici a volume
            const sliderLeft = this.x - 60;
            const newVolume = (this.volumeHandle.x - sliderLeft) / 120;
            this.currentVolume = Phaser.Math.Clamp(newVolume, 0, 1);

            // Aktualizovat audio manager
            this.audioManager.setVolume(this.currentVolume);
        });
    }

    /**
     * Nastaví interakce pro mute button
     */
    private setupMuteButtonInteractions(): void {
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
    }

    /**
     * Nastaví interakce pro close button
     */
    private setupCloseButtonInteractions(): void {
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

    /**
     * Přepne viditelnost menu
     */
    private toggleMenu(): void {
        if (this.isVisible) {
            this.hideMenu();
        } else {
            this.showMenu();
        }
    }

    /**
     * Zobrazí menu
     */
    private showMenu(): void {
        this.menuContainer.setVisible(true);
        this.isVisible = true;
        this.updateMuteButtonText();
    }

    /**
     * Skryje menu
     */
    private hideMenu(): void {
        this.menuContainer.setVisible(false);
        this.isVisible = false;
    }

    /**
     * Aktualizuje text mute buttonu podle stavu
     */
    private updateMuteButtonText(): void {
        if (this.audioManager.isMutedState) {
            this.muteButton.setText('Unmute');
        } else {
            this.muteButton.setText('Mute');
        }
    }

    /**
     * Vyčistí všechny UI objekty
     */

    public destroy(): void {
        if (this.menuButton) {
            this.menuButton.destroy();
        }
        if (this.menuContainer) {
            this.menuContainer.destroy();
        }
    }
}
