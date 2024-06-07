import { AccountStore } from '../application/account.store';
import type { Account } from '../domain/account';

export class InMemoryAccountStore implements AccountStore {
    load(accountId: string): Promise<Account> {
        throw new Error('Method not implemented.');
    }

    save(account: Account): Promise<void> {
        throw new Error('Method not implemented.');
    }
}