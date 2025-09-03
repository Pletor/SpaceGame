import * as Phaser from 'phaser';
import { EventBusComponent, CUSTOM_EVENTS } from '../events/EventBusComponent';

export class ShieldDisplayComponent {
    private scene: Phaser.Scene;
    private eventBusComponent: EventBusComponent;
    private shieldText: Phaser.GameObjects.Text;
    private shieldBarGraphics: Phaser.GameObjects.Graphics;
    private maxShield: number = 3;
    private currentShield: number = 3; // Start with full shield
    private isRegenerating: boolean = false;
    private regenerationProgress: number = 0; // 0-100 for loading progress
    private lastHitTime: number = 0; // Track when last hit occurred
    private lastProcessedHitTime: number = 0; // Track when we last processed a hit to prevent rapid-fire
    private hitDebounceTime: number = 100; // 100ms debounce between hits
    private repairStartDelay: number = 30000; // 30 seconds delay before repair starts
    private repairSegmentTimes: number[] = [10000, 20000, 30000]; // Progressive repair times: 10s, 20s, 30s
    private currentRepairSegmentIndex: number = 0; // Track which segment is being repaired
    private shieldBarWidth: number = 240; // Match cooldown bar width
    private shieldBarHeight: number = 25; // Match cooldown bar height

