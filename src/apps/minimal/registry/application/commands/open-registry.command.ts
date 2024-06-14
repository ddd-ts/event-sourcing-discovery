import type { Command } from "../../../framework/command-bus";
import { Registry } from "../../domain/registry";
import type { RegistryStore } from "../registry.store";

export class OpenRegistryCommand implements Command {
  static readonly type = "OpenRegistryCommand";
  type = OpenRegistryCommand.type;
}

export class OpenRegistryCommandHandler {
  constructor(private readonly registryStore: RegistryStore) {}

  async execute(command: OpenRegistryCommand) {
    const opened = Registry.open();
    await this.registryStore.save(opened);
    return opened.registryId;
  }
}
