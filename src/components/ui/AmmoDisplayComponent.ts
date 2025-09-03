import * as Phaser from 'phaser';

export class AmmoDisplayComponent {
    private scene: Phaser.Scene;
    private primaryAmmoText: Phaser.GameObjects.Text;
    private secondaryAmmoText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        this.scene = scene;

        // Create luxury primary ammo display
        this.primaryAmmoText = scene.add.text(x, y, 'PRIMARY: 0/10', {
            fontSize: '20px',
            color: '#00ffaa',
            fontFamily: 'Arial Black',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0); // Left aligned for left panel

        // Create luxury secondary ammo display
        this.secondaryAmmoText = scene.add.text(x, y + 30, 'SECONDARY: 0/10', {
            fontSize: '20px',
            color: '#ffaa00',
            fontFamily: 'Arial Black',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0); // Left aligned for left panel
    }

    public updatePrimaryAmmo(current: number, max: number): void {
        this.primaryAmmoText.setText(`PRIMARY: ${current}/${max}`);

        // Luxury color scheme based on ammo level
        if (current === 0) {
            this.primaryAmmoText.setColor('#ff4444'); // Premium red when empty
        } else if (current <= max * 0.3) {
            this.primaryAmmoText.setColor('#ffdd44'); // Premium yellow when low
        } else {
            this.primaryAmmoText.setColor('#44ffaa'); // Premium cyan when good
        }
    }

    public updateSecondaryAmmo(current: number, max: number): void {
        this.secondaryAmmoText.setText(`SECONDARY: ${current}/${max}`);

        // Luxury color scheme based on ammo level
        if (current === 0) {
            this.secondaryAmmoText.setColor('#ff4444'); // Premium red when empty
        } else if (current <= max * 0.3) {
            this.secondaryAmmoText.setColor('#ffdd44'); // Premium yellow when low
        } else {
            this.secondaryAmmoText.setColor('#ffaa44'); // Premium orange when good
        }
    }

    public destroy(): void {
        this.primaryAmmoText.destroy();
        this.secondaryAmmoText.destroy();
    }
}
