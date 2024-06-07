import type { Deposited, Withdrawn } from "../../account/domain/account";

export class Cashflow {
    constructor(public readonly accountId: string, public amount: number) { }

    onDeposited(event: Deposited) {
        this.amount += event.amount;
    }

    onWithdrawn(event: Withdrawn) {
        this.amount += event.amount;
    }
}