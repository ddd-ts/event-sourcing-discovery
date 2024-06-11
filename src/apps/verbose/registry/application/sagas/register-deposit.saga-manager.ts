import type { Deposited } from "../../../account/domain/account";
import type { CommandBus } from "../../../framework/command-bus";
import type { DepositRegistered } from "../../domain/registry";
import { RegisterDepositSaga } from "./register-deposit.saga";
import { RegisterDepositSagaStore } from "./register-deposit.saga-store";

export class RegisterDepositSagaManager {
  constructor(
    private readonly registerDepositSagaStore: RegisterDepositSagaStore,
    private readonly commandBus: CommandBus,
  ) {}

  async onDeposited(event: Deposited) {
    const saga = RegisterDepositSaga.onDeposited(event, this.commandBus);
    await this.registerDepositSagaStore.save(saga);
  }

  async onDepositRegistered(event: DepositRegistered) {
    const saga = await this.registerDepositSagaStore.load(event.accountId);

    if (!saga) {
      throw new Error(`Cannot find RegisterDepositSaga for Account ${event.accountId}`);
    }

    saga.onDepositRegistered(event, this.commandBus);
    await this.registerDepositSagaStore.save(saga);
  }
}
