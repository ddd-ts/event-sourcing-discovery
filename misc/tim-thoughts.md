// import {
//   Class,
//   Dict,
//   Literal,
//   Mapping,
//   Primitive,
//   Shape,
//   type AbstractConstructor,
//   type ClassShorthand,
//   type Constructor,
//   type DefinitionOf,
//   type DictShorthand,
//   type PrimitiveShorthand,
//   type Shorthand,
// } from "@ddd-ts/shape";
// import { Derive, Subtrait, Trait, type ImplementsTrait } from "@ddd-ts/traits";

// type AggregateId = { serialize(): string };

// type IEsEvent = {
//   type: string;
//   aggregateId: AggregateId;
//   revision: number;
//   payload: unknown;
// };

// type InstanceOf<T> = T extends AbstractConstructor<infer U> ? U : never;

// export const EsEvent = <
//   const S extends { aggregateId: ClassShorthand; type: string },
// >({
//   aggregateId: on,
//   type,
//   ...rest
// }: S) => {
//   type Id = S["aggregateId"];
//   const Base = Dict({
//     id: String,
//     type: type as S["type"],
//     aggregateId: on as S["aggregateId"],
//     revision: Number,
//     payload: rest,
//   });

//   // biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
//   abstract class $EsEvent extends Base {
//     static new<TH extends Constructor<$EsEvent>>(
//       this: TH,
//       aggregateId: InstanceType<Id>,
//       payload: (typeof Base)["$inline"]["payload"],
//     ) {
//       const id = Math.random().toString(36).substring(7);
//       // biome-ignore lint/complexity/noThisInStatic: <explanation>
//       return new this({
//         id,
//         aggregateId: aggregateId.serialize(),
//         revision: -1,
//         payload,
//       });
//     }

//     static asFact<TH extends Constructor<$EsEvent>>(
//       this: TH,
//       aggregateId: InstanceType<Id>,
//       revision: number,
//       payload: (typeof Base)["$inline"]["payload"],
//     ) {
//       const id = Math.random().toString(36).substring(7);
//       // biome-ignore lint/complexity/noThisInStatic: <explanation>
//       return new this({
//         id,
//         aggregateId: aggregateId.serialize(),
//         revision,
//         payload,
//       });
//     }

//     toFact(revision: number) {
//       return (this as any).constructor.deserialize({
//         ...this.serialize(),
//         revision,
//       });
//     }
//   }

//   return $EsEvent;
// };

// export const Snapshottable = <const S extends { [key: string]: Shorthand }>(
//   shape: S,
// ) =>
//   Subtrait([EventSourced([])], (base) =>
//     Dict(
//       shape,
//       class extends base {
//         static fromSnapshot<TH extends Constructor>(
//           this: TH,
//           snapshot: any & { revision: number },
//         ): InstanceType<TH> {
//           const instance = (this as any).deserialize(
//             snapshot,
//           ) as any as ImplementsTrait<ReturnType<typeof EventSourced>>;
//           instance.localRevision = snapshot.revision;
//           instance.streamRevision = snapshot.revision;
//           return instance as any;
//         }
//       },
//     ),
//   );

// // biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
// class AccountId extends Primitive(String) {
//   static generate() {
//     return new AccountId(Math.random().toString(36).substring(7));
//   }
// }

// class AccountOpened extends EsEvent({
//   type: "AccountOpened",
//   aggregateId: AccountId,
// }) {}

// class Deposited extends EsEvent({
//   type: "Deposited",
//   aggregateId: AccountId,
//   amount: Number,
// }) {}

// class Withdrawn extends EsEvent({
//   type: "Withdrawn",
//   aggregateId: AccountId,
//   amount: Number,
// }) {}

// export const EventSourced = <Events extends Constructor<IEsEvent>[]>(
//   events: Events,
// ) =>
//   Trait((base) => {
//     type Event = InstanceType<Events[number]>;
//     abstract class C extends base {
//       streamRevision = 0;
//       localRevision = 0;
//       changes: Event[] = [];

//       load(event: Event) {
//         this.executeHandler(event);
//         this.streamRevision = event.revision;
//         this.localRevision = event.revision;
//       }

//       play(event: Event) {
//         this.executeHandler(event);
//         this.localRevision = event.revision;
//       }

//       static executeBirthHandler(event: Event) {
//         return (this as any)[`on${event.type}`](event);
//       }

