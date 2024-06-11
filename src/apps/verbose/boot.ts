import { DepositCommand, DepositCommandHandler } from "./account/application/commands/deposit.command";
import { OpenAccountCommand, OpenAccountCommandHandler } from "./account/application/commands/open-account.command";
import { WithdrawCommand, WithdrawCommandHandler } from "./account/application/commands/withdraw.command";
import { InMemoryAccountStore } from "./account/infrastructure/in-memory.account.store";
import { CashflowProjection } from "./cashflow/application/cashflow.projection";
import { CashflowProjector } from "./cashflow/application/cashflow.projector";
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

export function boot() {
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
  const registryStore = new InMemoryRegistryStore(eventStore);

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
  const cashflowProjector = new CashflowProjector(cashflowProjection, checkpointStore, eventStore);

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
