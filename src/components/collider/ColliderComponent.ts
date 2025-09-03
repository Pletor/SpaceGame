import { HealthComponent } from '../health/HealthComponent';
import { EventBusComponent, CUSTOM_EVENTS } from '../events/EventBusComponent';

export class ColliderComponent {
    private healthComponent: HealthComponent;
    private eventBusComponent?: EventBusComponent;
    private gameObject: any; // Reference to the game object that owns this component

    constructor(healthComponent: HealthComponent, eventBusComponent?: EventBusComponent, gameObject?: any) {
        this.healthComponent = healthComponent;
        this.eventBusComponent = eventBusComponent;
        this.gameObject = gameObject;
    }

    public collideWithEnemyShip(): void {
        if (this.healthComponent.isDeadState) return;

        // Emit ship hit event for shield/audio system
        if (this.eventBusComponent) {
            this.eventBusComponent.emit(CUSTOM_EVENTS.SHIP_HIT);
        }

        // Check if this was the final hit (when shield runs out, player dies)
        // This will be handled by the shield system in Player
    }

    public collideWithEnemyProjectile(): void {
        if (this.healthComponent.isDeadState) return;

        this.healthComponent.hit();

        // Check if object is now dead and emit destruction event
        if (this.healthComponent.isDeadState) {
            if (this.eventBusComponent && this.gameObject) {
                this.eventBusComponent.emit(CUSTOM_EVENTS.ENEMY_DESTROYED, this.gameObject);
            }
        }

        // Emit ship hit event for audio/effects
        if (this.eventBusComponent) {
            this.eventBusComponent.emit(CUSTOM_EVENTS.SHIP_HIT);
        }
    }
}
