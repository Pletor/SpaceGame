/**
 * Ammo Display Component - zobrazuje stav munice pro obě zbraně
 *
 * Funkce:
 * - Zobrazuje aktuální stav primární a sekundární munice
 * - Používá barevné kódování pro různé úrovně munice
 * - Luxusní design s outline textem pro lepší čitelnost
 * - Umístěno v levém panelu UI pro přehlednost
 *
 * Princip:
 * Real-time display - aktualizuje se každý frame z WeaponComponent
 * Color-coded feedback - červená (prázdné), žlutá (málo), zelená/oranžová (dost)
 * Dual weapon support - oddělené zobrazení pro primární a sekundární zbraň
 */

import * as Phaser from 'phaser';

export class AmmoDisplayComponent {
    private scene: Phaser.Scene;
    private primaryAmmoText: Phaser.GameObjects.Text;
    private secondaryAmmoText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        this.scene = scene;

        // Vytvořit displeje munice
        this.createAmmoDisplays(x, y);
    }

    /**
     * Vytvoří textové displeje pro obě zbraně
     */
    private createAmmoDisplays(x: number, y: number): void {
        // Vytvořit luxusní displej primární munice
        this.primaryAmmoText = this.scene.add.text(x, y, 'PRIMARY: 0/10', {
            fontSize: '20px',
            color: '#00ffaa',
            fontFamily: 'Arial Black',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0); // Zarovnání vlevo pro levý panel

        // Vytvořit luxusní displej sekundární munice
        this.secondaryAmmoText = this.scene.add.text(x, y + 30, 'SECONDARY: 0/10', {
            fontSize: '20px',
            color: '#ffaa00',
            fontFamily: 'Arial Black',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0); // Zarovnání vlevo pro levý panel
    }

    /**
     * Aktualizuje displej primární munice s barevným kódováním
     */
    public updatePrimaryAmmo(current: number, max: number): void {
        this.primaryAmmoText.setText(`PRIMARY: ${current}/${max}`);

        // Luxusní barevné schéma podle úrovně munice
        if (current === 0) {
            this.primaryAmmoText.setColor('#ff4444'); // Prémiová červená když prázdné
        } else if (current <= max * 0.3) {
            this.primaryAmmoText.setColor('#ffdd44'); // Prémiová žlutá když málo
        } else {
            this.primaryAmmoText.setColor('#44ffaa'); // Prémiová cyan když dost
        }
    }

    /**
     * Aktualizuje displej sekundární munice s barevným kódováním
     */
    public updateSecondaryAmmo(current: number, max: number): void {
        this.secondaryAmmoText.setText(`SECONDARY: ${current}/${max}`);

        // Luxusní barevné schéma podle úrovně munice
        if (current === 0) {
            this.secondaryAmmoText.setColor('#ff4444'); // Prémiová červená když prázdné
        } else if (current <= max * 0.3) {
            this.secondaryAmmoText.setColor('#ffdd44'); // Prémiová žlutá když málo
        } else {
            this.secondaryAmmoText.setColor('#ffaa44'); // Prémiová oranžová když dost
        }
    }

    /**
     * Vyčistí textové objekty
     */
    public destroy(): void {
        this.primaryAmmoText.destroy();
        this.secondaryAmmoText.destroy();
    }
}
