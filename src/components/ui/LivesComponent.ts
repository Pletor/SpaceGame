/**
 * Lives Component - spravuje systém životů hráče
 *
 * Funkce:
 * - Zobrazuje aktuální počet životů hráče
 * - Zpracovává smrt hráče a řídí respawn nebo game over
 * - Implementuje debounce pro předejití duplicitních smrti
 * - Poskytuje reset funkcionalitu pro novou hru
 *
 * Princip:
 * Event-driven life management - reaguje na PLAYER_DESTROYED eventy
 * Debounce logic pro stabilitu při rychlých úmrtích
 * Automatický respawn systém s delay pro lepší UX
 * Game over trigger při vyčerpání životů
 */

import * as Phaser from 'phaser';
import { EventBusComponent, CUSTOM_EVENTS } from '../events/EventBusComponent';
import * as GameConfig from '../../config/GameConfig';

export class LivesComponent {
    private scene: Phaser.Scene;
    private livesText: Phaser.GameObjects.Text;
    private currentLives: number;
    private eventBusComponent: EventBusComponent;
    private lastDeathTime: number = 0;
    private deathDebounceTime: number = 500; // 500ms debounce mezi úmrtími

    constructor(scene: Phaser.Scene, x: number, y: number, eventBusComponent: EventBusComponent) {
        this.scene = scene;
        this.eventBusComponent = eventBusComponent;
        this.currentLives = GameConfig.PLAYER_LIVES;

        // Vytvořit luxusní text životů
        this.createLivesText(x, y);

        // Nastavit event listenery
        this.setupEventListeners();
    }

    /**
     * Vytvoří stylizovaný text pro zobrazení životů
     */
    private createLivesText(x: number, y: number): void {
        this.livesText = this.scene.add.text(x, y, `LIVES: ${this.currentLives}`, {
            fontSize: '28px',
            color: '#ff4444',
            fontFamily: 'Arial Black',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0, 0); // Zarovnání vlevo pro levý panel
    }

    /**
     * Nastaví event listenery pro systém životů
     */
    private setupEventListeners(): void {
        // Poslouchat eventy smrti hráče (pouze když je hráč kompletně zničen)
        this.eventBusComponent.on(CUSTOM_EVENTS.PLAYER_DESTROYED, this.onPlayerDestroyed, this);
    }

    /**
     * Zpracuje smrt hráče a řídí respawn nebo game over
     */
    private onPlayerDestroyed(): void {
        const currentTime = this.scene.time.now;

        if (currentTime - this.lastDeathTime < this.deathDebounceTime) {
            return;
        }

        this.lastDeathTime = currentTime;
        this.loseLife();

        if (this.currentLives > 0) {
            this.scene.time.delayedCall(1000, () => {
                this.eventBusComponent.emit(CUSTOM_EVENTS.PLAYER_SPAWN);
            });
        }
    }

    /**
     * Ztrátí jeden život a zkontroluje game over
     */
    public loseLife(): void {
        this.currentLives = Math.max(0, this.currentLives - 1);
        this.updateDisplay();

        // Emitovat game over event pokud nezůstaly životy
        if (this.currentLives <= 0) {
            this.eventBusComponent.emit(CUSTOM_EVENTS.GAME_OVER);
        }
    }

    /**
     * Vrací aktuální počet životů
     */
    public getLives(): number {
        return this.currentLives;
    }

    /**
     * Resetuje životy na počáteční hodnotu
     */
    public reset(): void {
        this.currentLives = GameConfig.PLAYER_LIVES;
        this.updateDisplay();
    }

    /**
     * Přidá jeden život - bonus funkcionalita
     */
    public addLife(): void {
        this.currentLives++;
        this.updateDisplay();
    }

    /**
     * Aktualizuje zobrazení životů
     */
    private updateDisplay(): void {
        this.livesText.setText(`LIVES: ${this.currentLives}`);
    }

    /**
     * Vyčistí event listenery a zničí text
     */
    public destroy(): void {
        this.eventBusComponent.off(CUSTOM_EVENTS.PLAYER_DESTROYED, this.onPlayerDestroyed, this);
        this.livesText.destroy();
    }
}
