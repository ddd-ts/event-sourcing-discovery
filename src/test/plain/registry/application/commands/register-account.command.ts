import type { RegistryStore } from "../registry.store";

export class RegisterAccountCommand {
    constructor(public readonly accountId: string, public readonly registryId: string) { }
}

export class RegisterAccountCommandHandler {
    constructor(private readonly registryStore: RegistryStore) { }

    async execute(command: RegisterAccountCommand) {
        const registry = await this.registryStore.load(command.registryId);

        if (!registry) {
            throw new Error("Could not find registry");
        }

        registry.registerAccount(command.accountId);

        await this.registryStore.save(registry);
    }
}