/**
 * Cooldown Bar Component - zobrazuje cooldown sekundární zbraně
 *
 * Funkce:
 * - Vizualizuje zbývající čas cooldownu sekundární zbraně
 * - Luxusní design s barevným gradient podle stavu
 * - Automaticky se skryje když je zbraň připravena
 * - Plynulé animace s alpha efekty
 *
 * Princip:
 * Progress bar s inverted fill - plní se zleva doprava
 * Color-coded states - červená (cooldown), oranžová (čeká), zelená (téměř připraveno)
 * Visual feedback pro lepší herní zážitek
 */

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

        // Vytvořit luxusní pozadí s gradient efektem
        this.createBackground(x, y, width, height);

        // Vytvořit prémiový cooldown bar
        this.createCooldownBar(x, y, width, height);

        // Vytvořit elegantní text label
        this.createTextLabel(x, y, height);
    }

    /**
     * Vytvoří pozadí cooldown baru
     */
    private createBackground(x: number, y: number, width: number, height: number): void {
        this.background = this.scene.add.rectangle(x, y, width, height, 0x1a1a1a);
        this.background.setStrokeStyle(3, 0x00ffff, 0.8);
    }

    /**
     * Vytvoří samotný progress bar
     */
    private createCooldownBar(x: number, y: number, width: number, height: number): void {
        this.bar = this.scene.add.rectangle(x, y, width - 6, height - 6, 0x00ff00);
        this.bar.setVisible(false);
    }

    /**
     * Vytvoří textový label
     */
    private createTextLabel(x: number, y: number, height: number): void {
        this.text = this.scene.add.text(x, y - height - 15, 'SECONDARY WEAPON', {
            fontSize: '16px',
            color: '#00ffff',
            fontFamily: 'Arial Black',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    /**
     * Aktualizuje zobrazení cooldownu
     */
    public updateCooldown(cooldownTime: number): void {
        this.currentCooldown = cooldownTime;

        if (this.currentCooldown > 0) {
            // Zobrazit prémiový cooldown bar
            this.bar.setVisible(true);

            // Vypočítat progress od 0 do 1 (0 = připraveno, 1 = plný cooldown)
            const progress = this.currentCooldown / this.maxCooldown;

            // Pro plnění zleva doprava: invertovat progress (1 - progress)
            const fillProgress = 1 - progress;
            const barWidth = (this.background.width - 6) * fillProgress;
            this.bar.setSize(barWidth, this.background.height - 6);

            // Pozicovat bar z levé strany
            const leftX = this.background.x - this.background.width / 2 + barWidth / 2;
            this.bar.setX(leftX);

            // Luxusní barevné schéma podle připravenosti (inverted logika)
            this.updateBarColor(fillProgress);

            // Přidat glow efekt
            this.bar.setAlpha(0.9);
        } else {
            // Skrýt cooldown bar když je připraveno
            this.bar.setVisible(false);
        }
    }

    /**
     * Aktualizuje barvu baru podle stavu cooldownu
     */
    private updateBarColor(fillProgress: number): void {
        if (fillProgress < 0.3) {
            this.bar.setFillStyle(0xff3333); // Prémiová červená když většinou na cooldownu
        } else if (fillProgress < 0.7) {
            this.bar.setFillStyle(0xffaa00); // Prémiová oranžová když se ochlazuje
        } else {
            this.bar.setFillStyle(0x00ff88); // Prémiová zelená když téměř připraveno
        }
    }

    /**
     * Vyčistí všechny objekty
     */

    public destroy(): void {
        this.background.destroy();
        this.bar.destroy();
        this.text.destroy();
    }
}
