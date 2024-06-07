import type { Account } from "../domain/account";

export interface AccountStore {
    load(accountId: string): Promise<Account>;
    save(account: Account): Promise<void>;
}