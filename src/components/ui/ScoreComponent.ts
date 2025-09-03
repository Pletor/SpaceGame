/**
 * Score Component - zobrazuje a spravuje herní skóre
 *
 * Funkce:
 * - Zobrazuje aktuální skóre hráče ve stylizované formě
 * - Poslouchá eventy zničení nepřátel a automaticky přidává body
 * - Poskytuje možnost manuálního přidání bodů
 * - Řeší reset skóre při novém spuštění hry
 *
 * Princip:
 * Event-driven scoring - reaguje na SCORE_CHANGE a ENEMY_DESTROYED eventy
 * Luxusní design s outline textem pro lepší čitelnost
 * Automatické bodování na základě typů nepřátel
 */

import * as Phaser from 'phaser';
import { EventBusComponent, CUSTOM_EVENTS } from '../events/EventBusComponent';

export class ScoreComponent {
    private scene: Phaser.Scene;
    private scoreText: Phaser.GameObjects.Text;
    private currentScore: number = 0;
    private eventBusComponent: EventBusComponent;

    constructor(scene: Phaser.Scene, x: number, y: number, eventBusComponent: EventBusComponent) {
        this.scene = scene;
        this.eventBusComponent = eventBusComponent;

        // Vytvořit luxusní skóre text
        this.createScoreText(x, y);

        // Nastavit event listenery
        this.setupEventListeners();
    }

    /**
     * Vytvoří stylizovaný text pro zobrazení skóre
     */
    private createScoreText(x: number, y: number): void {
        this.scoreText = this.scene.add.text(x, y, 'SCORE: 0', {
            fontSize: '28px',
            color: '#ffdd00',
            fontFamily: 'Arial Black',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0, 0); // Zarovnání vlevo pro levý panel
    }

    /**
     * Nastaví event listenery pro skóre eventy
     */
    private setupEventListeners(): void {
        this.eventBusComponent.on(CUSTOM_EVENTS.SCORE_CHANGE, this.addScore, this);
        this.eventBusComponent.on(CUSTOM_EVENTS.ENEMY_DESTROYED, this.onEnemyDestroyed, this);
    }

    /**
     * Zpracuje zničení nepřítele a přidá odpovídající body
     */
    private onEnemyDestroyed(enemy: any): void {
        // Přidat skóre podle typu nepřítele
        let points = 100; // Výchozí body

        // Sofistikovanější bodování podle typu nepřítele
        if (enemy.constructor.name === 'ScoutEnemy') {
            points = 100;
        } else if (enemy.constructor.name === 'FighterEnemy') {
            points = 200;
        }

        this.addScore(points);
    }

    /**
     * Přidá body k aktuálnímu skóre
     */
    public addScore(points: number): void {
        this.currentScore += points;
        this.updateDisplay();
    }

    /**
     * Vrací aktuální skóre
     */
    public getScore(): number {
        return this.currentScore;
    }

    /**
     * Resetuje skóre na 0 - používá se při novém spuštění hry
     */
    public reset(): void {
        this.currentScore = 0;
        this.updateDisplay();
    }

    /**
     * Aktualizuje zobrazení skóre
     */
    private updateDisplay(): void {
        this.scoreText.setText(`SCORE: ${this.currentScore}`);
    }

    /**
     * Vyčistí event listenery a zničí text
     */
    public destroy(): void {
        this.eventBusComponent.off(CUSTOM_EVENTS.SCORE_CHANGE, this.addScore, this);
        this.eventBusComponent.off(CUSTOM_EVENTS.ENEMY_DESTROYED, this.onEnemyDestroyed, this);
        this.scoreText.destroy();
    }
}
