import type { AccountOpened } from "../../../account/domain/account";
import type { CommandBus } from "../../../framework/command-bus";
import type { AccountRegistered } from "../../domain/registry";
import { RegisterAccountCommand } from "../commands/register-account.command";

export class RegisterAccountSaga {
  done = false;
  constructor(public readonly accountId: string) {}

  static onAccountOpened(event: AccountOpened, commandBus: CommandBus) {
    // TODO: use transactional outbox pattern on sagas
    commandBus.execute(new RegisterAccountCommand(event.payload.accountId, event.payload.registryId));
    return new RegisterAccountSaga(event.payload.accountId);
  }

  onAccountRegistered(event: AccountRegistered, commandBus: CommandBus) {
    this.done = true;
  }
}
