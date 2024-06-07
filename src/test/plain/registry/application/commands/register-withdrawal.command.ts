import type { RegistryStore } from "../registry.store";

export class RegisterWithdrawalCommand {
    constructor(
        public readonly accountId: string,
        public readonly registryId: string,
        public readonly amount: number
    ) { }
}

export class RegisterWithdrawalCommandHandler {
    constructor(private readonly registryStore: RegistryStore) { }

    async execute(command: RegisterWithdrawalCommand) {
        const registry = await this.registryStore.load(command.registryId);

        if (!registry) {
            throw new Error("Could not find registry");
        }

        registry.registerWithdrawal(command.accountId, command.amount);

        await this.registryStore.save(registry);
    }
}