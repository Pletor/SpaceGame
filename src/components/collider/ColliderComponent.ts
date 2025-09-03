/**
 * Collider Component - zpracovává kolize objektů ve hře
 *
 * Funkce:
 * - Zpracovává různé typy kolizí (s nepřáteli, projektily)
 * - Integruje se s HealthComponent pro damage systém
 * - Emituje events pro audio a efekty
 * - Rozlišuje mezi různými typy kolizí
 *
 * Princip:
 * Event-driven collision handling - emituje eventy pro ostatní systémy
 * Health integration - automaticky snižuje životy při zásahu
 * Type-specific logic - různé chování pro různé typy kolizí
 */

import { HealthComponent } from '../health/HealthComponent';
import { EventBusComponent, CUSTOM_EVENTS } from '../events/EventBusComponent';

export class ColliderComponent {
    private healthComponent: HealthComponent;
    private eventBusComponent?: EventBusComponent;
    private gameObject: any; // Reference na game object který vlastní tuto komponentu

    constructor(healthComponent: HealthComponent, eventBusComponent?: EventBusComponent, gameObject?: any) {
        this.healthComponent = healthComponent;
        this.eventBusComponent = eventBusComponent;
        this.gameObject = gameObject;
    }

    /**
     * Zpracuje kolizi s nepřátelskou lodí (asteroid vs hráč)
     */
    public collideWithEnemyShip(): void {
        if (this.healthComponent.isDeadState) return;

        // Emitovat ship hit event pro štít/audio systém
        if (this.eventBusComponent) {
            this.eventBusComponent.emit(CUSTOM_EVENTS.SHIP_HIT);
        }

        // Kontrola zda to byl finální zásah bude řešena štítovým systémem v Player
    }

    /**
     * Zpracuje kolizi s nepřátelským projektilem
     */
    public collideWithEnemyProjectile(): void {
        if (this.healthComponent.isDeadState) return;

        this.healthComponent.hit();

        // Zkontrolovat zda je objekt nyní mrtvý a emitovat destrukční event
        if (this.healthComponent.isDeadState) {
            if (this.eventBusComponent && this.gameObject) {
                this.eventBusComponent.emit(CUSTOM_EVENTS.ENEMY_DESTROYED, this.gameObject);
            }
        }

        // Emitovat ship hit event pro audio/efekty
        if (this.eventBusComponent) {
            this.eventBusComponent.emit(CUSTOM_EVENTS.SHIP_HIT);
        }
    }
}