    constructor(scene: Phaser.Scene, x: number, y: number, eventBusComponent: EventBusComponent) {
        this.scene = scene;
        this.eventBusComponent = eventBusComponent;

        // Create luxury shield label (left aligned with more spacing from bar)
        this.shieldText = scene.add.text(x - this.shieldBarWidth/2, y - 40, 'SHIELD', {
            fontSize: '20px',
            color: '#00ffff',
            fontFamily: 'Arial Black',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0);

        // Create premium shield bar graphics
        this.shieldBarGraphics = scene.add.graphics();
        this.shieldBarGraphics.setPosition(x - this.shieldBarWidth/2, y - this.shieldBarHeight/2);

        // Set depth for rendering order
        this.shieldText.setDepth(100);
        this.shieldBarGraphics.setDepth(101);

        // Listen for shield events
        this.eventBusComponent.on('SHIELD_HIT', this.onShieldHit, this);
        this.eventBusComponent.on('SHIELD_DEPLETED', this.onShieldDepleted, this);
        this.eventBusComponent.on(CUSTOM_EVENTS.PLAYER_SPAWN, this.onPlayerSpawn, this);

        // Start periodic repair check (every 5 seconds)
        this.scene.time.addEvent({
            delay: 5000,
            callback: this.periodicRepairCheck,
            callbackScope: this,
            loop: true
        });

        this.updateDisplay();
    }

    private periodicRepairCheck(): void {
        // Check if we should start repair process
        if (this.currentShield < this.maxShield &&
            !this.isRegenerating &&
            this.lastHitTime > 0) {

            const timeSinceLastHit = this.scene.time.now - this.lastHitTime;
            if (timeSinceLastHit >= this.repairStartDelay) {
                console.log('Starting automatic shield repair after survival period...');
                this.startRepairProcess();
            }
        }
    }

    private onShieldHit(): void {
        const currentTime = this.scene.time.now;

        // Debounce rapid hits - prevent multiple hits in short succession
        if (currentTime - this.lastProcessedHitTime < this.hitDebounceTime) {
            console.log('Hit ignored due to debounce');
            return;
        }

        console.log(`onShieldHit called - current shield before: ${this.currentShield}`);

        if (this.currentShield > 0) {
            this.currentShield--;
            this.lastHitTime = currentTime;
            this.lastProcessedHitTime = currentTime;

            console.log(`Shield decreased to: ${this.currentShield}`);
            this.updateDisplay();

            // Play shield down sound
            this.eventBusComponent.emit('SHIELD_DOWN_SOUND');

            // Stop any ongoing regeneration
            if (this.isRegenerating) {
                this.isRegenerating = false;
                this.regenerationProgress = 0;
                this.scene.tweens.killTweensOf(this);
            }

            if (this.currentShield <= 0) {
                // Shield completely depleted - player dies
                console.log('Shield depleted - emitting SHIELD_DEPLETED');
                this.eventBusComponent.emit('SHIELD_DEPLETED');
            }

            // Start countdown for repair (30 seconds after hit)
            this.scheduleRepairCheck();
        } else {
            console.log('Shield already at 0, ignoring hit');
        }
    }

    private scheduleRepairCheck(): void {
        // Clear any existing repair check
        this.scene.time.removeAllEvents();

        // Schedule repair check after 30 seconds
        this.scene.time.delayedCall(this.repairStartDelay, () => {
            this.checkForRepairStart();
        });
    }

    private checkForRepairStart(): void {
        // Only start repair if:
        // 1. Shield is not full
        // 2. Enough time has passed since last hit
        // 3. Not already regenerating
        const timeSinceLastHit = this.scene.time.now - this.lastHitTime;

        if (this.currentShield < this.maxShield &&
            timeSinceLastHit >= this.repairStartDelay &&
            !this.isRegenerating) {

            console.log('Starting automatic shield repair...');
            this.startRepairProcess();
        }
    }

    private onShieldDepleted(): void {
        // Shield is depleted, player should die
        console.log('Shield depleted! Player should be destroyed.');
        // Note: SHIELD_DEPLETED event was already emitted in onShieldHit
    }

    private onPlayerSpawn(): void {
        // Reset shield when player respawns - full shield
        this.currentShield = this.maxShield;
        this.regenerationProgress = 0;
        this.isRegenerating = false;
        this.lastHitTime = 0;
        this.currentRepairSegmentIndex = 0; // Reset segment index

        // Clear any pending repair timers
        this.scene.time.removeAllEvents();
        this.scene.tweens.killTweensOf(this);

        this.updateDisplay();
        console.log('Player respawned with full shield');
    }

    private startRepairProcess(): void {
        console.log('Starting ship repair process...');
        this.isRegenerating = true;
        this.regenerationProgress = 0;
        this.currentRepairSegmentIndex = 0; // Reset segment index
        this.repairShieldSegment();
    }

    private repairShieldSegment(): void {
        if (!this.isRegenerating || this.currentShield >= this.maxShield) return;

        const segmentRepairTime = this.repairSegmentTimes[this.currentRepairSegmentIndex];
        console.log(`Repairing shield segment ${this.currentShield + 1}/${this.maxShield}... (${segmentRepairTime/1000}s)`);

        const repairTween = this.scene.tweens.add({
            targets: this,
            regenerationProgress: 100,
            duration: segmentRepairTime, // Progressive repair time for each segment
            ease: 'Linear',
            onUpdate: () => {
                this.updateDisplay();
            },
            onComplete: () => {
                // Complete one shield segment
                this.currentShield++;
                this.regenerationProgress = 0;
                this.currentRepairSegmentIndex++; // Move to next segment timing

                // Play shield up sound
                this.eventBusComponent.emit('SHIELD_UP_SOUND');

                console.log(`Shield segment repaired! Shield: ${this.currentShield}/${this.maxShield}`);

                if (this.currentShield < this.maxShield) {
                    // Continue repairing next segment immediately
                    this.repairShieldSegment();
                } else {
                    // All shields repaired
                    this.isRegenerating = false;
                    this.regenerationProgress = 0;
                    this.currentRepairSegmentIndex = 0; // Reset for next time
                    console.log('Ship repair complete! All shields restored.');
                }

                this.updateDisplay();
            }
        });
    }    private regenerateShield(): void {
        // Gradually regenerate shield
        const regenerateStep = () => {
            if (this.currentShield < this.maxShield) {
                this.currentShield++;
                this.updateDisplay();

                if (this.currentShield < this.maxShield) {
                    // Continue regenerating
                    this.scene.time.delayedCall(500, regenerateStep);
                } else {
                    // Shield fully regenerated
                    this.eventBusComponent.emit('SHIELD_REGENERATED');
                }
            }
        };

        regenerateStep();
    }

    private updateDisplay(): void {
        // Clear previous graphics
        this.shieldBarGraphics.clear();

        // Premium background
        this.shieldBarGraphics.fillStyle(0x1a1a1a, 0.9);
        this.shieldBarGraphics.lineStyle(2, 0x00ffff, 0.8);
        this.shieldBarGraphics.fillRoundedRect(0, 0, 240, 25, 4);
        this.shieldBarGraphics.strokeRoundedRect(0, 0, 240, 25, 4);

        // Calculate available width for shield segments (accounting for padding)
        const availableWidth = 240 - 8; // 4px padding on each side
        const segmentWidth = (availableWidth - (this.maxShield - 1) * 2) / this.maxShield; // 2px gap between segments

        for (let i = 0; i < this.maxShield; i++) {
            const x = 4 + i * (segmentWidth + 2); // 4px left padding + segments with 2px gaps
            const y = 4; // 4px top padding
            const height = 17; // 25px total height - 8px padding

            if (i < this.currentShield) {
                // Active shield segment - premium cyan with glow effect
                this.shieldBarGraphics.fillStyle(0x00ffff, 0.9);
                this.shieldBarGraphics.fillRoundedRect(x, y, segmentWidth, height, 2);

                // Inner glow
                this.shieldBarGraphics.fillStyle(0x88ffff, 0.6);
                this.shieldBarGraphics.fillRoundedRect(x + 1, y + 1, segmentWidth - 2, height - 2, 1);

            } else if (i === this.currentShield && this.isRegenerating) {
                // Currently repairing segment - animated loading bar
                const progress = this.regenerationProgress / 100;
                const fillWidth = segmentWidth * progress;

                // Background for loading segment
                this.shieldBarGraphics.fillStyle(0x333333, 0.7);
                this.shieldBarGraphics.fillRoundedRect(x, y, segmentWidth, height, 2);

                // Loading progress with premium gold color
                if (fillWidth > 0) {
                    this.shieldBarGraphics.fillStyle(0xffdd00, 0.8);
                    this.shieldBarGraphics.fillRoundedRect(x, y, fillWidth, height, 2);

                    // Loading animation glow
                    this.shieldBarGraphics.fillStyle(0xffff88, 0.4);
                    this.shieldBarGraphics.fillRoundedRect(x + 1, y + 1, Math.max(0, fillWidth - 2), height - 2, 1);
                }

            } else {
                // Inactive shield segment - dark with subtle outline
                this.shieldBarGraphics.fillStyle(0x404040, 0.5);
                this.shieldBarGraphics.lineStyle(1, 0x666666, 0.6);
                this.shieldBarGraphics.fillRoundedRect(x, y, segmentWidth, height, 2);
                this.shieldBarGraphics.strokeRoundedRect(x, y, segmentWidth, height, 2);
            }
        }

        // Update shield label text with luxury styling
        const shieldStatus = this.isRegenerating ?
            `REPAIR: ${Math.round(this.regenerationProgress)}%` :
            `SHIELD: ${this.currentShield}/${this.maxShield}`;

        this.shieldText.setText(shieldStatus);

        // Dynamic color based on shield status
        if (this.isRegenerating) {
            this.shieldText.setFill('#ffdd00'); // Gold during repair
        } else if (this.currentShield === 0) {
            this.shieldText.setFill('#ff4444'); // Red when no shield
        } else if (this.currentShield === this.maxShield) {
            this.shieldText.setFill('#00ff00'); // Green when full
        } else {
            this.shieldText.setFill('#ffdd00'); // Gold when partial
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
