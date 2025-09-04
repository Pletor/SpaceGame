/**
 * Shield Display Component - zobrazuje a spravuje systém štítů hráče
 */

import * as Phaser from 'phaser';
import { EventBusComponent, CUSTOM_EVENTS } from '../events/EventBusComponent';

export class ShieldDisplayComponent {
    private scene: Phaser.Scene;
    private eventBusComponent: EventBusComponent;
    private shieldText: Phaser.GameObjects.Text;
    private shieldBarGraphics: Phaser.GameObjects.Graphics;
    private maxShield: number = 3;
    private currentShield: number = 3;
    private isRegenerating: boolean = false;
    private regenerationProgress: number = 0;
    private lastHitTime: number = 0;
    private lastProcessedHitTime: number = 0;
    private hitDebounceTime: number = 100;
    private repairStartDelay: number = 30000;
    private repairSegmentTimes: number[] = [10000, 20000, 45000]; // Prodloužen poslední segment z 30s na 45s
    private currentRepairSegmentIndex: number = 0;
    private shieldBarWidth: number = 240;
    private shieldBarHeight: number = 25;

    constructor(scene: Phaser.Scene, x: number, y: number, eventBusComponent: EventBusComponent) {
        this.scene = scene;
        this.eventBusComponent = eventBusComponent;

        this.createShieldLabel(x, y);
        this.createShieldBarGraphics(x, y);
        this.setupDepths();
        this.setupEventListeners();

        // Synchronizovat počáteční stav štítu s hráčem
        this.eventBusComponent.emit('GET_PLAYER_SHIELD_LEVEL', (shieldLevel: number) => {
            this.currentShield = shieldLevel;
            this.updateDisplay();
        });
    }

