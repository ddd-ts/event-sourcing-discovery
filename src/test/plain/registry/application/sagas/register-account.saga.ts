import type { AccountOpened } from "../../../account/domain/account";
import type { AccountRegistered } from "../../domain/registry";
import { RegisterAccountCommand } from "../commands/register-account.command";

export class RegisterAccountSaga {
    done = false;
    constructor(public readonly accountId: string) { }

    static onAccountOpened(event: AccountOpened, commandBus: any) {
        commandBus.send(new RegisterAccountCommand(event.accountId, event.registryId))
        return new RegisterAccountSaga(event.accountId);
    }

    onAccountRegistered(event: AccountRegistered) {
        this.done = true;
    }
}

export interface RegisterAccountSagaStore {
    load(accountId: string): Promise<RegisterAccountSaga>;
    save(saga: RegisterAccountSaga): Promise<void>;
}


export class RegisterAccountSagaManager {
    constructor(
        private readonly registerAccountSagaStore: RegisterAccountSagaStore,
        private readonly commandBus: any
    ) { }

    async onAccountOpened(event: AccountOpened) {
        const saga = RegisterAccountSaga.onAccountOpened(event, {});
        await this.registerAccountSagaStore.save(saga);
    }

    async onAccountRegistered(event: AccountRegistered) {
        const saga = await this.registerAccountSagaStore.load(event.accountId);
        saga.onAccountRegistered(event);
        await this.registerAccountSagaStore.save(saga);
    }
}