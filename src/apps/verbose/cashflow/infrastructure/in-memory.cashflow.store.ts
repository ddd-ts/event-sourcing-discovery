import type { CashflowStore } from "../application/cashflow.store";
import type { Cashflow } from "../domain/cashflow";

export class InMemoryCashflowStore implements CashflowStore {
  private cashflows = new Map<string, Cashflow>();

  async save(cashflow: Cashflow): Promise<void> {
    this.cashflows.set(cashflow.accountId, cashflow);
  }

  async load(accountId: string): Promise<Cashflow | undefined> {
    return this.cashflows.get(accountId);
  }
}
