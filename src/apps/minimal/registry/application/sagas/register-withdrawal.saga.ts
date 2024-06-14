import type { Withdrawn } from "../../../account/domain/account";
import type { CommandBus } from "../../../framework/command-bus";
import type { WithdrawalRegistered } from "../../domain/registry";
import { RegisterWithdrawalCommand } from "../commands/register-withdrawal.command";

export class RegisterWithdrawalSaga {
  done = false;
  constructor(public readonly accountId: string) {}

  static onWithdrawn(event: Withdrawn, commandBus: CommandBus) {
    void commandBus.execute(new RegisterWithdrawalCommand(event.accountId, event.registryId, event.amount));
    return new RegisterWithdrawalSaga(event.accountId);
  }

  onWithdrawalRegistered(event: WithdrawalRegistered, commandBus: CommandBus) {
    this.done = true;
  }
}
