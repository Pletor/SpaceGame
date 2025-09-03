import * as Phaser from 'phaser';

export class CooldownBarComponent {
    private scene: Phaser.Scene;
    private background: Phaser.GameObjects.Rectangle;
    private bar: Phaser.GameObjects.Rectangle;
    private text: Phaser.GameObjects.Text;
    private maxCooldown: number;
    private currentCooldown: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, maxCooldown: number) {
        this.scene = scene;
        this.maxCooldown = maxCooldown;

        // Create luxury background with gradient effect
        this.background = scene.add.rectangle(x, y, width, height, 0x1a1a1a);
        this.background.setStrokeStyle(3, 0x00ffff, 0.8);

        // Create premium cooldown bar
        this.bar = scene.add.rectangle(x, y, width - 6, height - 6, 0x00ff00);
        this.bar.setVisible(false);

        // Create elegant text label
        this.text = scene.add.text(x, y - height - 15, 'SECONDARY WEAPON', {
            fontSize: '16px',
            color: '#00ffff',
            fontFamily: 'Arial Black',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    public updateCooldown(cooldownTime: number): void {
        this.currentCooldown = cooldownTime;

        if (this.currentCooldown > 0) {
            // Show premium cooldown bar
            this.bar.setVisible(true);

            // Calculate progress from 0 to 1 (0 = ready, 1 = full cooldown)
            const progress = this.currentCooldown / this.maxCooldown;

            // For loading left to right: invert the progress (1 - progress)
            const fillProgress = 1 - progress;
            const barWidth = (this.background.width - 6) * fillProgress;
            this.bar.setSize(barWidth, this.background.height - 6);

            // Position bar from left side
            const leftX = this.background.x - this.background.width / 2 + barWidth / 2;
            this.bar.setX(leftX);

            // Luxury color scheme based on readiness (inverted logic)
            if (fillProgress < 0.3) {
                this.bar.setFillStyle(0xff3333); // Premium red when mostly on cooldown
            } else if (fillProgress < 0.7) {
                this.bar.setFillStyle(0xffaa00); // Premium orange when cooling down
            } else {
                this.bar.setFillStyle(0x00ff88); // Premium green when almost ready
            }

            // Add glow effect
            this.bar.setAlpha(0.9);
        } else {
            // Hide cooldown bar when ready
            this.bar.setVisible(false);
        }
    }

    public destroy(): void {
        this.background.destroy();
        this.bar.destroy();
        this.text.destroy();
    }
}
