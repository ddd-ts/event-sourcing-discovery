import { RegisterDepositSaga } from "./register-deposit.saga";

export interface RegisterDepositSagaStore {
  load(accountId: string): Promise<RegisterDepositSaga | undefined>;
  save(saga: RegisterDepositSaga): Promise<void>;
}
