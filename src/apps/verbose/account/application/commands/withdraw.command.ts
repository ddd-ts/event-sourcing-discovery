import type { AccountStore } from "../account.store";

export class WithdrawCommand {
  static readonly type = "WithdrawCommand";
  type = WithdrawCommand.type;
  constructor(
    public readonly accountId: string,
    public readonly amount: number,
  ) {}
}

export class WithdrawCommandHandler {
  constructor(private readonly accountStore: AccountStore) {}

  async execute(command: WithdrawCommand): Promise<void> {
    const account = await this.accountStore.load(command.accountId);

    if (!account) {
      throw new Error(`Cannot withdraw funds from not found Account ${command.accountId}`);
    }

    account.withdraw(command.amount);

    await this.accountStore.save(account);
  }
}
