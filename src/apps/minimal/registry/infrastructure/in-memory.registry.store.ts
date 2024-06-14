import type { EventSerializerRegistry, EventSerializerRegistryForAggregate, EventSourcingEvent } from "../../framework/es-event";
import { AggregateStreamConfiguration } from "../../framework/event-store";
import type { InMemoryEventStore } from "../../framework/event-store/in-memory/in-memory.event-store";
import type { RegistryStore } from "../application/registry.store";
import {
  Registry,
} from "../domain/registry";
import { InMemoryRegistrySnapshotter } from "./in-memory.registry.snapshotter";

export class InMemoryRegistryStore implements RegistryStore {
  constructor(
    private readonly eventStore: InMemoryEventStore,
    private readonly serializer: EventSerializerRegistryForAggregate<
      Registry
    >,
  ) { }

  snapshotter = new InMemoryRegistrySnapshotter();

  async load(registryId: string): Promise<Registry | undefined> {
    const stream = new AggregateStreamConfiguration(Registry.type, registryId);

    const snapshot = await this.snapshotter.load(registryId);
    if (snapshot) {
      for await (const serialized of await this.eventStore.readAggregateStream(stream, snapshot.streamRevision + 1)) {
        const event = this.serializer.deserialize(serialized);
        snapshot.load(event as any);
      }
      return snapshot;
    }

    const events = await this.eventStore.readAggregateStream(stream, 0);
    if (!events) {
      return undefined;
    }

    let registry: Registry | undefined = undefined;

    for await (const serialized of events) {
      const event = this.serializer.deserialize(serialized);
      if (!registry) {
        registry = Registry.instantiate(event as any);
      } else {
        registry.load(event as any);
      }
    }

    return registry;
  }

  async save(registry: Registry): Promise<void> {
    const stream = new AggregateStreamConfiguration(Registry.type, registry.registryId);

    const serialized = registry.changes.map((event) => this.serializer.serialize(event));

    await this.eventStore.appendToAggregateStream(stream, serialized, registry.streamRevision);

    registry.acknowledgeChanges();
    await this.snapshotter.save(registry);
  }
}
