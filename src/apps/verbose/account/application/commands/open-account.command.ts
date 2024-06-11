import { Account } from "../../domain/account";
import type { AccountStore } from "../account.store";

export class OpenAccountCommand {
  static readonly type = "OpenAccountCommand";
  type = OpenAccountCommand.type;
  constructor(public readonly registryId: string) {}
}

export class OpenAccountCommandHandler {
  constructor(private readonly accountStore: AccountStore) {}

  async execute(command: OpenAccountCommand) {
    const account = Account.open(command.registryId);
    await this.accountStore.save(account);
    return account.accountId;
  }
}