//       private executeHandler(event: Event) {
//         return (this as any)[`on${event.type}`](event);
//       }

//       apply(event: Event) {
//         this.executeHandler(event);
//         this.changes.push(event);
//         this.localRevision += 1;
//       }

//       fail(error: Error) {
//         throw error;
//       }

//       static new<TH>(this: TH, event: Event): InstanceOf<TH> {
//         const instance = (this as any).executeBirthHandler(event);
//         instance.localRevision += 1;
//         return instance;
//       }

//       static initialize(event: Event) {
//         const instance = (this as any).executeBirthHandler(event);
//         instance.localRevision = event.revision;
//         instance.streamRevision = event.revision;
//         return instance;
//       }
//     }

//     return C;
//   });

// class Account extends Derive(
//   EventSourced([AccountOpened, Withdrawn, Deposited]),
//   Snapshottable({
//     id: AccountId,
//     balance: Number,
//   }),
// ) {
//   static onAccountOpened(event: AccountOpened) {
//     return new this({ id: event.aggregateId, balance: 0 });
//   }

//   static open() {
//     return Account.new(AccountOpened.new(AccountId.generate(), {}));
//   }

//   deposit(amount: number) {
//     return this.apply(Deposited.new(this.id, { amount }));
//   }

//   onDeposited(event: Deposited) {
//     this.balance += event.payload.amount;
//   }

//   withdraw(amount: number) {
//     return this.apply(Withdrawn.new(this.id, { amount }));
//   }

//   onWithdrawn(event: Withdrawn) {
//     if (this.balance < event.payload.amount) {
//       this.fail(new Error("Insufficient funds"));
//     }

//     this.balance -= event.payload.amount;
//   }
// }

// class AccountStore {
//   streams = new Map<string, (AccountOpened | Withdrawn | Deposited)[]>();

//   load(id: AccountId) {
//     const stream = this.streams.get(id.serialize());

//     if (!stream) {
//       return;
//     }

//     const [first, ...rest] = stream;

//     const account = Account.initialize(first);

//     for (const event of rest) {
//       account.load(event);
//     }

//     return account;
//   }

//   save(account: Account) {
//     const stream = this.streams.get(account.id.serialize());
//     const latestRevision = stream ? stream[stream.length - 1].revision : -1;

//     const facts = account.changes.map((c, i) =>
//       c.toFact(latestRevision + i + 1),
//     );

//     if (!stream) {
//       this.streams.set(account.id.serialize(), facts);
//     } else {
//       stream.push(...facts);
//     }
//   }
// }

// class AccountStoreWithSnapshots {
//   streams = new Map<string, (AccountOpened | Withdrawn | Deposited)[]>();
//   snapshots = new Map<
//     string,
//     ReturnType<Account["serialize"]> & { revision: number }
//   >();

//   load(id: AccountId) {
//     const stream = this.streams.get(id.serialize());
//     if (!stream) {
//       return;
//     }

//     const snapshot = this.snapshots.get(id.serialize());
//     if (snapshot) {
//       const instance = Account.fromSnapshot(snapshot);

//       const hasChanges = stream.some(
//         (event) => event.revision > snapshot.revision,
//       );

//       if (hasChanges) {
//         for (const event of stream.slice(snapshot.revision + 1)) {
//           instance.load(event);
//         }
//       }

//       return instance;
//     }

//     const [first, ...rest] = stream;

//     const account = Account.initialize(first);

//     for (const event of rest) {
//       account.play(event);
//     }

//     return account;
//   }

//   save(account: Account) {
//     const stream = this.streams.get(account.id.serialize());

//     if (!stream) {
//       this.streams.set(account.id.serialize(), account.changes);
//     } else {
//       stream.push(...account.changes);
//     }

//     this.snapshots.set(account.id.serialize(), {
//       ...account.serialize(),
//       revision: account.localRevision,
//     });
//   }
// }

// // class Account extends EventSourced([
// //   AccountOpened,
// //   Deposited,
// //   Withdrawn
// // ]) {
// //   balance = 0;
// //   // how to play events on the aggregate
// //   // how to rebuild

// //   static open() {
// //     const account = Account.instantiate(AccountId.generate())
// //     account.apply(new AccountOpened({ id: account.id }))
// //     return account
// //   }

