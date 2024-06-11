import { Deposited, Withdrawn } from "../../account/domain/account";
import { Cashflow } from "../domain/cashflow";
import type { CashflowStore } from "./cashflow.store";

export class CashflowProjection {
  constructor(private readonly cashflowStore: CashflowStore) {}

  async onDeposited(event: Deposited): Promise<void> {
    let cashflow = await this.cashflowStore.load(event.payload.accountId);

    if (!cashflow) {
      cashflow = Cashflow.new(event.payload.accountId);
    }

    cashflow.onDeposited(event);

    await this.cashflowStore.save(cashflow);
  }

  async onWithdrawn(event: Withdrawn): Promise<void> {
    let cashflow = await this.cashflowStore.load(event.accountId);

    if (!cashflow) {
      cashflow = Cashflow.new(event.accountId);
    }

    cashflow.onWithdrawn(event);

    await this.cashflowStore.save(cashflow);
  }
}
