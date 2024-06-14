import { Registry } from "../../domain/registry";

export class RegistrySerializer1n {
  serialize(registry: Registry) {
    return {
      registryId: registry.registryId,
      balances: registry.balances,
      version: 1,
    };
  }

  deserialize(serialized: ReturnType<this["serialize"]>) {
    return new Registry(serialized.registryId, serialized.balances);
  }
}
