import { DepositCommand } from "./account/application/commands/deposit.command";
import { OpenAccountCommand } from "./account/application/commands/open-account.command";
import { WithdrawCommand } from "./account/application/commands/withdraw.command";
import { boot } from "./boot";
import { OpenRegistryCommand } from "./registry/application/commands/open-registry.command";

async function scenario() {
  const {
    commandBus,
    start,
    cashflowStore,
    registryStore,
    eventStore,
    registerAccountSagaOrchestrator,
    registerDepositSagaOrchestrator,
    registerWithdrawalSagaOrchestrator,
  } = boot();

  start();

  const registryId: string = await commandBus.execute(new OpenRegistryCommand());
  const accountId: string = await commandBus.execute(new OpenAccountCommand(registryId));
  await commandBus.execute(new DepositCommand(accountId, 1000));
  await commandBus.execute(new DepositCommand(accountId, 500));
  await commandBus.execute(new WithdrawCommand(accountId, 200));

  await new Promise((resolve) => setTimeout(resolve, 100));

  console.log(eventStore);

  const cashflow = await cashflowStore.load(accountId);

  if (cashflow?.amount !== 1700) {
    throw new Error(`Cashflow is ${cashflow?.amount} but expected 1700`);
  }

  const registry = await registryStore.load(registryId);

  if (registry?.balances[accountId] !== 1300) {
    throw new Error(`Registry balance is ${registry?.balances[accountId]} but expected 1300`);
  }

  console.log("Scenario passed");
}

scenario();
