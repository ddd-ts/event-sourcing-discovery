import type { AccountStore } from "./account.store";

export class WithdrawCommand {
    constructor(public readonly accountId: string, public readonly amount: number) { }
}

export class WithdrawCommandHandler {
    constructor(private readonly accountStore: AccountStore) { }

    async handle(command: WithdrawCommand): Promise<void> {
        const account = await this.accountStore.load(command.accountId)
        account.withdraw(command.amount);
        await this.accountStore.save(account);
    }
}