import type { Deposited } from "../../../account/domain/account";
import type { DepositRegistered } from "../../domain/registry";
import { RegisterDepositCommand } from "../commands/register-deposit.command";

export class RegisterDepositSaga {
    done = false;
    constructor(public readonly accountId: string) { }

    static onDeposited(event: Deposited, commandBus: any) {
        commandBus.send(new RegisterDepositCommand(event.accountId, event.registryId, event.amount))
        return new RegisterDepositSaga(event.accountId);
    }

    onDepositRegistered(event: DepositRegistered) {
        this.done = true;
    }
}

export interface RegisterDepositSagaStore {
    load(accountId: string): Promise<RegisterDepositSaga>;
    save(saga: RegisterDepositSaga): Promise<void>;
}


export class RegisterDepositSagaManager {
    constructor(
        private readonly registerDepositSagaStore: RegisterDepositSagaStore,
        private readonly commandBus: any
    ) { }

    async onDeposited(event: Deposited) {
        const saga = RegisterDepositSaga.onDeposited(event, {});
        await this.registerDepositSagaStore.save(saga);
    }

    async onDepositRegistered(event: DepositRegistered) {
        const saga = await this.registerDepositSagaStore.load(event.accountId);
        saga.onDepositRegistered(event);
        await this.registerDepositSagaStore.save(saga);
    }
}