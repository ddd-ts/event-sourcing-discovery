import { Account } from "../domain/account";
import type { AccountStore } from "./account.store";

export class OpenAccountCommand {
    constructor(public readonly registryId: string) { }
}

export class OpenCommandHandler {
    constructor(
        private readonly accountStore: AccountStore
    ) { }

    async execute(command: OpenAccountCommand) {
        const account = Account.open(command.registryId);
        await this.accountStore.save(account);
    }
}