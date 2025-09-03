export class HealthComponent {
    private startingLife: number;
    private currentLife: number;
    private isDead: boolean;

    constructor(life: number) {
        this.startingLife = life;
        this.currentLife = life;
        this.isDead = false;
    }

    public get life(): number {
        return this.currentLife;
    }

    public get isDeadState(): boolean {
        return this.isDead;
    }

    public reset(): void {
        this.currentLife = this.startingLife;
        this.isDead = false;
    }

    public hit(): void {
        if (this.isDead) return;

        this.currentLife -= 1;

        if (this.currentLife <= 0) {
            this.isDead = true;
        }
    }

    public die(): void {
        this.currentLife = 0;
        this.isDead = true;
    }
}
