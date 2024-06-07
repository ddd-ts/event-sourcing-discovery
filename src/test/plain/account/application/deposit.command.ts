import type { AccountStore } from "./account.store";

export class DepositCommand {
    constructor(public readonly accountId: string, public readonly amount: number) { }
}

export class DepositCommandHandler {
    constructor(private readonly accountStore: AccountStore) { }

    async execute(command: DepositCommand) {
        const account = await this.accountStore.load(command.accountId);
        account.deposit(command.amount);
        await this.accountStore.save(account);
    }
}