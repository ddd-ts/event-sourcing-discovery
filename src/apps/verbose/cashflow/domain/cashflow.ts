import type { Deposited, Withdrawn } from "../../account/domain/account";

export class Cashflow {
  constructor(
    public readonly accountId: string,
    public amount: number,
  ) {}

  static new(accountId: string) {
    return new Cashflow(accountId, 0);
  }

  onDeposited(event: Deposited) {
    this.amount += event.payload.amount;
  }

  onWithdrawn(event: Withdrawn) {
    this.amount += event.amount;
  }
}