// //   @Es.OnLoad(Deposited)
// //   onAccountOpened(event: AccountOpened) {
// //     this.balance = 0
// //   }

// //   deposit = (amount: number) => {
// //     this.apply(new Deposited({ id: this.id, amount }))
// //   }

// //   Es.on(Deposited)
// //   onDeposited(event: Deposited) {
// //     if (1 === 2) {
// //       this.error(new )
// //     }
// //     this.balance -= event.amount
// //   }

// //   withdraw(amount: number) {
// //     this.apply(new Withdrawn({ id: this.id, amount }))
// //   }

// //   freezeNegativeAccount(command: FreezeNegativeAccountCommand) {
// //     if (this.balance < 0) {
// //       this.apply(new AccountFrozen({ id: this.id, amount }))
// //     }
// //   }
// // }

// // AccountOpened results in AccountAdded in AccountRegistry
// class AccountAdded extends EsEvent({
//   type: "AccountAdded",
//   aggregateId: AccountId,
// }) {}

// class AccountDepositRegistered extends EsEvent({
//   type: "AccountDepositRegistered",
//   aggregateId: AccountId,
//   amount: Number,
// }) {}

// class AccountWithdrawalRegistered extends EsEvent({
//   type: "AccountWithdrawalRegistered",
//   aggregateId: AccountId,
//   amount: Number,
// }) {}

// class AccountRegistry extends Derive(
//   EventSourced([
//     AccountAdded,
//     AccountDepositRegistered,
//     AccountWithdrawalRegistered,
//   ]),
//   Snapshottable({
//     id: "global",
//     accounts: Mapping([String, Number]),
//   }),
// ) {
//   static id = "global" as const;

//   static createGlobal() {
//     return new AccountRegistry({
//       id: this.id,
//       accounts: {},
//     });
//   }

//   // @Saga.forward(AccountOpened, event => new AccountAdded(event.aggregateId))
//   onAccountAdded(event: AccountAdded) {
//     this.accounts[event.aggregateId.serialize()] = 0;
//   }

//   onAccountDepositRegistered(event: AccountDepositRegistered) {
//     this.accounts[event.aggregateId.serialize()] += event.payload.amount;
//   }

//   onAccountWithdrawalRegistered(event: AccountWithdrawalRegistered) {
//     this.accounts[event.aggregateId.serialize()] -= event.payload.amount;
//   }

//   // // Stream<All Events from other streams I am listening for>
//   // // OriginStream is AllAccount stream filtered (here)
//   // static async initialize(originStream: Stream<AccountOpened | Deposited | Withdraw>) {
//   //   const aggregate = new AccountRegistry()

//   //   for await (const event of originStream) {
//   //     this.handle(event);
//   //   }
//   // }

//   // // Contains
//   // // A saga that listens on an event, and add it to the Aggregate stream (linkTo)
//   // @Es.forward(AccountOpened, event => new AccountAdded(event.id))
//   // onOpen(event: AccountAdded) {
//   //   this.accounts[event.accountId] = 0;
//   // }

//   // @Es.forward(Deposited, event => new AccountDepositRegistered(event.id))
//   // onDeposited(event: AccountDepositRegistered) {
//   //   this.accounts[event.accountId] += event.amount
//   // }

//   // @Es.forward(Withdrawn, event => new AccountWithdrawalRegistered(event.id))
//   // onDeposited(event: AccountWithdrawalRegistered) {
//   //   this.accounts[event.accountId] -= event.amount
//   // }

//   // freezeNegatives() {
//   //   for (const accountId of this.negatives) {
//   //     this.commandBus.execute(new FreezeNegativeAccountCommand({ accountId }))
//   //   }
//   // }

//   // static get id() {
//   //   return "global";
//   // }

//   // static create() {
//   //   return AccountRegistry.instantiate(this.id)
//   // }
// }

// // //

// // let accountRegistry = AccountRegistry.create()
// // const accountStore = new InMemoryAccountStore();
// // const accountRegistryStore = new InMemoryAccountRegistryStore();

// // const account = Account.open();
// // account.deposit(1000);
// // account.withdraw(500);
// // await accountStore.save(account);

// // account.withdraw(700);
// // await accountStore.save(account);

// // accountRegistry = await accountRegistryStore.load(AccountRegistry.id);

// // if (accountRegistry.getFrozenAccounts().length !== 1) {
// //   throw new Error('Test failed')
// // }

