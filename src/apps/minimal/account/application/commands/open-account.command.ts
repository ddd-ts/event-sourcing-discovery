import { Command } from "../../../framework/quick/command";
import { RegistryId } from "../../../registry/domain/registry";
import { Account } from "../../domain/account";
import type { AccountStore } from "../account.store";

export class OpenAccountCommand extends Command("OpenAccount", {
  registryId: RegistryId
}) { }

export class OpenAccountCommandHandler {
  constructor(private readonly accountStore: AccountStore) { }

  async execute({ payload }: OpenAccountCommand) {
    const account = Account.open(payload.registryId);
    await this.accountStore.save(account);
    return account.accountId;
  }
}
