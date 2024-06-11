import type { Cashflow } from "../domain/cashflow";

export interface CashflowStore {
  load(accountId: string): Promise<Cashflow | undefined>;
  save(cashflow: Cashflow): Promise<void>;
}
