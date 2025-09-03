/**
 * Input Component - abstraktní základní třída pro vstupní systémy
 *
 * Funkce:
 * - Definuje standardní interface pro všechny typy vstupu
 * - Poskytuje input locking mechanismus pro cutscenes a menu
 * - Abstrahuje různé vstupní zařízení (klávesnice, gamepad, touch)
 * - Centralizuje řízení herních akcí
 *
 * Princip:
 * Abstract factory pattern - definuje contract pro konkrétní implementace
 * State management - sleduje stav všech herních akcí
 * Input locking - umožňuje dočasně zablokovat vstup
 */

export abstract class InputComponent {
    protected up: boolean = false;
    protected down: boolean = false;
    protected left: boolean = false;
    protected right: boolean = false;
    protected shoot: boolean = false;
    protected shootSecondary: boolean = false;
    private inputLocked: boolean = false;

    constructor() {
        this.reset();
    }

    /**
     * Resetuje všechny vstupní stavy na false
     */
    public reset(): void {
        this.up = false;
        this.down = false;
        this.left = false;
        this.right = false;
        this.shoot = false;
        this.shootSecondary = false;
    }

    /**
     * Zamkne nebo odemkne vstup (používá se při cutscenes a menu)
     */
    public lockInput(value: boolean): void {
        this.inputLocked = value;
    }

    // Gettery pro čtení stavu vstupů
    public get leftIsDown(): boolean {
        return this.left;
    }

    public get rightIsDown(): boolean {
        return this.right;
    }

    public get upIsDown(): boolean {
        return this.up;
    }

    public get downIsDown(): boolean {
        return this.down;
    }

    public get shootIsDown(): boolean {
        return this.shoot;
    }

    public get shootSecondaryIsDown(): boolean {
        return this.shootSecondary;
    }

    /**
     * Základní update metoda - potomci ji rozšiřují o specifickou logiku
     */
    protected update(): void {
        if (this.inputLocked) {
            this.reset();
            return;
        }
    }
}
