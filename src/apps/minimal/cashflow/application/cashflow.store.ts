import { AccountId } from "../../account/domain/account";
import type { Cashflow } from "../domain/cashflow";

export interface CashflowStore {
  load(accountId: AccountId): Promise<Cashflow | undefined>;
  save(cashflow: Cashflow): Promise<void>;
}
