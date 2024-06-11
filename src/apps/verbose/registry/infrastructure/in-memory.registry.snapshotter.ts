import { Registry } from "../domain/registry";
import { RegistrySerializer1n } from "./serializers/registry.serializer";

export class InMemoryRegistrySnapshotter {
  snapshots = new Map<string, ReturnType<RegistrySerializer1n["serialize"]> & { revision: number }>();

  registrySerializer = new RegistrySerializer1n();

  async load(registryId: string) {
    const snapshot = this.snapshots.get(registryId);
    if (snapshot) {
      const instance = this.registrySerializer.deserialize(snapshot);
      instance.streamRevision = snapshot.revision;
      return instance;
    }
  }

  async save(registry: Registry) {
    this.snapshots.set(registry.registryId, {
      ...this.registrySerializer.serialize(registry),
      revision: registry.streamRevision,
    });
  }
}
