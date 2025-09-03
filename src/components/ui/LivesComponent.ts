import * as Phaser from 'phaser';
import { EventBusComponent, CUSTOM_EVENTS } from '../events/EventBusComponent';
import * as GameConfig from '../../config/GameConfig';

export class LivesComponent {
    private scene: Phaser.Scene;
    private livesText: Phaser.GameObjects.Text;
    private currentLives: number;
    private eventBusComponent: EventBusComponent;
    private lastDeathTime: number = 0;
    private deathDebounceTime: number = 500; // 500ms debounce between deaths

    constructor(scene: Phaser.Scene, x: number, y: number, eventBusComponent: EventBusComponent) {
        this.scene = scene;
        this.eventBusComponent = eventBusComponent;
        this.currentLives = GameConfig.PLAYER_LIVES;

        // Create luxury lives text
        this.livesText = scene.add.text(x, y, `LIVES: ${this.currentLives}`, {
            fontSize: '28px',
            color: '#ff4444',
            fontFamily: 'Arial Black',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0, 0); // Left aligned for left panel

        // Listen for player death events (only when player is completely destroyed)
        this.eventBusComponent.on(CUSTOM_EVENTS.PLAYER_DESTROYED, this.onPlayerDestroyed, this);
    }

    private onPlayerDestroyed(): void {
        const currentTime = this.scene.time.now;

        // Debounce rapid death events - prevent multiple deaths in short succession
        if (currentTime - this.lastDeathTime < this.deathDebounceTime) {
            console.log('Death event ignored due to debounce');
            return;
        }

        this.lastDeathTime = currentTime;

        console.log(`Player destroyed! Current lives before: ${this.currentLives}`);
        this.loseLife();
        console.log(`Lives after losing one: ${this.currentLives}`);

        // Check if player should respawn
        if (this.currentLives > 0) {
            console.log('Player will respawn in 1 second');
            // Player has lives left, respawn after delay
            this.scene.time.delayedCall(1000, () => {
                console.log('Emitting PLAYER_SPAWN event');
                this.eventBusComponent.emit(CUSTOM_EVENTS.PLAYER_SPAWN);
            });
        } else {
            console.log('No lives left - game over!');
        }
        // If no lives left, game over is already emitted by loseLife()
    }

    public loseLife(): void {
        this.currentLives = Math.max(0, this.currentLives - 1);
        this.updateDisplay();

        // Emit game over event if no lives left
        if (this.currentLives <= 0) {
            this.eventBusComponent.emit(CUSTOM_EVENTS.GAME_OVER);
        }
    }

    public getLives(): number {
        return this.currentLives;
    }

    public reset(): void {
        this.currentLives = GameConfig.PLAYER_LIVES;
        this.updateDisplay();
    }

    public addLife(): void {
        this.currentLives++;
        this.updateDisplay();
    }

    private updateDisplay(): void {
        this.livesText.setText(`LIVES: ${this.currentLives}`);
    }

    public destroy(): void {
        this.eventBusComponent.off(CUSTOM_EVENTS.PLAYER_DESTROYED, this.onPlayerDestroyed, this);
        this.livesText.destroy();
    }
}
