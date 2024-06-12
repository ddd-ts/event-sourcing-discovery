import { DepositCommand } from "../../../application/commands/deposit.command";

export class DepositCommandSerializer {
  serialize(command: DepositCommand) {
    return {
      type: command.type,
      accountId: command.accountId,
      amount: command.amount,
      version: 1,
    } as const;
  }

  deserialize(serialized: ReturnType<this["serialize"]>) {
    return new DepositCommand(serialized.accountId, serialized.amount);
  }
}
