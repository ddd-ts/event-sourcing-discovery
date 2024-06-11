import type { AccountOpened } from "../../../account/domain/account";
import type { InMemoryCommandBus } from "../../../framework/command-bus";
import type { AccountRegistered } from "../../domain/registry";
import { RegisterAccountSaga } from "./register-account.saga";
import { RegisterAccountSagaStore } from "./register-account.saga-store";

export class RegisterAccountSagaManager {
  constructor(
    private readonly registerAccountSagaStore: RegisterAccountSagaStore,
    private readonly commandBus: InMemoryCommandBus,
  ) {}

  async onAccountOpened(event: AccountOpened) {
    const saga = RegisterAccountSaga.onAccountOpened(event, this.commandBus);
    await this.registerAccountSagaStore.save(saga);
  }

  async onAccountRegistered(event: AccountRegistered) {
    const saga = await this.registerAccountSagaStore.load(event.accountId);

    if (!saga) {
      throw new Error(`Cannot find RegisterAccountSaga for Account ${event.accountId}`);
    }

    saga.onAccountRegistered(event, this.commandBus);

    await this.registerAccountSagaStore.save(saga);
  }
}
