import type { AccountStore } from "../account.store";

export class DepositCommand {
  static readonly type = "DepositCommand";
  readonly type = DepositCommand.type;
  constructor(
    public readonly accountId: string,
    public readonly amount: number,
  ) {}
}

export class DepositCommandHandler {
  constructor(private readonly accountStore: AccountStore) {}

  async execute(command: DepositCommand) {
    const account = await this.accountStore.load(command.accountId);

    if (!account) {
      throw new Error(`Cannot deposit funds on not found Account ${command.accountId}`);
    }

    account.deposit(command.amount);
    await this.accountStore.save(account);
  }
}
