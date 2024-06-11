import type { EventSourcingEvent, Fact } from "../../framework/es-event";
import type { EventSourcedAggregate } from "../../framework/event-sourced-aggregate";
import { generateId } from "../../framework/id";

export interface AccountOpened extends EventSourcingEvent {
  type: "AccountOpened";
  occurredAt?: Date;
  revision?: number;
  payload: {
    accountId: string;
    registryId: string;
  };
}

export class Deposited implements EventSourcingEvent {
  static readonly type = "Deposited";
  type = Deposited.type;
  constructor(
    public readonly eventId: string,
    public readonly payload: {
      accountId: string;
      registryId: string;
      amount: number;
    },
    public readonly revision?: number,
    public readonly occurredAt?: Date,
  ) {}

  static new(payload: Deposited["payload"]) {
    return new Deposited(generateId(), payload);
  }
}

export class Withdrawn {
  static readonly type = "Withdrawn";
  type = Withdrawn.type;
  constructor(
    public readonly eventId: string,
    public readonly accountId: string,
    public readonly registryId: string,
    public readonly amount: number,
    public readonly revision?: number,
    public readonly occurredAt?: Date,
  ) {}

  get payload() {
    return {
      accountId: this.accountId,
      registryId: this.registryId,
      amount: this.amount,
    };
  }

  static new(payload: Withdrawn["payload"]) {
    return new Withdrawn(generateId(), payload.accountId, payload.registryId, payload.amount);
  }
}

export class Account implements EventSourcedAggregate {
  static readonly type = "Account";

  constructor(
    public readonly accountId: string,
    public readonly registryId: string,
    private balance = 0,
  ) {}

  streamRevision = -1;

  changes: (AccountOpened | Deposited | Withdrawn)[] = [];

  static instanciate(fact: Fact<AccountOpened>): Account {
    const instance = Account.onAccountOpened(fact);
    if (fact.revision !== 0) {
      throw new Error(`Cannot instanciate an aggregate from a fact with revision ${fact.revision}`);
    }
    instance.streamRevision = fact.revision;
    return instance;
  }

  static new(event: AccountOpened): Account {
    const instance = Account.onAccountOpened(event);
    instance.changes.push(event);
    return instance;
  }

  apply(event: Deposited | Withdrawn): void {
    this.play(event);
    this.changes.push(event);
  }

  load(event: Deposited | Withdrawn): void {
    if (event.revision === -1) {
      throw new Error("Cannot load a change, must be a fact.");
    }

    if (event.revision !== this.streamRevision + 1) {
      throw new Error(
        `Cannot load change with revision ${event.revision} when current revision is ${this.streamRevision}`,
      );
    }

    this.play(event);
    this.streamRevision = event.revision;
  }

  play(event: Deposited | Withdrawn): void {
    if (event instanceof Deposited) {
      this.onDeposited(event);
    } else if (event instanceof Withdrawn) {
      this.onWithdrawn(event);
    }
  }

  acknowledgeChanges(): void {
    this.streamRevision = this.streamRevision + this.changes.length;
    this.changes = [];
  }

  deposit(amount: number): void {
    this.apply(Deposited.new({ accountId: this.accountId, registryId: this.registryId, amount }));
  }

  onDeposited(event: Deposited): void {
    this.balance += event.payload.amount;
  }

  withdraw(amount: number): void {
    this.apply(Withdrawn.new({ accountId: this.accountId, registryId: this.registryId, amount }));
  }

  onWithdrawn(event: Withdrawn): void {
    this.balance -= event.amount;
  }

  static open(registryId: string): Account {
    return Account.new({
      eventId: generateId(),
      type: "AccountOpened",
      payload: {
        accountId: generateId(),
        registryId,
      },
    });
  }

  static onAccountOpened(event: AccountOpened): Account {
    return new Account(event.payload.accountId, event.payload.registryId);
  }
}
