import type { RegisterAccountSaga } from "../application/sagas/register-account.saga";
import type { RegisterAccountSagaStore } from "../application/sagas/register-account.saga-store";

export class InMemoryRegisterAccountSagaStore implements RegisterAccountSagaStore {
  sagas = new Map<string, RegisterAccountSaga>();

  async load(accountId: string): Promise<RegisterAccountSaga | undefined> {
    return this.sagas.get(accountId);
  }

  async save(saga: RegisterAccountSaga): Promise<void> {
    this.sagas.set(saga.accountId, saga);
  }
}
