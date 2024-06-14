import type { Fact } from "../../framework/es-event";
import { AggregateStreamConfiguration } from "../../framework/event-store";
import type { InMemoryEventStore } from "../../framework/event-store/in-memory/in-memory.event-store";
import { AccountStore } from "../application/account.store";
import { Account, AccountId } from "../domain/account";
import { AccountOpenedSerializer1n } from "./serializers/events/account-opened.serializer";
import { DepositedSerializer1n } from "./serializers/events/deposited.serializer";
import { WithdrawnSerializer1n } from "./serializers/events/withdrawn.serializer";

type EventSerializer<T> = {
  deserialize(serialized: Fact): T;
  serialize(event: T): Fact;
};

export class InMemoryAccountStore implements AccountStore {
  constructor(private readonly eventStore: InMemoryEventStore) { }

  accountOpenedSerializer = new AccountOpenedSerializer1n();
  depositedSerializer = new DepositedSerializer1n();
  withdrawnSerializer = new WithdrawnSerializer1n();

  deserialize(event: any): any {
    switch (event.type) {
      case "AccountOpened":
        return this.accountOpenedSerializer.deserialize(event);
      case "Deposited":
        return this.depositedSerializer.deserialize(event);
      case "Withdrawn":
        return this.withdrawnSerializer.deserialize(event);
      default:
        throw new Error(`Unknown event type: ${event.type}`);
    }
  }

  serialize(event: any) {
    switch (event.type) {
      case "AccountOpened":
        return this.accountOpenedSerializer.serialize(event);
      case "Deposited":
        return this.depositedSerializer.serialize(event);
      case "Withdrawn":
        return this.withdrawnSerializer.serialize(event);
      default:
        throw new Error(`Unknown event type: ${event.type}`);
    }
  }

  async load(accountId: AccountId): Promise<Account | undefined> {
    const stream = new AggregateStreamConfiguration(Account.type, accountId);

    const events = await this.eventStore.readAggregateStream(stream, 0);
    if (!events) {
      return undefined;
    }

    let account: Account | undefined = undefined;

    for await (const event of events) {
      if (!account) {
        account = Account.instantiate(this.deserialize(event));
      } else {
        account.load(this.deserialize(event));
      }
    }

    return account;
  }

  async save(account: Account): Promise<void> {
    const streamId = new AggregateStreamConfiguration(Account.type, account.accountId);
    const expectedRevision = account.streamRevision;
    const serialized = account.changes.map((change) => this.serialize(change));
    await this.eventStore.appendToAggregateStream(streamId, serialized, expectedRevision);
    account.acknowledgeChanges();
  }
}
