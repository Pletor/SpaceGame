import * as Phaser from 'phaser';

export class AsteroidHealthBarComponent {
    private scene: Phaser.Scene;
    private asteroid: any;
    private healthBarGraphics: Phaser.GameObjects.Graphics;
    private maxHealth: number;
    private currentHealth: number;
    private isVisible: boolean = false;
    private barWidth: number = 40;
    private barHeight: number = 6;

    constructor(scene: Phaser.Scene, asteroid: any, maxHealth: number) {
        this.scene = scene;
        this.asteroid = asteroid;
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;

        // Create graphics object for health bar
        this.healthBarGraphics = scene.add.graphics();
        this.healthBarGraphics.setDepth(10); // Above asteroids but below UI
        this.healthBarGraphics.setVisible(false);

        // Update position initially
        this.updatePosition();
    }

    public updateHealth(currentHealth: number): void {
        this.currentHealth = currentHealth;

        // Only show health bar if asteroid is damaged and has more than 1 max health
        if (this.maxHealth > 1 && this.currentHealth < this.maxHealth && this.currentHealth > 0) {
            this.isVisible = true;
            this.healthBarGraphics.setVisible(true);
            this.updateDisplay();
        } else {
            this.isVisible = false;
            this.healthBarGraphics.setVisible(false);
        }
    }

    public updatePosition(): void {
        if (!this.asteroid || !this.asteroid.active || !this.healthBarGraphics) return;

        // Position health bar above asteroid
        const x = this.asteroid.x - this.barWidth / 2;
        const y = this.asteroid.y - this.asteroid.height / 2 - 15;

        this.healthBarGraphics.setPosition(x, y);
    }

    private updateDisplay(): void {
        this.healthBarGraphics.clear();

        if (!this.isVisible || this.currentHealth <= 0) return;

        // Background (dark gray)
        this.healthBarGraphics.fillStyle(0x333333, 0.8);
        this.healthBarGraphics.fillRoundedRect(0, 0, this.barWidth, this.barHeight, 2);

        // Border
        this.healthBarGraphics.lineStyle(1, 0x666666, 0.9);
        this.healthBarGraphics.strokeRoundedRect(0, 0, this.barWidth, this.barHeight, 2);

        // Health fill
        const healthPercent = this.currentHealth / this.maxHealth;
        const fillWidth = (this.barWidth - 2) * healthPercent;

        if (fillWidth > 0) {
            // Color based on health percentage
            let fillColor = 0x00ff00; // Green
            if (healthPercent <= 0.33) {
                fillColor = 0xff4444; // Red
            } else if (healthPercent <= 0.66) {
                fillColor = 0xffaa00; // Orange
            }

            this.healthBarGraphics.fillStyle(fillColor, 0.9);
            this.healthBarGraphics.fillRoundedRect(1, 1, fillWidth, this.barHeight - 2, 1);
        }
    }

    public destroy(): void {
        if (this.healthBarGraphics) {
            this.healthBarGraphics.destroy();
            this.healthBarGraphics = null as any;
        }
        this.asteroid = null;
    }
}