// // Allow stream migration
// // From a stream1, create a derived stream2

// /**
//  * Account-8u1h -> Account-8u1h
//  * Deposited    -> Opened
//  * Opened       -> Deposited
//  * Withdrawn    -> Withdrawn
//  *
//  * Account-8u1h
//  * TRUNCATE_BEFORE
//  * Opened
//  * Deposited
//  * Withdrawn
//  * CONTINUE
//  *
//  *
//  * UserNotificationSettings-userid3
//  * A 1
//  * B 2
//  * C 3
//  * TRUNCATE_BEFORE
//  * A 4 migration
//  * B 5 migration
//  * D 6 migration
//  * CONTINUE
//  * A 7                   ImagePublisherSaga (Folder 5, UNS 6)
//  *
//  * Stream rewrite procedure:
//  * - Add a lock to the stream,
//  *   which will prevent any addition to the stream,
//  *   mark previous events for scavenging,
//  *   and new events for no-side effects (no run of sagas)
//  *
//  * - Write the migrated events to the stream, continuing from the current revision.
//  * - Add an unlock to the stream, which marks new events for side-effects (run of sagas) and unblock additions to the stream

//  * Account-8u1h-upstream ($Account-8u1h-*)
//  * https://martendb.io/scenarios/copy-and-transform-stream
//  * https://developers.eventstore.com/server/v24.2/streams.html#hard-delete
// **/

// // function StreamMigrator(Aggregate: any) {
// //   abstract class C {
// //     abstract get stream(): Stream;
// //     abstract handle(event: Event);

// //     async migrate(id: typeof Aggregate['id']) {
// //       await this.eventStore.startMigration(Aggregate, id); // adds the lock event

// //       for await (const event of this.stream) {
// //         const migrated: Event[] = this.handle(event)
// //         for (const m of migrated) {
// //           m.markForMigration(); // notifies no side effects should be ran
// //           this.eventStore.append(Aggregate, id, m); // notifies saga and side effects
// //         }
// //       }

// //       // adds the unlock event
// //       // potentially gets rid of events marked for scavenging
// //       // projections will rebuild by reacting to the unlock event
// //       await this.eventStore.endMigration(Aggregate, id);
// //     }
// //   }
// //   return C;
// // }

// // abstract class AggregateStreamsMigrator<AggregateId> {
// //   abstract async streamIds(): AsyncIterator<AggregateId>;

// //   constructor(private readonly streamMigrator: InstanceType<ReturnType<typeof StreamMigrator>>) { }

// //   public run() {
// //     for await (const id of this.streamIds()) {
// //       await this.streamMigrator.migrate(id);
// //     }
// //   }
// // }

// // class AccountStreamMigrator extends StreamMigrator(Account) {
// //   override get stream() {
// //     return this.eventStore.read(Account, accountId);
// //   }

// //   override handle(event: Event) {
// //     return [];
// //   }
// // }

// // /**
// //  * // Stream of a single instance of an aggregate type
// //  * InstanceStream Account-1 // Stream
// //  *
// //  * // Projected stream of all instances of an aggregate type
// //  * TypeStream Account-* // ByCategory $ce-xxx
// //  *
// //  * // Projected stream of all events of a given type
// //  * EventTypeStream AccountOpened-* // ByEventType $et-xxx
// //  */

// // class AccountStreamsMigrator extends AggregateStreamsMigrator<AccountId> {
// //   override *streamIds() {
// //     for await (const accountOpened of this.stream.filter(e => e.is(AccountOpened))) {
// //       yield accountOpened.id;
// //     }
// //   }
// // }

// // const accountMigrator = new AccountStreamsMigrator(new AccountStreamMigrator());
// // accountMigrator.run();

// // class AccountThroughput {
// //   accountId: AccountId;
// //   throughput: number;
// // }

// // class AccountThroughputFromShit extends AccountThroughput {
// //   initFromMyShitAndStuff(accounts: Account[], randomNumber: number): void { }
// // }

// // /**
// //  * AccountThroughputProjectionStream
// //  * Deposited 0
// //  * Deposited 1
// //  */

// // class AccountThroughputProjection extends Projection {
// //   checkpoint = 1
// //   projectedStreamConfig = "select Witdrawn from Account"

// //   @Projection.rebuild()
// //   async init(accountId: AccountId) {
// //     const account = await this.accountStore.load(accountId)
// //     const throughput = new AccountThroughput({ id: accountId, balance: account.balance })
// //     await this.store.save(throughput)
// //   }

