/**
 * AsteroidTrackerComponent - sleduje statistiky asteroidů
 */

import * as Phaser from 'phaser';
import { EventBusComponent } from '../events/EventBusComponent';

export interface AsteroidStats {
    type: 'small' | 'medium' | 'large';
    spawned: number;
    destroyed: number;
    escaped: number;
    maxSpawns: number;
}

export class AsteroidTrackerComponent {
    private scene: Phaser.Scene;
    private eventBusComponent: EventBusComponent;

    // UI elementy
    private container: Phaser.GameObjects.Container;
    private smallIcon: Phaser.GameObjects.Image;
    private mediumIcon: Phaser.GameObjects.Image;
    private largeIcon: Phaser.GameObjects.Image;
    private smallText: Phaser.GameObjects.Text;
    private mediumText: Phaser.GameObjects.Text;
    private largeText: Phaser.GameObjects.Text;
    private titleText: Phaser.GameObjects.Text;

    // Statistiky asteroidu
    private stats: Map<string, AsteroidStats> = new Map();

    constructor(scene: Phaser.Scene, x: number, y: number, eventBusComponent: EventBusComponent) {
        this.scene = scene;
        this.eventBusComponent = eventBusComponent;

        // Inicializovat statistiky
        this.initializeStats();

        // Vytvořit UI
        this.createUI(x, y);

        // Nastavit event listenery
        this.setupEventListeners();

        // Aktualizovat zobrazení
        this.updateDisplay();
    }

    private initializeStats(): void {
        this.stats.set('small', {
            type: 'small',
            spawned: 0,
            destroyed: 0,
            escaped: 0,
            maxSpawns: 80 // 80 malých asteroidů (rychlí, méně životů)
        });

        this.stats.set('medium', {
            type: 'medium',
            spawned: 0,
            destroyed: 0,
            escaped: 0,
            maxSpawns: 60 // 60 středních asteroidů (střední rychlost a životy)
        });

        this.stats.set('large', {
            type: 'large',
            spawned: 0,
            destroyed: 0,
            escaped: 0,
            maxSpawns: 40 // 40 velkých asteroidů (pomalí, více životů)
        });
    }

