import type { EventSourcedAggregate } from "../../framework/event-sourced-aggregate";
import { EsAggregate } from "../../framework/quick/es-aggregate";
import { EsEvent } from "../../framework/quick/es-event";
import { Id } from "../../framework/quick/id";
import { RegistryId } from "../../registry/domain/registry";

export class AccountId extends Id("AccountId") { }

export class AccountOpened extends EsEvent("AccountOpened", {
  accountId: AccountId,
  registryId: RegistryId,
}) { }

export class Deposited extends EsEvent("Deposited", {
  accountId: AccountId,
  registryId: RegistryId,
  amount: Number,
}) { }

export class Withdrawn extends EsEvent("Withdrawn", {
  accountId: AccountId,
  registryId: RegistryId,
  amount: Number,
}) { }

export class Account extends EsAggregate("Account", {
  accountId: AccountId,
  registryId: RegistryId,
  balance: Number,
}, {
  birth: [AccountOpened],
  life: [Deposited, Withdrawn],
}) implements EventSourcedAggregate {

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
    // Do we really want the payload nesting here?
    this.balance -= event.payload.amount;
  }

  static open(registryId: RegistryId): Account {
    return Account.new(AccountOpened.new({ accountId: AccountId.generate(), registryId }));
  }

  static onAccountOpened(event: AccountOpened): Account {
    return new Account({
      accountId: event.payload.accountId,
      registryId: event.payload.registryId,
      balance: 0
    })
  }
}