// //   @Projection.on(Deposited)
// //   onDeposited(event: Deposited, transaction: Transaction) {
// //     const accountThroughput = await this.store.load(event.accountId, transaction)

// //     // Auto projection
// //     accountThroughput.handle(event)

// //     this.store.save(accountThroughput, trx)
// //   }

// //   @Projection.on(Withdrawn)
// //   onWithdrawn(event: Withdrawn) {
// //     const accountThroughput = await this.store.load(event.accountId)
// //     accountThroughput.handle(event)
// //     this.store.save(accountThroughput)
// //   }
// // }

// // class IsolatedProjector {
// //   constructor(private readonly projection: Projection) { }

// //   start() {
// //     const checkpoint = this.projection.checkpointStore.load(this.projection);
// //     // compete used for distributed
// //     for await (const event of this.evenstore.follow(projection.configuration, checkpoint)) {
// //       this.transaction.perform(trx => {
// //         const checkpoint = this.projection.checkpointStore.load(this.projection, trx)
// //         if (event.revision !== checkpoint + 1) {
// //           throw new Error('Not consecutive')
// //         }
// //         await this.projection.handle(event, trx)
// //         this.checkpointStore.save(this, event.revision, trx)
// //       })
// //     }
// //   }
// // }

// // https://developers.eventstore.com/server/v24.2/projections.html

// abstract class AccountRegistryStore {
//   abstract load(id: "global"): AccountRegistry;
//   abstract save(accountRegistry: AccountRegistry): void;
// }

// class TransactionId extends Primitive(String) {
//   static generate() {
//     return new TransactionId(Math.random().toString(36).substring(7));
//   }
// }

// class TransactionInitiated extends EsEvent({
//   type: "TransactionInitiated",
//   aggregateId: TransactionId,
//   from: AccountId,
//   to: AccountId,
//   amount: Number,
// }) {}

// class Transaction extends Derive(
//   EventSourced([TransactionInitiated]),
//   Snapshottable({
//     id: TransactionId,
//     from: AccountId,
//     to: AccountId,
//     amount: Number,
//   }),
// ) {
//   static onTransactionInitiated(event: TransactionInitiated) {
//     return new this({
//       id: event.aggregateId,
//       from: event.payload.from,
//       to: event.payload.to,
//       amount: event.payload.amount,
//     });
//   }

//   static initiate(from: AccountId, to: AccountId, amount: number) {
//     return Transaction.new(
//       TransactionInitiated.new(TransactionId.generate(), { from, to, amount }),
//     );
//   }
// }

// class AccountCashflow extends Shape({
//   accountId: AccountId,
//   cashflow: Number,
// }) {
//   // @Projection.on(AccountOpened)
//   static onAccountOpened(event: AccountOpened) {
//     return new this({ accountId: event.aggregateId, cashflow: 0 });
//   }

//   // @Projection.on(Deposited)
//   onDeposited(event: Deposited) {
//     this.cashflow += event.payload.amount;
//   }

//   // @Projection.on(Withdrawn)
//   onWithdrawn(event: Withdrawn) {
//     this.cashflow -= event.payload.amount;
//   }
// }

// type Store<T> = {
//   load(id: AggregateId, trx?: Transaction): T;
//   save(t: T, trx?: Transaction): void;
// };

// class AccountCashflowProjection {
//   constructor(
//     private readonly accountStore: AccountStore,
//     private readonly store: Store<AccountCashflow>,
//     public readonly checkpointStore: ProjectionCheckpointStore,
//     public readonly transaction: {
//       perform<T>(fn: (trx: Transaction) => Promise<T>): Promise<T>;
//     },
//   ) {}

//   handle(event: IEsEvent, trx: Transaction) {
//     if (
//       !(
//         event instanceof AccountOpened ||
//         event instanceof Deposited ||
//         event instanceof Withdrawn
//       )
//     ) {
//       throw new Error("Unsupported event");
//     }

//     switch (event.type) {
//       case "AccountOpened":
//         return this.onAccountOpened(event, trx);
//       case "Deposited":
//         return this.onDeposited(event, trx);
//       case "Withdrawn":
//         return this.onWithdrawn(event, trx);
//     }
//   }

//   get name() {
//     return "AccountCashflow";
//   }

