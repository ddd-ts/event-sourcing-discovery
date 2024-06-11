import type { EventSourcingEvent, Fact } from "../../framework/es-event";
import type { EventSourcedAggregate } from "../../framework/event-sourced-aggregate";
import { generateId } from "../../framework/id";

export class RegistryOpened implements EventSourcingEvent {
  static readonly type = "RegistryOpened";
  type = RegistryOpened.type;
  constructor(
    public readonly eventId: string,
    public readonly registryId: string,
    public revision?: number,
    public occurredAt?: Date,
  ) {}

  get payload() {
    return {
      registryId: this.registryId,
    };
  }

  static new(payload: RegistryOpened["payload"]) {
    return new RegistryOpened(generateId(), payload.registryId);
  }
}

export class AccountRegistered implements EventSourcingEvent {
  static readonly type = "AccountRegistered";
  type = AccountRegistered.type;
  constructor(
    public readonly eventId: string,
    public readonly registryId: string,
    public accountId: string,
    public revision?: number,
    public occurredAt?: Date,
  ) {}

  get payload() {
    return {
      accountId: this.accountId,
      registryId: this.registryId,
    };
  }

  static new(payload: AccountRegistered["payload"]) {
    return new AccountRegistered(generateId(), payload.registryId, payload.accountId);
  }
}

export class DepositRegistered implements EventSourcingEvent {
  static readonly type = "DepositRegistered";
  type = DepositRegistered.type;
  constructor(
    public readonly eventId: string,
    public readonly registryId: string,
    public accountId: string,
    public amount: number,
    public revision?: number,
    public occurredAt?: Date,
  ) {}

  get payload() {
    return {
      accountId: this.accountId,
      registryId: this.registryId,
      amount: this.amount,
    };
  }

  static new(payload: DepositRegistered["payload"]) {
    return new DepositRegistered(generateId(), payload.registryId, payload.accountId, payload.amount);
  }
}

export class WithdrawalRegistered implements EventSourcingEvent {
  static readonly type = "WithdrawalRegistered";
  type = WithdrawalRegistered.type;
  constructor(
    public readonly eventId: string,
    public readonly registryId: string,
    public accountId: string,
    public amount: number,
    public revision?: number,
    public occurredAt?: Date,
  ) {}

  get payload() {
    return {
      accountId: this.accountId,
      registryId: this.registryId,
      amount: this.amount,
    };
  }

  static new(payload: WithdrawalRegistered["payload"]) {
    return new WithdrawalRegistered(generateId(), payload.registryId, payload.accountId, payload.amount);
  }
}

export class Registry implements EventSourcedAggregate {
  static readonly type = "Registry";

  constructor(
    public readonly registryId: string,
    public balances: { [accountId: string]: number } = {},
  ) {}

  streamRevision = -1;

  changes: (RegistryOpened | AccountRegistered | DepositRegistered | WithdrawalRegistered)[] = [];

  static new(event: RegistryOpened): Registry {
    const instance = Registry.onRegistryOpened(event);
    instance.changes.push(event);
    return instance;
  }

  apply(event: AccountRegistered | DepositRegistered | WithdrawalRegistered): void {
    this.play(event);
    this.changes.push(event);
  }

  load(event: Fact<AccountRegistered> | Fact<DepositRegistered> | Fact<WithdrawalRegistered>): void {
    this.play(event as any);
    this.streamRevision = event.revision;
  }

  play(event: AccountRegistered | DepositRegistered | WithdrawalRegistered): void {
    if (event instanceof AccountRegistered) {
      this.onAccountRegistered(event);
    } else if (event instanceof DepositRegistered) {
      this.onDepositRegistered(event);
    } else if (event instanceof WithdrawalRegistered) {
      this.onWithdrawalRegistered(event);
    }
  }

  static instanciate(fact: Fact<RegistryOpened>): Registry {
    const instance = Registry.onRegistryOpened(fact as any);
    if (fact.revision !== 0) {
      throw new Error(`Cannot instanciate an aggregate from a fact with revision ${fact.revision}`);
    }
    instance.streamRevision = fact.revision;
    return instance;
  }

  acknowledgeChanges(): void {
    this.streamRevision = this.streamRevision + this.changes.length;
    this.changes = [];
  }

  registerAccount(accountId: string): void {
    this.apply(AccountRegistered.new({ registryId: this.registryId, accountId }));
  }

  onAccountRegistered(event: AccountRegistered): void {
    this.balances[event.accountId] = 0;
  }

  registerDeposit(accountId: string, amount: number): void {
    this.apply(DepositRegistered.new({ registryId: this.registryId, accountId, amount }));
  }

  onDepositRegistered(event: DepositRegistered): void {
    this.balances[event.accountId] += event.amount;
  }

  registerWithdrawal(accountId: string, amount: number): void {
    this.apply(WithdrawalRegistered.new({ registryId: this.registryId, accountId, amount }));
  }

  onWithdrawalRegistered(event: WithdrawalRegistered): void {
    this.balances[event.accountId] -= event.amount;
  }

  static open() {
    return Registry.new(RegistryOpened.new({ registryId: generateId() }));
  }

  static onRegistryOpened(event: RegistryOpened) {
    return new Registry(event.payload.registryId);
  }
}
