/**
 * Audio Manager - centrální správa všech zvuků ve hře
 *
 * Funkce:
 * - Spravuje hudbu na pozadí s možností zapnutí/vypnutí
 * - Řídí všechny zvukové efekty (střelba, exploze, štíty)
 * - Poskytuje centrální ovládání hlasitosti a ztlumení
 * - Event-driven přehrávání zvuků na základě herních akcí
 *
 * Princip:
 * Map-based úložiště zvukových efektů pro rychlý přístup
 * Poslouchá herní eventy a automaticky přehrává odpovídající zvuky
 * Fallback mechanismus pro start hudby při uživatelské interakci
 */

import * as Phaser from 'phaser';
import { EventBusComponent, CUSTOM_EVENTS } from '../events/EventBusComponent';

export class AudioManagerComponent {
    private scene: Phaser.Scene;
    private eventBusComponent: EventBusComponent;
    private backgroundMusic?: Phaser.Sound.BaseSound;
    private soundEffects: Map<string, Phaser.Sound.BaseSound> = new Map();
    private isMuted: boolean = false;

    constructor(scene: Phaser.Scene, eventBusComponent: EventBusComponent) {
        this.scene = scene;
        this.eventBusComponent = eventBusComponent;

        this.initializeSounds();
        this.setupEventListeners();
    }

    /**
     * Inicializuje všechny zvuky ve hře
     */
    private initializeSounds(): void {
        this.initializeBackgroundMusic();
        this.initializeSoundEffects();
    }

    /**
     * Inicializuje hudbu na pozadí
     */
    private initializeBackgroundMusic(): void {
        if (this.scene.sound.get('bg')) {
            this.backgroundMusic = this.scene.sound.get('bg');
        } else {
            try {
                this.backgroundMusic = this.scene.sound.add('bg');
            } catch (error) {
                console.error('AudioManager: Chyba při vytváření hudby na pozadí:', error);
            }
        }
    }

    /**
     * Inicializuje všechny zvukové efekty
     */
    private initializeSoundEffects(): void {
        const soundKeys = [
            'shot1',
            'shot2',
            'explosion',
            'hit',
            'shieldUp',
            'shieldDown',
            'twoTone',
            'zap'
        ];

        soundKeys.forEach((key: string) => {
            const sound = this.scene.sound.get(key);
            if (sound) {
                this.soundEffects.set(key, sound);
            } else {
                try {
                    const newSound = this.scene.sound.add(key);
                    if (newSound) {
                        this.soundEffects.set(key, newSound);
                    }
                } catch (error) {
                    console.error(`Nepodařilo se vytvořit zvuk "${key}":`, error);
                }
            }
        });
    }

    /**
     * Nastaví event listenery pro herní události
     */
    private setupEventListeners(): void {
        // Poslouchat herní události pro přehrání odpovídajících zvuků
        this.eventBusComponent.on(CUSTOM_EVENTS.SHIP_SHOOT, this.onPlayerShoot, this);
        this.eventBusComponent.on('SHIP_SHOOT_SECONDARY', this.onPlayerShootSecondary, this);
        this.eventBusComponent.on(CUSTOM_EVENTS.SHIP_HIT, this.onPlayerHit, this);
        this.eventBusComponent.on('SHIELD_HIT', this.onShieldHit, this);
        this.eventBusComponent.on('SHIELD_UP_SOUND', this.onShieldUp, this);
        this.eventBusComponent.on('SHIELD_DEPLETED', this.onShieldDepleted, this);
        this.eventBusComponent.on('SHIELD_REGENERATED', this.onShieldRegenerated, this);
        this.eventBusComponent.on(CUSTOM_EVENTS.ENEMY_DESTROYED, this.onEnemyDestroyed, this);
        this.eventBusComponent.on('ASTEROID_SHATTER_SOUND', this.onAsteroidShatter, this);
        this.eventBusComponent.on(CUSTOM_EVENTS.PLAYER_DESTROYED, this.onPlayerDestroyed, this);
        this.eventBusComponent.on(CUSTOM_EVENTS.GAME_OVER, this.onGameOver, this);
    }

