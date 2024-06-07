import type { Withdrawn } from "../../../account/domain/account";
import type { WithdrawalRegistered } from "../../domain/registry";
import { RegisterWithdrawalCommand } from "../commands/register-withdrawal.command";

export class RegisterWithdrawalSaga {
    done = false;
    constructor(public readonly accountId: string) { }

    static onWithdrawn(event: Withdrawn, commandBus: any) {
        commandBus.send(new RegisterWithdrawalCommand(event.accountId, event.registryId, event.amount))
        return new RegisterWithdrawalSaga(event.accountId);
    }

    onWithdrawalRegistered(event: WithdrawalRegistered) {
        this.done = true;
    }
}

export interface RegisterWithdrawalSagaStore {
    load(accountId: string): Promise<RegisterWithdrawalSaga>;
    save(saga: RegisterWithdrawalSaga): Promise<void>;
}


export class RegisterWithdrawalSagaManager {
    constructor(
        private readonly registerWithdrawalSagaStore: RegisterWithdrawalSagaStore,
        private readonly commandBus: any
    ) { }

    async onWithdrawn(event: Withdrawn) {
        const saga = RegisterWithdrawalSaga.onWithdrawn(event, {});
        await this.registerWithdrawalSagaStore.save(saga);
    }

    async onWithdrawalRegistered(event: WithdrawalRegistered) {
        const saga = await this.registerWithdrawalSagaStore.load(event.accountId);
        saga.onWithdrawalRegistered(event);
        await this.registerWithdrawalSagaStore.save(saga);
    }
}