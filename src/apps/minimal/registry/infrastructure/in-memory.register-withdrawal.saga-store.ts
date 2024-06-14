import type { RegisterWithdrawalSaga } from "../application/sagas/register-withdrawal.saga";
import type { RegisterWithdrawalSagaStore } from "../application/sagas/register-withdrawal.saga-store";

export class InMemoryRegisterWithdrawalSagaStore implements RegisterWithdrawalSagaStore {
  sagas = new Map<string, RegisterWithdrawalSaga>();

  async load(accountId: string): Promise<RegisterWithdrawalSaga | undefined> {
    return this.sagas.get(accountId);
  }

  async save(saga: RegisterWithdrawalSaga): Promise<void> {
    this.sagas.set(saga.accountId, saga);
  }
}
