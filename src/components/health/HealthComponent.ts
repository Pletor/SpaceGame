/**
 * Health Component - spravuje zdraví/životy objektů ve hře
 *
 * Funkce:
 * - Sleduje současný a počáteční počet životů
 * - Zpracovává zásahy a redukci životů
 * - Určuje stav smrti objektu
 * - Poskytuje reset funcionalitu pro respawn
 *
 * Princip:
 * Simple state management - život jako numerická hodnota
 * Immutable starting life pro reset funkcionalnost
 * Boolean dead state pro jasnou logiku
 */

export class HealthComponent {
    private startingLife: number;
    private currentLife: number;
    private isDead: boolean;

    constructor(life: number) {
        this.startingLife = life;
        this.currentLife = life;
        this.isDead = false;
    }

    /**
     * Vrací současný počet životů
     */
    public get life(): number {
        return this.currentLife;
    }

    /**
     * Vrací true pokud je objekt mrtvý
     */
    public get isDeadState(): boolean {
        return this.isDead;
    }

    /**
     * Resetuje zdraví na počáteční hodnotu - používá se při respawnu
     */
    public reset(): void {
        this.currentLife = this.startingLife;
        this.isDead = false;
    }

    /**
     * Zpracuje zásah - sníží život o 1
     */
    public hit(): void {
        if (this.isDead) return;

        this.currentLife -= 1;

        if (this.currentLife <= 0) {
            this.isDead = true;
        }
    }

    /**
     * Okamžitě zabije objekt
     */
    public die(): void {
        this.currentLife = 0;
        this.isDead = true;
    }
}
