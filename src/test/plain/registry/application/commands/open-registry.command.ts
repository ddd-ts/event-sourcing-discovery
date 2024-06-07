import { Registry } from "../../domain/registry";
import type { RegistryStore } from "../registry.store";

export class OpenRegistryCommand { }

export class OpenRegistryCommandHandler {
    constructor(private readonly registryStore: RegistryStore) { }

    async execute(command: OpenRegistryCommand) {
        const opened = Registry.open();
        await this.registryStore.save(opened);
    }
}