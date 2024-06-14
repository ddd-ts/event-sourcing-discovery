import { DepositCommand } from "../../../application/commands/deposit.command";

export class DepositCommandSerializer {
  serialize(command: DepositCommand) {
    return { ...command.serialize(), version: 1 }
  }

  deserialize(serialized: ReturnType<this["serialize"]>) {
    return DepositCommand.deserialize(serialized);
  }
}
