import { OpenAccountCommand } from "../../../application/commands/open-account.command";

export class OpenAccountCommandSerializer {
  serialize(command: OpenAccountCommand) {
    return {
      type: command.type,
      registryId: command.registryId,
      version: 1,
    } as const;
  }

  deserialize(serialized: ReturnType<this["serialize"]>) {
    return new OpenAccountCommand(serialized.registryId);
  }
}
