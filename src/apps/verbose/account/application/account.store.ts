import type { Account } from "../domain/account";

export interface AccountStore {
  load(accountId: string): Promise<Account | undefined>;
  save(account: Account): Promise<void>;
}
