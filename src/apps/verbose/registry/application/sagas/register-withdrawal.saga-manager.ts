import type { Withdrawn } from "../../../account/domain/account";
import type { CommandBus } from "../../../framework/command-bus";
import type { WithdrawalRegistered } from "../../domain/registry";
import { RegisterWithdrawalSaga } from "./register-withdrawal.saga";
import { RegisterWithdrawalSagaStore } from "./register-withdrawal.saga-store";

export class RegisterWithdrawalSagaManager {
  constructor(
    private readonly registerWithdrawalSagaStore: RegisterWithdrawalSagaStore,
    private readonly commandBus: CommandBus,
  ) {}

  async onWithdrawn(event: Withdrawn) {
    const saga = RegisterWithdrawalSaga.onWithdrawn(event, this.commandBus);
    await this.registerWithdrawalSagaStore.save(saga);
  }

  async onWithdrawalRegistered(event: WithdrawalRegistered) {
    const saga = await this.registerWithdrawalSagaStore.load(event.accountId);

    if (!saga) {
      throw new Error(`Cannot find RegisterWithdrawalSaga for Account ${event.accountId}`);
    }

    saga.onWithdrawalRegistered(event, this.commandBus);
    await this.registerWithdrawalSagaStore.save(saga);
  }
}
