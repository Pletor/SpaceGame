/**
 * SimpleShieldComponent - Jednoduchý štítový systém s okamžitou aktualizací
 */

import * as Phaser from 'phaser';
import { EventBusComponent } from './events/EventBusComponent';

export class SimpleShieldComponent {
    private gameObject: Phaser.GameObjects.GameObject;
    private scene: Phaser.Scene;
    private eventBusComponent: EventBusComponent;

    private shieldSprite?: Phaser.GameObjects.Sprite;
    private shieldsRemaining: number = 5;
    private isShieldActive: boolean = false;
    private isPlayerShieldRegeneratingFlag: boolean = false;

    private canUseShield: boolean = true;
    private cooldownEndsAt: number = 0;

    private readonly SHIELD_DURATION = 15000;
    private readonly COOLDOWN_DURATION = 120000;

    constructor(
        gameObject: Phaser.GameObjects.GameObject,
        scene: Phaser.Scene,
        eventBusComponent: EventBusComponent
    ) {
        this.gameObject = gameObject;
        this.scene = scene;
        this.eventBusComponent = eventBusComponent;

        this.setupInputHandling();
        this.setupShieldRegenerationListeners();
        this.setupCooldownTimeRequests();
    }

    private setupShieldRegenerationListeners(): void {
        this.eventBusComponent.on('SHIELD_REGENERATION_STARTED', () => {
            this.isPlayerShieldRegeneratingFlag = true;
        });

        this.eventBusComponent.on('SHIELD_REGENERATION_STOPPED', () => {
            this.isPlayerShieldRegeneratingFlag = false;
        });

        this.eventBusComponent.on('SHIELD_SEGMENT_REPAIRED', () => {
            this.updateShieldColor();
        });
    }

    private setupInputHandling(): void {
        if (this.scene.input.keyboard) {
            this.scene.input.keyboard.on('keydown-C', () => {
                this.tryActivateShield();
            });
        }
    }

    private setupCooldownTimeRequests(): void {
        this.eventBusComponent.on('GET_SHIELD_COOLDOWN_TIME', (callback: (remainingTime: number) => void) => {
            if (callback && typeof callback === 'function') {
                const currentTime = this.scene.time.now;
                let remainingTime = 0;

                if (!this.canUseShield && currentTime < this.cooldownEndsAt) {
                    remainingTime = this.cooldownEndsAt - currentTime;
                }

                callback(remainingTime);
            }
        });
    }

    private tryActivateShield(): void {
        if (!this.canUseShield || this.shieldsRemaining <= 0 || this.isShieldActive) {
            return;
        }

        this.activateShield();
    }

    private activateShield(): void {
        this.shieldsRemaining--;
        this.isShieldActive = true;

        this.createShieldSprite();
        this.updateShieldColor();

        this.eventBusComponent.emit('SHIELD_UP_SOUND');
        this.eventBusComponent.emit('SHIELD_ACTIVATED', {
            remaining: this.shieldsRemaining,
            duration: this.SHIELD_DURATION
        });

        this.scene.time.delayedCall(this.SHIELD_DURATION, () => {
            this.deactivateShield();
        });

        this.startCooldown();
    }

    private updateShieldColor(): void {
        if (!this.shieldSprite) return;

        this.eventBusComponent.emit('GET_CURRENT_SHIELD_LEVEL', (currentShieldLevel: number) => {
            this.applyShieldColor(currentShieldLevel);
        });
    }

    private applyShieldColor(currentShieldLevel: number): void {
        if (!this.shieldSprite) return;

        const isRegenerating = this.isPlayerShieldRegeneratingFlag;
        let shieldTexture: string;
        let shieldColor: number;

        if (isRegenerating) {
            shieldTexture = 'shield2';
            shieldColor = 0xffdd00;
        } else if (currentShieldLevel >= 3) {
            shieldTexture = 'shield3';
            shieldColor = 0x00ff00;
        } else if (currentShieldLevel >= 2) {
            shieldTexture = 'shield2';
            shieldColor = 0xffff00;
        } else if (currentShieldLevel >= 1) {
            shieldTexture = 'shield1';
            shieldColor = 0xff0000;
        } else {
            shieldTexture = 'shield1';
            shieldColor = 0x404040;
        }

        this.shieldSprite.setTexture(shieldTexture);
        this.shieldSprite.setTint(shieldColor);
    }

    private createShieldSprite(): void {
        if (this.shieldSprite) return;

        const parent = this.gameObject as Phaser.GameObjects.Container;
        if (!parent) return;

        this.shieldSprite = this.scene.add.sprite(0, 0, 'shield2');
        this.shieldSprite.setScale(1.0);
        this.shieldSprite.setDepth(2);
        this.shieldSprite.setAlpha(0.8);
        this.shieldSprite.setTint(0x00ff00);

        parent.add(this.shieldSprite);

        this.scene.time.delayedCall(50, () => {
            this.updateShieldColor();
        });
    }

    private deactivateShield(): void {
        if (!this.isShieldActive) return;

        this.isShieldActive = false;

        if (this.shieldSprite) {
            this.shieldSprite.destroy();
            this.shieldSprite = undefined;
        }

        this.eventBusComponent.emit('SHIELD_DOWN_SOUND');
        this.eventBusComponent.emit('SHIELD_DEACTIVATED');
    }

    private startCooldown(): void {
        this.canUseShield = false;
        this.cooldownEndsAt = this.scene.time.now + this.COOLDOWN_DURATION;
        this.eventBusComponent.emit('SHIELD_COOLDOWN_STARTED', this.COOLDOWN_DURATION);
    }

    public update(): void {
        const currentTime = this.scene.time.now;

        if (!this.canUseShield && currentTime >= this.cooldownEndsAt) {
            this.canUseShield = true;
            this.eventBusComponent.emit('SHIELD_COOLDOWN_FINISHED');
        }
    }

    public get isActive(): boolean {
        return this.isShieldActive;
    }

    public get remainingShields(): number {
        return this.shieldsRemaining;
    }

    public get cooldownTimeRemaining(): number {
        if (this.canUseShield) return 0;

        const currentTime = this.scene.time.now;
        const remaining = Math.max(0, this.cooldownEndsAt - currentTime);
        return remaining;
    }

    public destroy(): void {
        this.eventBusComponent.off('SHIELD_REGENERATION_STARTED');
        this.eventBusComponent.off('SHIELD_REGENERATION_STOPPED');
        this.eventBusComponent.off('SHIELD_SEGMENT_REPAIRED');
        this.eventBusComponent.off('GET_SHIELD_COOLDOWN_TIME');

        if (this.scene.input.keyboard) {
            this.scene.input.keyboard.off('keydown-C');
        }

        if (this.shieldSprite) {
            this.shieldSprite.destroy();
            this.shieldSprite = undefined;
        }
    }
}
