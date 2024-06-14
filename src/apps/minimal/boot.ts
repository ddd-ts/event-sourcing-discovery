import { DepositCommand, DepositCommandHandler } from "./account/application/commands/deposit.command";
import { OpenAccountCommand, OpenAccountCommandHandler } from "./account/application/commands/open-account.command";
import { WithdrawCommand, WithdrawCommandHandler } from "./account/application/commands/withdraw.command";
import { InMemoryAccountStore } from "./account/infrastructure/in-memory.account.store";
import { CashflowProjection } from "./cashflow/application/cashflow.projection";
import { InMemoryCashflowStore } from "./cashflow/infrastructure/in-memory.cashflow.store";
import { InMemoryCommandBus } from "./framework/command-bus";
import { InMemoryEventStore } from "./framework/event-store/in-memory/in-memory.event-store";
import { InMemoryCheckpointStore } from "./framework/in-memory.projection-checkpoint.store";
import { OpenRegistryCommand, OpenRegistryCommandHandler } from "./registry/application/commands/open-registry.command";
import {
  RegisterAccountCommand,
  RegisterAccountCommandHandler,
} from "./registry/application/commands/register-account.command";
import {
  RegisterDepositCommand,
  RegisterDepositCommandHandler,
} from "./registry/application/commands/register-deposit.command";
import {
  RegisterWithdrawalCommand,
  RegisterWithdrawalCommandHandler,
} from "./registry/application/commands/register-withdrawal.command";
import { RegisterAccountOrchestrator } from "./registry/application/sagas/register-account.orchestrator";
import { RegisterAccountSagaManager } from "./registry/application/sagas/register-account.saga-manager";
import { RegisterDepositSagaOrchestrator } from "./registry/application/sagas/register-deposit.orchestrator";
import { RegisterDepositSagaManager } from "./registry/application/sagas/register-deposit.saga-manager";
import { RegisterWithdrawalSagaOrchestrator } from "./registry/application/sagas/register-withdrawal.orchestrator";
import { RegisterWithdrawalSagaManager } from "./registry/application/sagas/register-withdrawal.saga-manager";
import { InMemoryRegisterAccountSagaStore } from "./registry/infrastructure/in-memory.register-account.saga-store";
import { InMemoryRegisterDepositSagaStore } from "./registry/infrastructure/in-memory.register-deposit.saga-store";
import { InMemoryRegisterWithdrawalSagaStore } from "./registry/infrastructure/in-memory.register-withdrawal.saga-store";
import { InMemoryRegistryStore } from "./registry/infrastructure/in-memory.registry.store";
import { OpenAccountCommandSerializer } from "./account/infrastructure/serializers/commands/open-account.command.serializer";
import { DepositCommandSerializer } from "./account/infrastructure/serializers/commands/deposit.command.serializer";
import { WithdrawCommandSerializer } from "./account/infrastructure/serializers/commands/withdraw.command.serializer";
import { AccountRegistered, DepositRegistered, RegistryId, RegistryOpened, WithdrawalRegistered } from "./registry/domain/registry";
import { AccountRegisteredSerializer } from "./registry/infrastructure/serializers/account-registered.serializer";
import { DepositRegisteredSerializer } from "./registry/infrastructure/serializers/deposit-registered.serializer";
import { WithdrawalRegisteredSerializer } from "./registry/infrastructure/serializers/withdrawal-registered.serializer";
import { RegistryOpenedSerializer } from "./registry/infrastructure/serializers/registry-opened.serializer";
import { Projector } from "./cashflow/application/cashflow.projector";
import { DepositedSerializer1n } from "./account/infrastructure/serializers/events/deposited.serializer";
import { AccountId, Deposited, Withdrawn } from "./account/domain/account";
import { WithdrawnSerializer1n } from "./account/infrastructure/serializers/events/withdrawn.serializer";
import { EventSerializer, EventSourcingEvent } from "./framework/es-event";

class CommandSerializerRegistry<Registered extends [string, any][] = []> {
  store = new Map<string, any>();

  add<Type extends string, S>(commandType: Type, serializer: S) {
    this.store.set(commandType, serializer);
    return this as CommandSerializerRegistry<[...Registered, [Type, S]]>;
  }

  get<Type extends string>(commandType: Type) {
    return this.store.get(commandType) as Extract<Registered[number], [Type, any]>[1];
  }

  deserialize<Serialized extends Parameters<Registered[number][1]["deserialize"]>[0] & { type: string }>(
    command: Serialized,
  ) {
    const type = command.type as Serialized["type"];
    const serializer = this.get(type);
    return serializer.deserialize(command) as ReturnType<(typeof serializer)["deserialize"]>;
  }
}

class EventSerializerRegistry<Registered extends { [type: string]: EventSerializer<EventSourcingEvent> } = {}> {
  store = new Map<string, any>();

  add<Type extends string, S extends EventSerializer<EventSourcingEvent>>(eventType: Type, serializer: S) {
    this.store.set(eventType, serializer);
    return this as unknown as EventSerializerRegistry<Registered & { [K in Type]: S }>;
  }

