import { Mapping, Primitive, Shape } from "@ddd-ts/shape";
import { EsEvent, EventSourced, Snapshottable } from ".";
import { Derive } from "@ddd-ts/traits";

class AccountId extends Primitive(String) {
    static generate() {
        return new AccountId(Math.random().toString(36).substring(7));
    }
}

class AccountOpened extends EsEvent({
    type: "AccountOpened",
    aggregateId: AccountId,
}) { }

class Deposited extends EsEvent({
    type: "Deposited",
    aggregateId: AccountId,
    amount: Number,
}) { }

class Withdrawn extends EsEvent({
    type: "Withdrawn",
    aggregateId: AccountId,
    amount: Number,
}) { }

class Account extends Derive(
    EventSourced([
        AccountOpened,
        Deposited,
        Withdrawn
    ]),
    Snapshottable({
        id: AccountId,
        balance: Number,
    })
) {
    @Es.on(AccountOpened)
    static onAccountOpened(event: AccountOpened) {
        return new this({ id: event.aggregateId, balance: 0 });
    }

    static open() {
        return Account.new(AccountOpened.new(AccountId.generate(), {}));
    }

    deposit(amount: number) {
        return this.apply(Deposited.new(this.id, { amount }));
    }

    @Es.on(Deposited)
    onDeposited(event: Deposited) {
        this.balance += event.payload.amount;
    }

    withdraw(amount: number) {
        return this.apply(Withdrawn.new(this.id, { amount }));
    }

    @Es.on(Withdrawn)
    onWithdrawn(event: Withdrawn) {
        if (this.balance < event.payload.amount) {
            this.fail(new Error("Insufficient funds"));
        }

        this.balance -= event.payload.amount;
    }
}


class AccountAdded extends EsEvent({
    type: "AccountAdded",
    aggregateId: AccountId,
}) { }

class AccountDepositRegistered extends EsEvent({
    type: "AccountDepositRegistered",
    aggregateId: AccountId,
    amount: Number,
}) { }

class AccountWithdrawalRegistered extends EsEvent({
    type: "AccountWithdrawalRegistered",
    aggregateId: AccountId,
    amount: Number,
}) { }

class AccountRegistry extends Derive(
    EventSourced([
        AccountAdded,
        AccountDepositRegistered,
        AccountWithdrawalRegistered,
    ]),
    Snapshottable({
        id: "global",
        accounts: Mapping([String, Number]),
    }),
) {

    static id = "global" as const

    static createGlobal() {
        return new AccountRegistry({
            id: this.id,
            accounts: {},
        });
    }

    @Saga.forward(AccountOpened, event => AccountAdded.new(event.aggregateId, {}))
    onAccountAdded(event: AccountAdded) {
        this.accounts[event.aggregateId.serialize()] = 0;
    }

    @Saga.forward(Deposited, event => AccountDepositRegistered.new(event.aggregateId, { amount: event.payload.amount }))
    onAccountDepositRegistered(event: AccountDepositRegistered) {
        this.accounts[event.aggregateId.serialize()] += event.payload.amount;
    }

    @Saga.forward(Withdrawn, event => AccountWithdrawalRegistered.new(event.aggregateId, { amount: event.payload.amount }))
    onAccountWithdrawalRegistered(event: AccountWithdrawalRegistered) {
        this.accounts[event.aggregateId.serialize()] -= event.payload.amount;
    }

    static create() {
        return AccountRegistry.instantiate(this.id)
    }
}


class AccountCashflow extends Shape({
    id: AccountId,
    amount: Number,
}) {
    @Projection.on(AccountOpened)
    static onOpened(id: AccountId, amount: number) {
        return new AccountCashflow({ id, amount });
    }

    @Projection.on(Deposited)
    onDeposited(event: Deposited) {
        this.amount += event.payload.amount;
    }

    @Projection.on(Withdrawn)
    onWithdrawn(event: Withdrawn) {
        this.amount += event.payload.amount;
    }
}

const dddtsregistry = new DDDTSRegistry()
    .registerAggregate(Account)
    .registerAggregate(AccountRegistry)
    .registerProjection(AccountCashflow);

dddtsregistry.buildSDK()