    /**
     * Spustí hudbu na pozadí
     */
    public startBackgroundMusic(): void {
        if (this.backgroundMusic && !this.isMuted) {
            try {
                this.backgroundMusic.play({
                    loop: true,
                    volume: 0.3
                });
            } catch (error) {
                console.error('AudioManager: Error starting background music:', error);
            }
        }
    }

    public stopBackgroundMusic(): void {
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
        }
    }

    private onPlayerShoot(): void {
        this.playSound('shot1');
    }

    private onPlayerShootSecondary(): void {
        this.playSound('shot2');
    }

    private onPlayerHit(): void {
        this.playSound('hit');
    }

    private onShieldHit(): void {
        this.playSound('shieldUp'); // Play shield sound when shield absorbs damage
    }

    private onShieldUp(): void {
        this.playSound('shieldUp'); // Play shield up sound when shield segment is repaired
    }

    private onShieldDepleted(): void {
        this.playSound('shieldDown'); // Play shield down sound when shield is completely depleted
    }

    private onShieldRegenerated(): void {
        this.playSound('shieldUp'); // Play shield up sound when shield is fully regenerated
    }

    private onPlayerDestroyed(): void {
        this.playSound('explosion');
    }

    private onEnemyDestroyed(): void {
        this.playSound('zap'); // Different sound for asteroid destruction
    }

    private onAsteroidShatter(): void {
        this.playSound('twoTone'); // Use twoTone sound for asteroid shattering effect
    }

    private onGameOver(): void {
        this.playSound('explosion');
        this.stopBackgroundMusic();
    }

    public playSound(soundKey: string, volume: number = 0.5): void {
        if (this.isMuted) return;

        const sound = this.soundEffects.get(soundKey);
        if (sound) {
            sound.play({ volume });
        }
    }

    public setMuted(muted: boolean): void {
        this.isMuted = muted;

        if (muted) {
            this.stopBackgroundMusic();
            // Stop all currently playing sounds
            this.soundEffects.forEach(sound => {
                if (sound.isPlaying) {
                    sound.stop();
                }
            });
        } else {
            this.startBackgroundMusic();
        }
    }

    public toggleMute(): void {
        this.setMuted(!this.isMuted);
    }

    public setVolume(volume: number): void {
        volume = Phaser.Math.Clamp(volume, 0, 1);

        if (this.backgroundMusic) {
            (this.backgroundMusic as any).setVolume(volume);
        }

        // Update all sound effects volume
        this.soundEffects.forEach(sound => {
            (sound as any).setVolume(volume);
        });
    }

    public getVolume(): number {
        if (this.backgroundMusic) {
            return (this.backgroundMusic as any).volume || 0.5;
        }
        return 0.5;
    }

    public get isMutedState(): boolean {
        return this.isMuted;
    }

    public destroy(): void {
        // Cleanup event listeners
        this.eventBusComponent.off(CUSTOM_EVENTS.SHIP_SHOOT, this.onPlayerShoot, this);
        this.eventBusComponent.off('SHIP_SHOOT_SECONDARY', this.onPlayerShootSecondary, this);
        this.eventBusComponent.off(CUSTOM_EVENTS.SHIP_HIT, this.onPlayerHit, this);
        this.eventBusComponent.off('SHIELD_HIT', this.onShieldHit, this);
        this.eventBusComponent.off('SHIELD_UP_SOUND', this.onShieldUp, this);
        this.eventBusComponent.off('SHIELD_DEPLETED', this.onShieldDepleted, this);
        this.eventBusComponent.off('SHIELD_REGENERATED', this.onShieldRegenerated, this);
        this.eventBusComponent.off(CUSTOM_EVENTS.ENEMY_DESTROYED, this.onEnemyDestroyed, this);
        this.eventBusComponent.off('ASTEROID_SHATTER_SOUND', this.onAsteroidShatter, this);
        this.eventBusComponent.off(CUSTOM_EVENTS.PLAYER_DESTROYED, this.onPlayerDestroyed, this);
        this.eventBusComponent.off(CUSTOM_EVENTS.GAME_OVER, this.onGameOver, this);

        // Stop all sounds
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
        }

        this.soundEffects.forEach(sound => {
            if (sound.isPlaying) {
                sound.stop();
            }
        });

        this.soundEffects.clear();
    }
}
