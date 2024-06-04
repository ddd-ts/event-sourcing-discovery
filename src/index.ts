import { Primitive, Shape } from '@ddd-ts/shape';

class AccountId extends Primitive(String) { }

class AccountOpened extends Event({
  id: AccountId
}) { }

class Deposited extends Event({
  id: AccountId,
  amount: Number,
}) { }

class Withdrawn extends Event({
  id: AccountId,
  amount: Number
}) { }


const EventSourced = (events: any[]) => class {
  apply(event: any) {
    (this as any)[`on${event.constructor.name}`](event)
  }

  fail(error: Error) { }

  load(event: any) {
    const handler = this.loadHandlerFor(event.name)

    handler()

      (this as any)[`${event.constructor.name}`](event)
    this.acknowledgedRevision = event.revision
  }

  static load(id: AccountId) {
    const stream = this.eventStore.loadStream('Account', id)
    const aggregate = new this(id)

    for await (const event of stream) {
      aggregate.load(event)
    }

    return aggregate
  }
}


class Account extends EventSourced([
  AccountOpened,
  Deposited,
  Withdrawn
]) {
  balance = 0;
  // how to play events on the aggregate
  // how to rebuild

  static open() {
    this.apply(new AccountOpened({ id: AccountId.generate() }))
  }

  @Es.OnLoad(Deposited)
  onAccountOpened(event: AccountOpened) {
    this.balance = 0
  }

  deposit = (amount: number) => {
    this.apply(new Deposited({ id: this.id, amount }))
  }

  Es.on(Deposited)
  onDeposited(event: Deposited) {
    if (1 === 2) {
      this.error(new )
    }
    this.balance -= event.amount
  }


  withdraw(amount: number) {
    this.apply(new Withdrawn({ id: this.id, amount }))
  }

  freezeNegativeAccount(command: FreezeNegativeAccountCommand) {
    if (this.balance < 0) {
      this.apply(new AccountFrozen({ id: this.id, amount }))
    }
  }
}

// AccountOpened results in AccountAdded in AccountRegistry
class AccountAdded extends AccountOpened { }
class AccountDepositRegistered extends Event({ id: AccountId, amount: Number }) { }
class AccountWithdrawalRegistered extends Event({ id: AccountId, amount: Number }) { }

class AccountRegistry extends EventSourced([
  AccountAdded,
  AccountDepositRegistered,
  AccountWithdrawalRegistered,
]) {
  accounts: Record<string, number>;

  static open() {
    this.execute(Account.open())
  }

  // Stream<All Events from other streams I am listening for>
  // OriginStream is AllAccount stream filtered (here)
  static async initialize(originStream: Stream<AccountOpened | Deposited | Withdraw>) {
    const aggregate = new AccountRegistry()

    for await (const event of originStream) {
      this.handle(event);
    }
  }

  // Contains
  // A saga that listens on an event, and add it to the Aggregate stream (linkTo)
  @Es.forward(AccountOpened, event => new AccountAdded(event.id))
  onOpen(event: AccountAdded) {
    this.accounts[event.accountId] = 0;
  }

  @Es.forward(Deposited, event => new AccountDepositRegistered(event.id))
  onDeposited(event: AccountDepositRegistered) {
    this.accounts[event.accountId] += event.amount
  }

  @Es.forward(Withdrawn, event => new AccountWithdrawalRegistered(event.id))
  onDeposited(event: AccountWithdrawalRegistered) {
    this.accounts[event.accountId] -= event.amount
  }

  freezeNegatives() {
    for (const accountId of this.negatives) {
      this.commandBus.execute(new FreezeNegativeAccountCommand({ accountId }))
    }
  }
}