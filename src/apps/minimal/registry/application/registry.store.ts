import type { Registry } from "../domain/registry";

export interface RegistryStore {
  load(registryId: string): Promise<Registry | undefined>;
  save(registry: Registry): Promise<void>;
}
