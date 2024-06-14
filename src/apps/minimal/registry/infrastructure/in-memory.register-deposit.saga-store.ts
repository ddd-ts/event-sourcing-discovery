import type { RegisterDepositSaga } from "../application/sagas/register-deposit.saga";
import type { RegisterDepositSagaStore } from "../application/sagas/register-deposit.saga-store";

export class InMemoryRegisterDepositSagaStore implements RegisterDepositSagaStore {
  sagas = new Map<string, RegisterDepositSaga>();

  async load(accountId: string): Promise<RegisterDepositSaga | undefined> {
    return this.sagas.get(accountId);
  }

  async save(saga: RegisterDepositSaga): Promise<void> {
    this.sagas.set(saga.accountId, saga);
  }
}
