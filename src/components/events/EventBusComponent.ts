/**
 * Event Bus Component - centrální komunikační systém hry
 *
 * Funkce:
 * - Poskytuje centrální místo pro všechny herní události
 * - Umožňuje loose coupling mezi komponentami
 * - Definuje konstanty pro všechny typy událostí
 * - Rozšiřuje Phaser EventEmitter pro spolehlivost
 *
 * Princip:
 * Observer pattern - komponenty se registrují k poslouchání událostí
 * Type-safe eventy přes konstanty místo magic strings
 * Jednoduchá emit/on architektura pro pub-sub komunikaci
 */

import * as Phaser from 'phaser';

// Konstanty pro všechny herní události - zamezuje typos a usnadňuje refaktoring
export const CUSTOM_EVENTS = Object.freeze({
    ENEMY_INIT: 'ENEMY_INIT',           // Inicializace nepřítele
    ENEMY_DESTROYED: 'ENEMY_DESTROYED', // Zničení nepřítele
    PLAYER_SPAWN: 'PLAYER_SPAWN',       // Spawn hráče
    PLAYER_DESTROYED: 'PLAYER_DESTROYED', // Zničení hráče
    GAME_OVER: 'GAME_OVER',             // Konec hry
    SHIP_HIT: 'SHIP_HIT',               // Zásah lodi
    SHIP_SHOOT: 'SHIP_SHOOT',           // Střelba lodi
    SCORE_CHANGE: 'SCORE_CHANGE',       // Změna skóre
    LIVES_CHANGE: 'LIVES_CHANGE'        // Změna životů
});

/**
 * Centrální event bus pro komunikaci mezi komponentami
 * Rozšiřuje Phaser EventEmitter pro spolehlivost a výkon
 */
export class EventBusComponent extends Phaser.Events.EventEmitter {
    constructor() {
        super();
    }
}
