import { RegisterWithdrawalSaga } from "./register-withdrawal.saga";

export interface RegisterWithdrawalSagaStore {
  load(accountId: string): Promise<RegisterWithdrawalSaga | undefined>;
  save(saga: RegisterWithdrawalSaga): Promise<void>;
}
