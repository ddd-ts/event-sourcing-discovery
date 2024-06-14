import { Mapping } from "@ddd-ts/shape";
import { EsEvent } from "../../framework/quick/es-event";
import { Id } from "../../framework/quick/id";
import { AccountId } from "../../account/domain/account";
import { EsAggregate } from "../../framework/quick/es-aggregate";

export class RegistryId extends Id("Registry") { }

export class RegistryOpened extends EsEvent("RegistryOpened", {
  registryId: RegistryId,
}) { }

export class AccountRegistered extends EsEvent("AccountRegistered", {
  registryId: RegistryId,
  accountId: AccountId,
}) { }

export class DepositRegistered extends EsEvent('DepositRegistered', {
  registryId: RegistryId,
  accountId: AccountId,
  amount: Number
}) { }

export class WithdrawalRegistered extends EsEvent("WithdrawalRegistered", {
  registryId: RegistryId,
  accountId: AccountId,
  amount: Number,
}) { }

export class Registry extends EsAggregate("Registry", {
  registryId: RegistryId,
  balances: Mapping([String, Number]),
}, {
  birth: [RegistryOpened],
  life: [AccountRegistered, DepositRegistered, WithdrawalRegistered]
}) {
  registerAccount(accountId: AccountId): void {
    this.apply(AccountRegistered.new({ registryId: this.registryId, accountId }));
  }

  onAccountRegistered(event: AccountRegistered): void {
    this.balances[event.payload.accountId.toString()] = 0;
  }

  registerDeposit(accountId: AccountId, amount: number): void {
    this.apply(DepositRegistered.new({ registryId: this.registryId, accountId, amount }));
  }

  onDepositRegistered(event: DepositRegistered): void {
    this.balances[event.payload.accountId.toString()] += event.payload.amount;
  }

  registerWithdrawal(accountId: AccountId, amount: number): void {
    this.apply(WithdrawalRegistered.new({ registryId: this.registryId, accountId, amount }));
  }

  onWithdrawalRegistered(event: WithdrawalRegistered): void {
    this.balances[event.payload.accountId.toString()] -= event.payload.amount;
  }

  static open() {
    return Registry.new(RegistryOpened.new({ registryId: RegistryId.generate() }));
  }

  static onRegistryOpened(event: RegistryOpened) {
    return new Registry({
      registryId: event.payload.registryId,
      balances: {},
    });
  }
}