    /**
     * Vytvoří textový label pro štíty
     */
    private createShieldLabel(x: number, y: number): void {
        this.shieldText = this.scene.add.text(x - this.shieldBarWidth/2, y - 40, 'SHIELD', {
            fontSize: '20px',
            color: '#00ffff',
            fontFamily: 'Arial Black',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0);
    }

    /**
     * Vytvoří grafické objekty pro štítový bar
     */
    private createShieldBarGraphics(x: number, y: number): void {
        this.shieldBarGraphics = this.scene.add.graphics();
        this.shieldBarGraphics.setPosition(x - this.shieldBarWidth/2, y - this.shieldBarHeight/2);
    }

    /**
     * Nastaví hloubky pro správné renderování
     */
    private setupDepths(): void {
        this.shieldText.setDepth(100);
        this.shieldBarGraphics.setDepth(101);
    }

    /**
     * Nastaví všechny event listenery
     */
    private setupEventListeners(): void {
        this.eventBusComponent.on('SHIELD_HIT', this.onShieldHit, this);
        this.eventBusComponent.on('SHIELD_DEPLETED', this.onShieldDepleted, this);
        this.eventBusComponent.on(CUSTOM_EVENTS.PLAYER_SPAWN, this.onPlayerSpawn, this);

        // Handler pro požadavky na aktuální level štítu
        this.eventBusComponent.on('GET_CURRENT_SHIELD_LEVEL', (callback: (level: number) => void) => {
            if (callback && typeof callback === 'function') {
                callback(this.currentShield);
            }
        });
    }

    /**
     * Zpracuje zásah štítu
     */
    private onShieldHit(): void {
        const currentTime = this.scene.time.now;

        if (currentTime - this.lastProcessedHitTime < this.hitDebounceTime) {
            return;
        }

        // Získat aktuální stav štítu z hráče místo vlastní kopie
        this.eventBusComponent.emit('GET_PLAYER_SHIELD_LEVEL', (shieldLevel: number) => {
            this.currentShield = shieldLevel;
        });

        this.lastHitTime = currentTime;
        this.lastProcessedHitTime = currentTime;

        this.updateDisplay();
        this.eventBusComponent.emit('SHIELD_DOWN_SOUND');
        this.stopRegenerationIfActive();

        if (this.currentShield <= 0) {
            this.eventBusComponent.emit('SHIELD_DEPLETED');
        }

        this.scene.time.delayedCall(this.repairStartDelay, () => {
            this.startRepairProcess();
        });
    }

    /**
     * Zastaví regeneraci pokud je aktivní
     */
    private stopRegenerationIfActive(): void {
        if (this.isRegenerating) {
            this.isRegenerating = false;
            this.regenerationProgress = 0;
            this.scene.tweens.killTweensOf(this);
        }
    }

    private onShieldDepleted(): void {
        // Shield is depleted, player should die
    }

    private onPlayerSpawn(): void {
        // Synchronizovat s aktuálním stavem hráče
        this.eventBusComponent.emit('GET_PLAYER_SHIELD_LEVEL', (shieldLevel: number) => {
            this.currentShield = shieldLevel;
        });

        this.regenerationProgress = 0;
        this.isRegenerating = false;
        this.lastHitTime = 0;
        this.currentRepairSegmentIndex = 0;

        this.scene.time.removeAllEvents();
        this.scene.tweens.killTweensOf(this);
        this.updateDisplay();
    }

    private startRepairProcess(): void {
        this.isRegenerating = true;
        this.regenerationProgress = 0;
        this.currentRepairSegmentIndex = 0;

        this.eventBusComponent.emit('SHIELD_REGENERATION_STARTED');
        this.repairShieldSegment();
    }

    private repairShieldSegment(): void {
        if (!this.isRegenerating || this.currentShield >= this.maxShield) return;

        const segmentRepairTime = this.repairSegmentTimes[this.currentRepairSegmentIndex];

        this.scene.tweens.add({
            targets: this,
            regenerationProgress: 100,
            duration: segmentRepairTime,
            ease: 'Linear',
            onUpdate: () => {
                this.updateDisplay();
            },
            onComplete: () => {
                this.regenerationProgress = 0;
                this.currentRepairSegmentIndex++;

                this.eventBusComponent.emit('SHIELD_UP_SOUND');
                this.eventBusComponent.emit('SHIELD_SEGMENT_REPAIRED');

                // Získat aktuální stav štítu z hráče po repair
                this.eventBusComponent.emit('GET_PLAYER_SHIELD_LEVEL', (shieldLevel: number) => {
                    this.currentShield = shieldLevel;

                    if (this.currentShield < this.maxShield) {
                        this.repairShieldSegment();
                    } else {
                        this.isRegenerating = false;
                        this.regenerationProgress = 0;
                        this.currentRepairSegmentIndex = 0;
                        this.eventBusComponent.emit('SHIELD_REGENERATION_STOPPED');
                    }

                    this.updateDisplay();
                });
            }
        });
    }

    private updateDisplay(): void {
        this.shieldBarGraphics.clear();

        // Background
        this.shieldBarGraphics.fillStyle(0x1a1a1a, 0.9);
        this.shieldBarGraphics.lineStyle(2, 0x00ffff, 0.8);
        this.shieldBarGraphics.fillRoundedRect(0, 0, 240, 25, 4);
        this.shieldBarGraphics.strokeRoundedRect(0, 0, 240, 25, 4);

        const availableWidth = 240 - 8;
        const segmentWidth = (availableWidth - (this.maxShield - 1) * 2) / this.maxShield;

        for (let i = 0; i < this.maxShield; i++) {
            const x = 4 + i * (segmentWidth + 2);
            const y = 4;
            const height = 17;

            if (i < this.currentShield) {
                // Active shield segment
                this.shieldBarGraphics.fillStyle(0x00ffff, 0.9);
                this.shieldBarGraphics.fillRoundedRect(x, y, segmentWidth, height, 2);

                this.shieldBarGraphics.fillStyle(0x88ffff, 0.6);
                this.shieldBarGraphics.fillRoundedRect(x + 1, y + 1, segmentWidth - 2, height - 2, 1);

            } else if (i === this.currentShield && this.isRegenerating) {
                // Currently repairing segment
                const progress = this.regenerationProgress / 100;
                const fillWidth = segmentWidth * progress;

                this.shieldBarGraphics.fillStyle(0x333333, 0.7);
                this.shieldBarGraphics.fillRoundedRect(x, y, segmentWidth, height, 2);

                if (fillWidth > 0) {
                    this.shieldBarGraphics.fillStyle(0xffdd00, 0.8);
                    this.shieldBarGraphics.fillRoundedRect(x, y, fillWidth, height, 2);

                    this.shieldBarGraphics.fillStyle(0xffff88, 0.4);
                    this.shieldBarGraphics.fillRoundedRect(x + 1, y + 1, Math.max(0, fillWidth - 2), height - 2, 1);
                }

            } else {
                // Inactive shield segment
                this.shieldBarGraphics.fillStyle(0x404040, 0.5);
                this.shieldBarGraphics.lineStyle(1, 0x666666, 0.6);
                this.shieldBarGraphics.fillRoundedRect(x, y, segmentWidth, height, 2);
                this.shieldBarGraphics.strokeRoundedRect(x, y, segmentWidth, height, 2);
            }
        }

        // Update text
        const shieldStatus = this.isRegenerating ?
            `REPAIR: ${Math.round(this.regenerationProgress)}%` :
            `SHIELD: ${this.currentShield}/${this.maxShield}`;

        this.shieldText.setText(shieldStatus);

        if (this.isRegenerating) {
            this.shieldText.setFill('#ffdd00');
        } else if (this.currentShield === 0) {
            this.shieldText.setFill('#ff4444');
        } else if (this.currentShield === this.maxShield) {
            this.shieldText.setFill('#00ff00');
        } else {
            this.shieldText.setFill('#ffdd00');
        }
    }

    public getCurrentShield(): number {
        return this.currentShield;
    }

    public getMaxShield(): number {
        return this.maxShield;
    }

    public destroy(): void {
        this.eventBusComponent.off('SHIELD_HIT', this.onShieldHit, this);
        this.eventBusComponent.off('SHIELD_DEPLETED', this.onShieldDepleted, this);
        this.eventBusComponent.off(CUSTOM_EVENTS.PLAYER_SPAWN, this.onPlayerSpawn, this);

        this.shieldText.destroy();
        this.shieldBarGraphics.destroy();
    }
}
