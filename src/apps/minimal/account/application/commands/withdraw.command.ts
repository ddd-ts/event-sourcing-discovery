import { Command } from "../../../framework/quick/command";
import { AccountId } from "../../domain/account";
import type { AccountStore } from "../account.store";

export class WithdrawCommand extends Command('Withdraw', { accountId: AccountId, amount: Number }) { }

export class WithdrawCommandHandler {
  constructor(private readonly accountStore: AccountStore) { }

  async execute({ payload }: WithdrawCommand): Promise<void> {
    const account = await this.accountStore.load(payload.accountId);

    if (!account) {
      throw new Error(`Cannot withdraw funds from not found Account ${payload.accountId}`);
    }

    account.withdraw(payload.amount);

    await this.accountStore.save(account);
  }
}
