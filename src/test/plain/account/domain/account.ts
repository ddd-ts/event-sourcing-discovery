export class AccountOpened {
    constructor(public readonly accountId: string, public readonly registryId: string) { }
}

export class Deposited {
    constructor(public readonly accountId: string, public readonly registryId: string, public readonly amount: number) { }
}

export class Withdrawn {
    constructor(public readonly accountId: string, public readonly registryId: string, public readonly amount: number) { }
}

export class Account {

    constructor(
        public readonly accountId: string,
        public readonly registryId: string,
        private balance: number = 0
    ) { }

    changes: (AccountOpened | Deposited | Withdrawn)[] = [];

    static new(event: AccountOpened): Account {
        const instance = Account.onAccountOpened(event);
        instance.changes.push(event);
        return instance;
    }

    apply(event: Deposited | Withdrawn): void {
        if (event instanceof Deposited) {
            this.onDeposited(event);
        } else if (event instanceof Withdrawn) {
            this.onWithdrawn(event);
        }
        this.changes.push(event);
    }

    deposit(amount: number): void {
        this.apply(new Deposited(this.accountId, this.registryId, amount));
    }

    onDeposited(event: Deposited): void {
        this.balance += event.amount;
    }

    withdraw(amount: number): void {
        this.apply(new Withdrawn(this.accountId, this.registryId, amount));
    }

    onWithdrawn(event: Withdrawn): void {
        this.balance -= event.amount;
    }

    static open(registryId: string): Account {
        return Account.new(new AccountOpened('123', registryId));
    }

    static onAccountOpened(event: AccountOpened): Account {
        return new Account(event.accountId, event.registryId);
    }
}