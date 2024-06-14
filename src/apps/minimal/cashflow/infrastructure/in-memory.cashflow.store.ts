import { AccountId } from "../../account/domain/account";
import type { CashflowStore } from "../application/cashflow.store";
import type { Cashflow } from "../domain/cashflow";

export class InMemoryCashflowStore implements CashflowStore {
  private cashflows = new Map<string, Cashflow>();

  async save(cashflow: Cashflow) {
    this.cashflows.set(cashflow.accountId.toString(), cashflow);
  }

  async load(accountId: AccountId) {
    return this.cashflows.get(accountId.toString());
  }
}
