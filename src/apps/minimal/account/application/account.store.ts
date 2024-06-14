import type { Account, AccountId } from "../domain/account";

export interface AccountStore {
  load(accountId: AccountId): Promise<Account | undefined>;
  save(account: Account): Promise<void>;
}
