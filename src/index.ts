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
    const account = Account.instantiate(AccountId.generate())
    account.apply(new AccountOpened({ id: account.id }))
    return account
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

  open() {
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

  static get id() {
    return "global";
  }

  static create() {
    return AccountRegistry.instantiate(this.id)
  }
}

//

let accountRegistry = AccountRegistry.create()
const accountStore = new InMemoryAccountStore();
const accountRegistryStore = new InMemoryAccountRegistryStore();

const account = Account.open();
account.deposit(1000);
account.withdraw(500);
await accountStore.save(account);

account.withdraw(700);
await accountStore.save(account);

accountRegistry = await accountRegistryStore.load(AccountRegistry.id);

if (accountRegistry.getFrozenAccounts().length !== 1) {
  throw new Error('Test failed')
}

// Allow stream migration
// From a stream1, create a derived stream2

/**
 * Account-8u1h -> Account-8u1h
 * Deposited    -> Opened
 * Opened       -> Deposited
 * Withdrawn    -> Withdrawn
 * 
 * Account-8u1h
 * TRUNCATE_BEFORE
 * Opened
 * Deposited
 * Withdrawn
 * CONTINUE
 * 
 * 
 * UserNotificationSettings-userid3
 * A 1
 * B 2
 * C 3
 * TRUNCATE_BEFORE
 * A 4 migration
 * B 5 migration
 * D 6 migration
 * CONTINUE
 * A 7                   ImagePublisherSaga (Folder 5, UNS 6)
 * 
 * Stream rewrite procedure:
 * - Add a lock to the stream,
 *   which will prevent any addition to the stream,
 *   mark previous events for scavenging,
 *   and new events for no-side effects (no run of sagas)
 *
 * - Write the migrated events to the stream, continuing from the current revision.
 * - Add an unlock to the stream, which marks new events for side-effects (run of sagas) and unblock additions to the stream



 * Account-8u1h-upstream ($Account-8u1h-*)
 * https://martendb.io/scenarios/copy-and-transform-stream
 * https://developers.eventstore.com/server/v24.2/streams.html#hard-delete
**/


function StreamMigrator(Aggregate: any) {
  abstract class C {
    abstract get stream(): Stream;
    abstract handle(event: Event);

    async migrate(id: typeof Aggregate['id']) {
      await this.eventStore.startMigration(Aggregate, id); // adds the lock event

      for await (const event of this.stream) {
        const migrated: Event[] = this.handle(event)
        for (const m of migrated) {
          m.markForMigration(); // notifies no side effects should be ran
          this.eventStore.append(Aggregate, id, m); // notifies saga and side effects
        }
      }

      // adds the unlock event
      // potentially gets rid of events marked for scavenging
      // projections will rebuild by reacting to the unlock event
      await this.eventStore.endMigration(Aggregate, id);
    }
  }
  return C;
}

abstract class AggregateStreamsMigrator<AggregateId> {
  abstract async streamIds(): AsyncIterator<AggregateId>;

  constructor(private readonly streamMigrator: InstanceType<ReturnType<typeof StreamMigrator>>) { }

  public run() {
    for await (const id of this.streamIds()) {
      await this.streamMigrator.migrate(id);
    }
  }
}

class AccountStreamMigrator extends StreamMigrator(Account) {
  override get stream() {
    return this.eventStore.read(Account, accountId);
  }

  override handle(event: Event) {
    return [];
  }
}

/**
 * // Stream of a single instance of an aggregate type
 * InstanceStream Account-1 // Stream
 * 
 * // Projected stream of all instances of an aggregate type
 * TypeStream Account-* // ByCategory $ce-xxx
 * 
 * // Projected stream of all events of a given type
 * EventTypeStream AccountOpened-* // ByEventType $et-xxx
 */



class AccountStreamsMigrator extends AggregateStreamsMigrator<AccountId> {
  override *streamIds() {
    for await (const accountOpened of this.stream.filter(e => e.is(AccountOpened))) {
      yield accountOpened.id;
    }
  }
}


const accountMigrator = new AccountStreamsMigrator(new AccountStreamMigrator());
accountMigrator.run();



class AccountThroughput {
  accountId: AccountId;
  throughput: number;
}

class AccountThroughputFromShit extends AccountThroughput {
  initFromMyShitAndStuff(accounts: Account[], randomNumber: number): void { }
}


/**
 * AccountThroughputProjectionStream
 * Deposited 0
 * Deposited 1
 */

class AccountThroughputProjection extends Projection {
  checkpoint = 1
  projectedStreamConfig = "select Witdrawn from Account"

  @Projection.rebuild()
  async init(accountId: AccountId) {
    const account = await this.accountStore.load(accountId)
    const throughput = new AccountThroughput({ id: accountId, balance: account.balance })
    await this.store.save(throughput)
  }

  @Projection.on(Deposited)
  onDeposited(event: Deposited, transaction: Transaction) {
    const accountThroughput = await this.store.load(event.accountId, transaction)

    // Auto projection
    accountThroughput.handle(event)

    this.store.save(accountThroughput, trx)
  }

  @Projection.on(Withdrawn)
  onWithdrawn(event: Withdrawn) {
    const accountThroughput = await this.store.load(event.accountId)
    accountThroughput.handle(event)
    this.store.save(accountThroughput)
  }
}


class IsolatedProjector {
  constructor(private readonly projection: Projection) { }

  start() {
    const checkpoint = this.projection.checkpointStore.load(this.projection);
    // compete used for distributed
    for await (const event of this.evenstore.follow(projection.configuration, checkpoint)) {
      this.transaction.perform(trx => {
        const checkpoint = this.projection.checkpointStore.load(this.projection, trx)
        if (event.revision !== checkpoint + 1) {
          throw new Error('Not consecutive')
        }
        await this.projection.handle(event, trx)
        this.checkpointStore.save(this, event.revision, trx)
      })
    }
  }
}

https://developers.eventstore.com/server/v24.2/projections.html