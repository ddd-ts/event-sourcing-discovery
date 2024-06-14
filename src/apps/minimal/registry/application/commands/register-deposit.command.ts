import type { RegistryStore } from "../registry.store";

export class RegisterDepositCommand {
  static readonly type = "RegisterDepositCommand";
  type = RegisterDepositCommand.type;
  constructor(
    public readonly accountId: string,
    public readonly registryId: string,
    public readonly amount: number,
  ) {}
}

export class RegisterDepositCommandHandler {
  constructor(private readonly registryStore: RegistryStore) {}

  async execute(command: RegisterDepositCommand) {
    const registry = await this.registryStore.load(command.registryId);

    if (!registry) {
      throw new Error("Could not find registry");
    }

    registry.registerDeposit(command.accountId, command.amount);

    await this.registryStore.save(registry);
  }
}