  get<Type extends string>(eventType: Type) {
    return this.store.get(eventType) as Registered[Type];
  }

  serialize<Type extends keyof Registered>(event: Parameters<Registered[Type]['serialize']>[0]) {
    const serializer = this.get((event as any).type);
    return serializer.serialize(event) as ReturnType<Registered[Type]["serialize"]>;
  }

  deserialize<Type extends keyof Registered>(serialized: Parameters<Registered[Type]['deserialize']>[0]) {
    const serializer = this.get((serialized as any).type);
    return serializer.deserialize(serialized) as ReturnType<Registered[Type]["deserialize"]>;
  }
}

export function boot() {
  const commandSerializerRegistry = new CommandSerializerRegistry()
    .add(OpenAccountCommand.type, new OpenAccountCommandSerializer())
    .add(DepositCommand.type, new DepositCommandSerializer())
    .add(WithdrawCommand.type, new WithdrawCommandSerializer());

  const eventSerializerRegistry = new EventSerializerRegistry()
    .add(AccountRegistered.type, new AccountRegisteredSerializer())
    .add(DepositRegistered.type, new DepositRegisteredSerializer())
    .add(WithdrawalRegistered.type, new WithdrawalRegisteredSerializer())
    .add(RegistryOpened.type, new RegistryOpenedSerializer())
    .add(Deposited.type, new DepositedSerializer1n())
    .add(Withdrawn.type, new WithdrawnSerializer1n())

  const commandBus = new InMemoryCommandBus();
  const checkpointStore = new InMemoryCheckpointStore();
  const eventStore = new InMemoryEventStore();

  // account module
  const accountStore = new InMemoryAccountStore(eventStore);

  const openAccountCommandHandler = new OpenAccountCommandHandler(accountStore);
  commandBus.register(OpenAccountCommand.type, openAccountCommandHandler);

  const depositCommandHandler = new DepositCommandHandler(accountStore);
  commandBus.register(DepositCommand.type, depositCommandHandler);

  const withdrawCommandHandler = new WithdrawCommandHandler(accountStore);
  commandBus.register(WithdrawCommand.type, withdrawCommandHandler);

  // registry module
  const registryStore = new InMemoryRegistryStore(eventStore, eventSerializerRegistry);

  const openRegistryCommandHandler = new OpenRegistryCommandHandler(registryStore);
  commandBus.register(OpenRegistryCommand.type, openRegistryCommandHandler);

  const registerAccountCommandHandler = new RegisterAccountCommandHandler(registryStore);
  commandBus.register(RegisterAccountCommand.type, registerAccountCommandHandler);

  const registerDepositCommandHandler = new RegisterDepositCommandHandler(registryStore);
  commandBus.register(RegisterDepositCommand.type, registerDepositCommandHandler);

  const registerWithdrawalCommandHandler = new RegisterWithdrawalCommandHandler(registryStore);
  commandBus.register(RegisterWithdrawalCommand.type, registerWithdrawalCommandHandler);

  const registerAccountSagaStore = new InMemoryRegisterAccountSagaStore();
  const registerAccountSagaManager = new RegisterAccountSagaManager(registerAccountSagaStore, commandBus);
  const registerAccountSagaOrchestrator = new RegisterAccountOrchestrator(
    registerAccountSagaManager,
    eventStore,
    checkpointStore,
  );

  const registerDepositSagaStore = new InMemoryRegisterDepositSagaStore();
  const registerDepositSagaManager = new RegisterDepositSagaManager(registerDepositSagaStore, commandBus);
  const registerDepositSagaOrchestrator = new RegisterDepositSagaOrchestrator(
    registerDepositSagaManager,
    eventStore,
    checkpointStore,
  );

  const registerWithdrawalSagaStore = new InMemoryRegisterWithdrawalSagaStore();
  const registerWithdrawalSagaManager = new RegisterWithdrawalSagaManager(registerWithdrawalSagaStore, commandBus);
  const registerWithdrawalSagaOrchestrator = new RegisterWithdrawalSagaOrchestrator(
    registerWithdrawalSagaManager,
    eventStore,
    checkpointStore,
  );

  // cashflow module

  const cashflowStore = new InMemoryCashflowStore();

  const cashflowProjection = new CashflowProjection(cashflowStore);
  const cashflowProjector = new Projector(cashflowProjection, checkpointStore, eventStore, eventSerializerRegistry);
  cashflowProjector.start();

  // At kraaft
  /**
   * To start a projection
   * new Projection(stores);
   * projection.listen(eventBus);
   */

  return {
    commandBus,
    registerAccountSagaOrchestrator,
    registerDepositSagaOrchestrator,
    registerWithdrawalSagaOrchestrator,
    cashflowProjector,
    eventStore,
    checkpointStore,
    accountStore,
    registryStore,
    cashflowStore,
    start() {
      void registerAccountSagaOrchestrator.start();
      void registerDepositSagaOrchestrator.start();
      void registerWithdrawalSagaOrchestrator.start();
      void cashflowProjector.start();
    },
  };
}