//   get stream() {
//     // Here, depending on what the projection is interested in, we should return a configuration for a projected stream
//     return `AccountOpened + AccountDeposited + AccountWithdrawn`;
//   }

//   /**
//    * An initializer for a projection allows to initialize the projection from the write model directly
//    * It is useful when the projection is created after the write model has been created
//    * and we dont want to replay all the events.
//    * This is not an approach to use by default, only when the projection cost is very high
//    *
//    * We could be called a ProjectionInitializer
//    */
//   async initialize(accountId: AccountId, trx: Transaction) {
//     const account = this.accountStore.load(accountId);
//     const cashflow = new AccountCashflow({
//       accountId,
//       cashflow: account.balance,
//     });
//     await this.store.save(cashflow, trx);
//   }

//   async onAccountOpened(event: AccountOpened, trx: Transaction) {
//     const cashflow = AccountCashflow.onAccountOpened(event);
//     await this.store.save(cashflow, trx);
//   }

//   async onDeposited(event: Deposited, trx: Transaction) {
//     const cashflow = await this.store.load(event.aggregateId, trx);
//     cashflow.onDeposited(event);
//     await this.store.save(cashflow, trx);
//   }

//   async onWithdrawn(event: Withdrawn, trx: Transaction) {
//     const cashflow = await this.store.load(event.aggregateId, trx);
//     cashflow.onWithdrawn(event);
//     await this.store.save(cashflow, trx);
//   }
// }

// class ProjectionCheckpoint {
//   constructor(
//     public readonly projection: string,
//     public readonly stream: string,
//     public revision: number,
//   ) {}
// }

// abstract class ProjectionCheckpointStore {
//   abstract load(projection: any, trx?: Transaction): ProjectionCheckpoint;
//   abstract save(
//     projection: any,
//     checkpoint: ProjectionCheckpoint,
//     trx?: Transaction,
//   ): void;
// }

// abstract class EventStore {
//   abstract read(stream: any, from: number): AsyncIterable<IEsEvent>;
//   abstract follow(stream: any, from: number): AsyncIterable<IEsEvent>;
//   abstract findEvent(stream: any, eventId: string): IEsEvent;
// }

// class AccountCashflowProjector {
//   constructor(
//     private readonly eventStore: EventStore,
//     private readonly projection: AccountCashflowProjection,
//   ) {}

//   async start() {
//     const checkpoint = await this.projection.checkpointStore.load(
//       this.projection,
//     );

//     if (checkpoint.stream !== this.projection.stream) {
//       // The projection has been changed, we need to rebuild
//       return this.rebuild();
//     }

//     this.continue(checkpoint);
//   }

//   /**
//    * When rebuilding a projection, we might want to store intermediate state elsewhere
//    * to avoid sending updates to the frontend while the projection is being rebuilt, and
//    * only start sending updates once the projection has handled the first event that occurred after
//    * the last checkpoint temporaly.
//    *
//    * Can we store it in memory ? It corresponds to one or more database collections so its not a good idea.
//    * Also, if multiple projections are being rebuilt at the same time, we might run out of memory
//    *
//    * Can we store it on disk ? Depends on where the projection is running, if its running on a serverless function, we can't
//    *
//    *
//    */
//   private async rebuild(): Promise<void> {
//     // Rebuild the projection
//     const checkpoint = new ProjectionCheckpoint(
//       this.projection.name,
//       this.projection.stream,
//       0,
//     );

//     for await (const event of this.eventStore.read(this.projection.stream, 0)) {
//       await this.projection.transaction.perform(async (trx) => {
//         await this.projection.handle(event, trx);
//         checkpoint.revision = event.revision;
//         await this.projection.checkpointStore.save(this, checkpoint, trx);
//       });
//     }

//     return this.continue(checkpoint);
//   }

//   private async continue(checkpoint: ProjectionCheckpoint): Promise<void> {
//     for await (const event of this.eventStore.follow(
//       this.projection.stream,
//       checkpoint.revision,
//     )) {
//       await this.projection.transaction.perform(async (trx) => {
//         const checkpoint = await this.projection.checkpointStore.load(
//           this.projection,
//           trx,
//         );
//         if (event.revision !== checkpoint.revision + 1) {
//           throw new Error("Not consecutive");
//         }
//         await this.projection.handle(event, trx);
//         checkpoint.revision = event.revision;
//         await this.projection.checkpointStore.save(this, checkpoint, trx);
//       });
//     }
//   }
// }

