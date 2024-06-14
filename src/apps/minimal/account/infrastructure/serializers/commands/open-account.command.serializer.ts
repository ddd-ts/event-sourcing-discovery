import { OpenAccountCommand } from "../../../application/commands/open-account.command";

export class OpenAccountCommandSerializer {
  serialize(command: OpenAccountCommand) {
    return {
      ...command.serialize(),
      version: 1,
    } as const;
  }

  deserialize(serialized: ReturnType<this["serialize"]>) {
    return OpenAccountCommand.deserialize(serialized);
  }
}
