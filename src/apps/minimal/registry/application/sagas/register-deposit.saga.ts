import type { Deposited } from "../../../account/domain/account";
import type { CommandBus } from "../../../framework/command-bus";
import type { DepositRegistered } from "../../domain/registry";
import { RegisterDepositCommand } from "../commands/register-deposit.command";

export class RegisterDepositSaga {
  done = false;
  constructor(public readonly accountId: string) {}

  static onDeposited(event: Deposited, commandBus: CommandBus) {
    void commandBus.execute(
      new RegisterDepositCommand(event.payload.accountId, event.payload.registryId, event.payload.amount),
    );
    return new RegisterDepositSaga(event.payload.accountId);
  }

  onDepositRegistered(event: DepositRegistered, commandBus: CommandBus) {
    this.done = true;
  }
}
