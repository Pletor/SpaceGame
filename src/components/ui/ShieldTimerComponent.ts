import { Scene } from 'phaser';

/**
 * Komponenta pro zobrazení časovače power-up štítu
 */
export class ShieldTimerComponent {
    private scene: Scene;
    private timerText: Phaser.GameObjects.Text;
    private isVisible: boolean = false;
    private remainingTime: number = 0;
    private timerInterval?: Phaser.Time.TimerEvent;

    constructor(scene: Scene) {
        this.scene = scene;
        this.createTimerDisplay();
    }

    /**
     * Vytvoří vizuální zobrazení timeru
     */
    private createTimerDisplay(): void {
        // Vytvořit text pro timer ve zlaté barvě
        this.timerText = this.scene.add.text(
            this.scene.cameras.main.width - 20, // Pravý horní roh
            80, // Pod UI elementy
            '',
            {
                fontSize: '20px',
                color: '#FFB000', // Zlatá barva odpovídající power-up štítu
                fontFamily: 'Arial, sans-serif',
                stroke: '#000000',
                strokeThickness: 2,
                align: 'right'
        });

        // Nastavit origin pro zarovnání doprava
        this.timerText.setOrigin(1, 0);

        // Nastavit hloubku pro zobrazení nad ostatními elementy
        this.timerText.setDepth(1000);

        // Zpočátku skrytý
        this.timerText.setVisible(false);

        console.log('ShieldTimer: Timer display created');
    }

    /**
     * Spustí countdown timer
     * @param duration Doba trvání v milisekundách
     */
    public startTimer(duration: number): void {
        this.remainingTime = Math.ceil(duration / 1000); // Převést na sekundy
        this.isVisible = true;
        this.timerText.setVisible(true);

        // Aktualizovat text okamžitě
        this.updateTimerDisplay();

        // Spustit interval pro countdown
        this.timerInterval = this.scene.time.addEvent({
            delay: 1000, // Každou sekundu
            callback: this.updateTimer,
            callbackScope: this,
            repeat: this.remainingTime - 1 // Opakovat dokud nedojde čas
        });

        console.log('ShieldTimer: Timer started for', this.remainingTime, 'seconds');
    }

    /**
     * Aktualizuje timer (odečte 1 sekundu)
     */
    private updateTimer(): void {
        this.remainingTime--;
        this.updateTimerDisplay();

        if (this.remainingTime <= 0) {
            this.stopTimer();
        }
    }

    /**
     * Aktualizuje zobrazení timeru
     */
    private updateTimerDisplay(): void {
        if (!this.timerText || !this.isVisible) return;

        // Formátovat čas (sekundy)
        const timeText = `⚡ ŠTÍT: ${this.remainingTime}s`;
        this.timerText.setText(timeText);

        // Změnit barvu podle zbývajícího času
        if (this.remainingTime <= 3) {
            // Červená pro poslední 3 sekundy
            this.timerText.setColor('#FF4444');

            // Blikání v posledních sekundách
            this.scene.tweens.add({
                targets: this.timerText,
                alpha: { from: 1, to: 0.3 },
                duration: 250,
                yoyo: true,
                ease: 'Power2'
            });
        } else if (this.remainingTime <= 5) {
            // Oranžová pro posledních 5 sekund
            this.timerText.setColor('#FF8800');
        } else {
            // Zlatá pro normální stav
            this.timerText.setColor('#FFB000');
            this.timerText.setAlpha(1); // Zastavit blikání
        }
    }

    /**
     * Zastaví timer
     */
    public stopTimer(): void {
        this.isVisible = false;
        this.remainingTime = 0;
        this.timerText.setVisible(false);

        if (this.timerInterval) {
            this.timerInterval.destroy();
            this.timerInterval = undefined;
        }

        console.log('ShieldTimer: Timer stopped');
    }

    /**
     * Prodlouží timer (při sebrání dalšího power-upu)
     * @param duration Nová doba trvání v milisekundách
     */
    public extendTimer(duration: number): void {
        // Zastavit současný timer
        if (this.timerInterval) {
            this.timerInterval.destroy();
        }

        // Spustit nový timer
        this.startTimer(duration);

        // Vizuální efekt prodloužení
        this.scene.tweens.add({
            targets: this.timerText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true,
            ease: 'Power2'
        });

        console.log('ShieldTimer: Timer extended to', duration / 1000, 'seconds');
    }

    /**
     * Získá zbývající čas v sekundách
     */
    public getRemainingTime(): number {
        return this.remainingTime;
    }

    /**
     * Kontroluje, zda je timer aktivní
     */
    public isActive(): boolean {
        return this.isVisible && this.remainingTime > 0;
    }

    /**
     * Vyčistí komponentu
     */
    public destroy(): void {
        if (this.timerInterval) {
            this.timerInterval.destroy();
        }

        if (this.timerText) {
            this.timerText.destroy();
        }

        console.log('ShieldTimer: Component destroyed');
    }
}
