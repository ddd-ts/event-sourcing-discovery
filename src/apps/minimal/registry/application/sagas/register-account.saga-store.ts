import { RegisterAccountSaga } from "./register-account.saga";

export interface RegisterAccountSagaStore {
  load(accountId: string): Promise<RegisterAccountSaga | undefined>;
  save(saga: RegisterAccountSaga): Promise<void>;
}
