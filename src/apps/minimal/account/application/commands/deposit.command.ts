import type { AccountStore } from "../account.store";
import { Command } from "../../../framework/quick/command";
import { AccountId } from "../../domain/account";

export class DepositCommand extends Command('Deposit', {
  accountId: AccountId,
  amount: Number,
}) { }

export class DepositCommandHandler {
  constructor(private readonly accountStore: AccountStore) { }

  async execute({ payload }: DepositCommand) {
    const account = await this.accountStore.load(payload.accountId);

    if (!account) {
      throw new Error(`Cannot deposit funds on not found Account ${payload.accountId}`);
    }

    account.deposit(payload.amount);
    await this.accountStore.save(account);
  }
}
