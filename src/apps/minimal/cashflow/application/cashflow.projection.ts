import { Account, Deposited, Withdrawn } from "../../account/domain/account";
import { Projection } from "../../framework/quick/projection";
import { Cashflow } from "../domain/cashflow";
import type { CashflowStore } from "./cashflow.store";

export class CashflowProjection extends Projection("Cashflow", {
  projectsOn: [[Account, Deposited], [Account, Withdrawn],
    // This should crash
    // [Account, RegistryOpened]
  ],
}) {
  constructor(private readonly cashflowStore: CashflowStore) {
    super()
  }

  async onDeposited(event: Deposited) {
    const { accountId } = event.payload

    let cashflow = await this.cashflowStore.load(accountId);

    if (!cashflow) {
      cashflow = Cashflow.new(accountId);
    }

    cashflow.onDeposited(event);

    await this.cashflowStore.save(cashflow);
  }

  async onWithdrawn(event: Withdrawn) {
    const { accountId } = event.payload

    let cashflow = await this.cashflowStore.load(accountId);

    if (!cashflow) {
      cashflow = Cashflow.new(accountId);
    }

    cashflow.onWithdrawn(event);

    await this.cashflowStore.save(cashflow);
  }
}