// class SagaId extends Primitive(String) {
//   static generate() {
//     return new SagaId(Math.random().toString(36).substring(7));
//   }
// }

// class AddAccountToRegistrySaga extends Shape({
//   id: SagaId,
//   accountId: AccountId,
//   finished: Boolean,
// }) {
//   static onAccountOpened(event: AccountOpened) {
//     return new this({
//       id: SagaId.generate(),
//       accountId: event.aggregateId,
//       finished: false,
//     });
//   }

//   onAccountAdded(event: AccountAdded) {
//     this.finished = true;
//   }
// }

// class SagaCheckpoint extends Shape({
//   saga: String,
//   revision: Number,
//   stream: String,
//   lastEventId: String,
// }) {}

// abstract class SagaCheckpointStore {
//   abstract load(saga: string): Promise<SagaCheckpoint>;
//   abstract save(checkpoint: SagaCheckpoint): Promise<void>;
// }

// class AddAccountToRegistrySagaManager {
//   constructor(
//     private readonly sagaStore: Store<AddAccountToRegistrySaga>,
//     private readonly accountRegistryStore: AccountRegistryStore,
//     public readonly checkpointStore: SagaCheckpointStore,
//   ) {}

//   get stream() {
//     return "AccountOpened + AccountAdded";
//   }

//   handle(event: IEsEvent) {
//     if (!(event instanceof AccountOpened || event instanceof AccountAdded)) {
//       throw new Error("Unsupported event");
//     }

//     switch (event.type) {
//       case "AccountOpened":
//         return this.onAccountOpened(event);
//       case "AccountAdded":
//         return this.onAccountAdded(event);
//     }
//   }

//   async onAccountOpened(event: AccountOpened) {
//     const saga = AddAccountToRegistrySaga.onAccountOpened(event);

//     // COMMAND HANDLER
//     const accountRegistry = await this.accountRegistryStore.load(
//       AccountRegistry.id,
//     );
//     accountRegistry.onAccountAdded(AccountAdded.new(event.aggregateId, {}));
//     await this.accountRegistryStore.save(accountRegistry);
//     // END COMMAND HANDLER

//     await this.sagaStore.save(saga);
//   }

//   async onAccountAdded(event: AccountAdded) {
//     const saga = await this.sagaStore.load(event.aggregateId);

//     saga.onAccountAdded(event);

//     await this.sagaStore.save(saga);
//   }

//   // async onDeposited(event: Deposited) {
//   //   const accountRegistry = await this.accountRegistryStore.load(AccountRegistry.id);
//   //   accountRegistry.onAccountDepositRegistered(AccountDepositRegistered.new(event.aggregateId, { amount: event.payload.amount }));
//   //   await this.accountRegistryStore.save(accountRegistry);
//   // }

//   // async onWithdrawn(event: Withdrawn) {
//   //   const accountRegistry = await this.accountRegistryStore.load(AccountRegistry.id);
//   //   accountRegistry.onAccountWithdrawalRegistered(AccountWithdrawalRegistered.new(event.aggregateId, { amount: event.payload.amount }));
//   //   await this.accountRegistryStore.save(accountRegistry);
//   // }
// }

// class AddAccountToRegistrySagaOrchestrator {
//   constructor(
//     private readonly eventStore: EventStore,
//     private readonly sagaManager: AddAccountToRegistrySagaManager,
//   ) {}

//   async start() {
//     // UNSAFE CONCURRENCY, FIND A WAY TO MAKE SAGA & CHECKPOINTS SAFE
//     const checkpoint = await this.sagaManager.checkpointStore.load(
//       this.sagaManager.constructor.name,
//     );

//     if (checkpoint.stream !== this.sagaManager.stream) {
//       // The saga has changed, we should not rebuild, but we continue from last event ( which has a new revision in the projected stream )
//       const event = this.eventStore.findEvent(
//         this.sagaManager.stream,
//         checkpoint.lastEventId,
//       );
//       checkpoint.revision = event.revision;

//       await this.sagaManager.checkpointStore.save(checkpoint);
//     }

//     for await (const event of this.eventStore.follow(
//       this.sagaManager.stream,
//       checkpoint.revision,
//     )) {
//       await this.sagaManager.handle(event);
//     }
//   }
// }
