export class RegistryOpened {
    constructor(public registryId: string) { }
}

export class AccountRegistered {
    constructor(public accountId: string) { }
}

export class DepositRegistered {
    constructor(public accountId: string, public amount: number) { }
}

export class WithdrawalRegistered {
    constructor(public accountId: string, public amount: number) { }
}

export class Registry {
    constructor(
        public readonly registryId: string,
        private balances: { [accountId: string]: number } = {}
    ) { }

    changes: (RegistryOpened | AccountRegistered | DepositRegistered | WithdrawalRegistered)[] = [];

    static new(event: RegistryOpened): Registry {
        const instance = Registry.onRegistryOpened(event);
        instance.changes.push(event);
        return instance;
    }

    apply(event: AccountRegistered | DepositRegistered | WithdrawalRegistered): void {
        if (event instanceof AccountRegistered) {
            this.onAccountRegistered(event);
        } else if (event instanceof DepositRegistered) {
            this.onDepositRegistered(event);
        } else if (event instanceof WithdrawalRegistered) {
            this.onWithdrawalRegistered(event);
        }
        this.changes.push(event);
    }

    registerAccount(accountId: string): void {
        this.apply(new AccountRegistered(accountId));
    }

    onAccountRegistered(event: AccountRegistered): void {
        this.balances[event.accountId] = 0;
    }

    registerDeposit(accountId: string, amount: number): void {
        this.apply(new DepositRegistered(accountId, amount));
    }

    onDepositRegistered(event: DepositRegistered): void {
        this.balances[event.accountId] += event.amount;
    }

    registerWithdrawal(accountId: string, amount: number): void {
        this.apply(new WithdrawalRegistered(accountId, amount));
    }

    onWithdrawalRegistered(event: WithdrawalRegistered): void {
        this.balances[event.accountId] -= event.amount;
    }

    static open() {
        return Registry.new(new RegistryOpened('123'));
    }

    static onRegistryOpened(event: RegistryOpened) {
        return new Registry(event.registryId)
    }
}