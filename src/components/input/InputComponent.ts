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

    public reset(): void {
        this.up = false;
        this.down = false;
        this.left = false;
        this.right = false;
        this.shoot = false;
        this.shootSecondary = false;
    }

    public lockInput(value: boolean): void {
        this.inputLocked = value;
    }

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

    protected update(): void {
        if (this.inputLocked) {
            this.reset();
            return;
        }
    }
}
