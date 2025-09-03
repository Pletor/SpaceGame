import { EventBusComponent, CUSTOM_EVENTS } from '../events/EventBusComponent';

export class LivesComponent {
    private lives: number;
    private eventBusComponent: EventBusComponent;

    constructor(initialLives: number, eventBusComponent: EventBusComponent) {
        this.lives = initialLives;
        this.eventBusComponent = eventBusComponent;

        // Emit initial lives count
        this.eventBusComponent.emit(CUSTOM_EVENTS.LIVES_CHANGE, this.lives);
    }

    public getLives(): number {
        return this.lives;
    }

    public loseLife(): void {
        if (this.lives > 0) {
            this.lives--;
            this.eventBusComponent.emit(CUSTOM_EVENTS.LIVES_CHANGE, this.lives);

            if (this.lives <= 0) {
                this.eventBusComponent.emit(CUSTOM_EVENTS.GAME_OVER);
            }
        }
    }

    public addLife(): void {
        this.lives++;
        this.eventBusComponent.emit(CUSTOM_EVENTS.LIVES_CHANGE, this.lives);
    }

    public isGameOver(): boolean {
        return this.lives <= 0;
    }
}