    private createUI(x: number, y: number): void {
        this.container = this.scene.add.container(x, y);

        // Pozadí panelu - kompaktní bez progress barů
        const background = this.scene.add.rectangle(0, 0, 300, 80, 0x000000, 0.5);
        background.setOrigin(0, 0);
        background.setStrokeStyle(1, 0x333333, 0.7);

        // Hlavní titulek - decentní
        this.titleText = this.scene.add.text(150, 8, 'ASTEROIDS: 0/180', {
            fontSize: '16px',
            color: '#00ffff',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5, 0);

        // Status text - menší a méně výrazný
        const statusText = this.scene.add.text(150, 26, 'Sestřeleno: 0/180', {
            fontSize: '12px',
            color: '#cccccc',
            fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5, 0);

        // Kompaktní řádky pouze s ikonkami a čísly - bez progress barů
        this.smallIcon = this.scene.add.image(30, 55, 'meteorBrown_small1').setScale(0.2);
        this.smallText = this.scene.add.text(50, 50, '0/80', {
            fontSize: '13px',
            color: '#cccccc',
            fontFamily: 'Arial'
        }).setOrigin(0, 0);

        this.mediumIcon = this.scene.add.image(120, 55, 'meteorBrown_med1').setScale(0.2);
        this.mediumText = this.scene.add.text(140, 50, '0/60', {
            fontSize: '13px',
            color: '#cccccc',
            fontFamily: 'Arial'
        }).setOrigin(0, 0);

        this.largeIcon = this.scene.add.image(210, 55, 'meteorBrown_big1').setScale(0.2);
        this.largeText = this.scene.add.text(230, 50, '0/40', {
            fontSize: '13px',
            color: '#cccccc',
            fontFamily: 'Arial'
        }).setOrigin(0, 0);

        // Uložit status text pro pozdější aktualizaci
        (this as any).statusText = statusText;

        // Přidáme do kontejneru pouze potřebné prvky - bez progress barů
        this.container.add([
            background,
            this.titleText,
            statusText,
            this.smallIcon,
            this.smallText,
            this.mediumIcon,
            this.mediumText,
            this.largeIcon,
            this.largeText
        ]);

        this.container.setDepth(100);
    }

    private setupEventListeners(): void {
        this.eventBusComponent.on('ASTEROID_SPAWNED', this.onAsteroidSpawned, this);
        this.eventBusComponent.on('ASTEROID_DESTROYED', this.onAsteroidDestroyed, this);
        this.eventBusComponent.on('ASTEROID_ESCAPED', this.onAsteroidEscaped, this);

        // Handler pro dotazy zda se může asteroid spawnovat
        this.eventBusComponent.on('CAN_SPAWN_ASTEROID', (type: string, callback: (result: boolean) => void) => {
            if (callback && typeof callback === 'function') {
                callback(this.canSpawnAsteroid(type));
            }
        });
    }

    private onAsteroidSpawned(asteroidSize: string): void {
        const stats = this.stats.get(asteroidSize);
        if (stats) {
            stats.spawned++;
            this.updateDisplay();
            this.checkGameEnd();
        }
    }

    private onAsteroidDestroyed(asteroidSize: string): void {
        console.log('Asteroid destroyed:', asteroidSize);
        const stats = this.stats.get(asteroidSize);
        if (stats) {
            stats.destroyed++;
            console.log(`${asteroidSize} stats:`, stats);
            this.updateDisplay();
            this.checkGameEnd();
        }
    }

    private onAsteroidEscaped(asteroidSize: string): void {
        console.log('🚀 Asteroid ESCAPED:', asteroidSize);
        const stats = this.stats.get(asteroidSize);
        if (stats) {
            stats.escaped++;
            console.log(`  ${asteroidSize} stats after escape:`, stats);
            console.log(`  Total escaped now: ${stats.escaped}/${stats.maxSpawns}`);
            this.updateDisplay();
            this.checkGameEnd();
        } else {
            console.log('❌ ERROR: No stats found for escaped asteroid type:', asteroidSize);
        }
    }

    private updateDisplay(): void {
        const smallStats = this.stats.get('small')!;
        const mediumStats = this.stats.get('medium')!;
        const largeStats = this.stats.get('large')!;

        // Aktualizovat jednotlivé texty - zobrazit sestřelené/celkové
        this.smallText.setText(`${smallStats.destroyed}/${smallStats.maxSpawns}`);
        this.mediumText.setText(`${mediumStats.destroyed}/${mediumStats.maxSpawns}`);
        this.largeText.setText(`${largeStats.destroyed}/${largeStats.maxSpawns}`);

        // Vypočítat progress statistiky
        const totalSpawned = smallStats.spawned + mediumStats.spawned + largeStats.spawned;
        const totalMax = smallStats.maxSpawns + mediumStats.maxSpawns + largeStats.maxSpawns;
        const totalDestroyed = smallStats.destroyed + mediumStats.destroyed + largeStats.destroyed;
        const totalEscaped = smallStats.escaped + mediumStats.escaped + largeStats.escaped;
        const totalProcessed = totalDestroyed + totalEscaped;
        const activeAsteroids = totalSpawned - totalProcessed;

        // Aktualizovat hlavní titulek - stručný
        this.titleText.setText(`ASTEROIDS: ${totalSpawned}/${totalMax}`);

        // Aktualizovat status text s detaily
        const statusText = (this as any).statusText;
        if (statusText) {
            statusText.setText(`Sestřeleno: ${totalDestroyed}/${totalMax}`);
        }

        // Progress bary odstraněny pro méně rušivé UI

        // Změnit barvu hlavního titulku podle stavu
        if (totalSpawned >= totalMax && activeAsteroids === 0) {
            this.titleText.setColor('#ff4444'); // Červená - všechny zpracovány, hra končí!
        } else if (totalSpawned >= totalMax) {
            this.titleText.setColor('#ffaa00'); // Oranžová - všechny spawnuty, čeká se na zpracování
        } else if (totalMax - totalSpawned <= 5) {
            this.titleText.setColor('#ffff00'); // Žlutá - skoro všechny spawnuty
        } else if (totalSpawned > 0) {
            this.titleText.setColor('#00ffff'); // Cyan - v průběhu spawnu
        } else {
            this.titleText.setColor('#ffffff'); // Bílá - začátek
        }

        // Změnit barvu podle stavu jednotlivých typů
        this.updateTextColor(this.smallText, smallStats);
        this.updateTextColor(this.mediumText, mediumStats);
        this.updateTextColor(this.largeText, largeStats);
    }

    private updateTextColor(text: Phaser.GameObjects.Text, stats: AsteroidStats): void {
        const totalProcessed = stats.destroyed + stats.escaped;
        if (totalProcessed >= stats.maxSpawns) {
            text.setColor('#ff4444'); // Červená - kompletní
        } else if (stats.destroyed > 0) {
            text.setColor('#ffff00'); // Žlutá - probíhá
        } else {
            text.setColor('#ffffff'); // Bílá - nezačalo
        }
    }

    private checkGameEnd(): void {
        const small = this.stats.get('small')!;
        const medium = this.stats.get('medium')!;
        const large = this.stats.get('large')!;

        const totalSpawned = small.spawned + medium.spawned + large.spawned;
        const totalDestroyed = small.destroyed + medium.destroyed + large.destroyed;
        const totalEscaped = small.escaped + medium.escaped + large.escaped;
        const totalProcessed = totalDestroyed + totalEscaped;

        console.log('🎯 GAME CHECK:');
        console.log('  Spawned:', totalSpawned, '/ 180');
        console.log('  Destroyed:', totalDestroyed);
        console.log('  Escaped:', totalEscaped);
        console.log('  Processed:', totalProcessed, '/ 180');
        console.log('  Small:', small.spawned, 'spawned,', small.destroyed, 'destroyed,', small.escaped, 'escaped');
        console.log('  Medium:', medium.spawned, 'spawned,', medium.destroyed, 'destroyed,', medium.escaped, 'escaped');
        console.log('  Large:', large.spawned, 'spawned,', large.destroyed, 'destroyed,', large.escaped, 'escaped');

        // NOVÁ LOGIKA: Hra končí když jsou všechny asteroidy zpracované (zničené nebo uniknuté)
        // bez ohledu na to, kolik jich bylo spawnutých
        const totalPossible = 180;
        const shouldEnd = totalProcessed >= totalPossible;

        console.log('  Should game end?', shouldEnd, '(processed:', totalProcessed, '>=', totalPossible, ')');

        if (shouldEnd) {
            console.log('🎉 GAME COMPLETED! All asteroids processed!');

            const percentage = Math.round((totalDestroyed / totalPossible) * 100);
            let message = '';

            if (percentage >= 90) message = 'EXCELLENT! Master Pilot!';
            else if (percentage >= 75) message = 'GREAT JOB! Space Ace!';
            else if (percentage >= 50) message = 'GOOD WORK! Keep practicing!';
            else message = 'GAME OVER! Try again!';

            this.eventBusComponent.emit('GAME_COMPLETED', {
                totalDestroyed,
                totalMax: totalPossible,
                percentage,
                message,
                stats: [small, medium, large]
            });
        } else {
            console.log('⏳ Waiting for completion. Need:', (totalPossible - totalProcessed), 'more asteroids to be processed');
        }
    }

    private showMotivationMessage(message: string): void {
        // Vytvoří dočasnou zprávu
        const motivationText = this.scene.add.text(
            this.scene.scale.width / 2,
            100,
            message,
            {
                fontSize: '24px',
                color: '#ffff00',
                fontFamily: 'Arial Black',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5).setDepth(200);

        // Animace objevení a zmizení
        this.scene.tweens.add({
            targets: motivationText,
            alpha: { from: 0, to: 1 },
            scale: { from: 0.5, to: 1.2 },
            duration: 500,
            ease: 'Back.easeOut',
            yoyo: true,
            hold: 1500,
            onComplete: () => {
                motivationText.destroy();
            }
        });
    }

    public canSpawnAsteroid(type: string): boolean {
        const stats = this.stats.get(type);
        if (!stats) return false;

        return stats.spawned < stats.maxSpawns;
    }

    public getStats(): Map<string, AsteroidStats> {
        return this.stats;
    }

    public destroy(): void {
        this.eventBusComponent.off('ASTEROID_SPAWNED', this.onAsteroidSpawned, this);
        this.eventBusComponent.off('ASTEROID_DESTROYED', this.onAsteroidDestroyed, this);
        this.eventBusComponent.off('ASTEROID_ESCAPED', this.onAsteroidEscaped, this);

        this.container.destroy();
    }
}
