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

        // Create luxury score text
        this.scoreText = scene.add.text(x, y, 'SCORE: 0', {
            fontSize: '28px',
            color: '#ffdd00',
            fontFamily: 'Arial Black',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0, 0); // Left aligned for left panel

        // Listen for score events
        this.eventBusComponent.on(CUSTOM_EVENTS.SCORE_CHANGE, this.addScore, this);
        this.eventBusComponent.on(CUSTOM_EVENTS.ENEMY_DESTROYED, this.onEnemyDestroyed, this);
    }

    private onEnemyDestroyed(enemy: any): void {
        // Add score based on enemy type
        let points = 100; // Default points

        // You can add more sophisticated scoring here based on enemy type
        if (enemy.constructor.name === 'ScoutEnemy') {
            points = 100;
        } else if (enemy.constructor.name === 'FighterEnemy') {
            points = 200;
        }

        this.addScore(points);
    }

    public addScore(points: number): void {
        this.currentScore += points;
        this.updateDisplay();
    }

    public getScore(): number {
        return this.currentScore;
    }

    public reset(): void {
        this.currentScore = 0;
        this.updateDisplay();
    }

    private updateDisplay(): void {
        this.scoreText.setText(`SCORE: ${this.currentScore}`);
    }

    public destroy(): void {
        this.eventBusComponent.off(CUSTOM_EVENTS.SCORE_CHANGE, this.addScore, this);
        this.eventBusComponent.off(CUSTOM_EVENTS.ENEMY_DESTROYED, this.onEnemyDestroyed, this);
        this.scoreText.destroy();
    }
}
