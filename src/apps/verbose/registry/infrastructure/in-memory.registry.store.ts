import { AccountOpenedSerializer1n } from "../../account/infrastructure/serializers/account-opened.serializer";
import { AggregateStreamConfiguration } from "../../framework/event-store";
import type { InMemoryEventStore } from "../../framework/event-store/in-memory/in-memory.event-store";
import type { RegistryStore } from "../application/registry.store";
import { Registry } from "../domain/registry";
import { InMemoryRegistrySnapshotter } from "./in-memory.registry.snapshotter";
import { AccountRegisteredSerializer1n } from "./serializers/account-registered.serializer";
import { DepositRegisteredSerializer1n } from "./serializers/deposit-registered.serializer";
import { RegistryOpenedSerializer1n } from "./serializers/registry-opened.serializer";
import { WithdrawalRegisteredSerializer1n } from "./serializers/withdrawal-registered.serializer";

export class InMemoryRegistryStore implements RegistryStore {
  constructor(private readonly eventStore: InMemoryEventStore) {}

  snapshotter = new InMemoryRegistrySnapshotter();

  async load(registryId: string): Promise<Registry | undefined> {
    const stream = new AggregateStreamConfiguration(Registry.type, registryId);

    const snapshot = await this.snapshotter.load(registryId);
    if (snapshot) {
      for await (const serialized of await this.eventStore.readAggregateStream(stream, snapshot.streamRevision + 1)) {
        const event = this.deserialize(serialized);
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
      const event = this.deserialize(serialized);
      if (!registry) {
        registry = Registry.instanciate(event as any);
      } else {
        registry.load(event as any);
      }
    }

    return registry;
  }

  registryOpenedSerializer = new RegistryOpenedSerializer1n();
  accountRegisteredSerializer = new AccountRegisteredSerializer1n();
  depositRegisteredSerializer = new DepositRegisteredSerializer1n();
  withdrawalRegisteredSerializer = new WithdrawalRegisteredSerializer1n();

  serialize(event: any) {
    switch (event.type) {
      case "RegistryOpened":
        return this.registryOpenedSerializer.serialize(event);
      case "AccountRegistered":
        return this.accountRegisteredSerializer.serialize(event);
      case "DepositRegistered":
        return this.depositRegisteredSerializer.serialize(event);
      case "WithdrawalRegistered":
        return this.withdrawalRegisteredSerializer.serialize(event);
    }

    throw new Error(`Unknown event type: ${event.type}`);
  }

  deserialize(serialized: any) {
    switch (serialized.type) {
      case "RegistryOpened":
        return this.registryOpenedSerializer.deserialize(serialized);
      case "AccountRegistered":
        return this.accountRegisteredSerializer.deserialize(serialized);
      case "DepositRegistered":
        return this.depositRegisteredSerializer.deserialize(serialized);
      case "WithdrawalRegistered":
        return this.withdrawalRegisteredSerializer.deserialize(serialized);
    }

    throw new Error(`Unknown event type: ${serialized.type}`);
  }

  async save(registry: Registry): Promise<void> {
    const stream = new AggregateStreamConfiguration(Registry.type, registry.registryId);

    const serialized = registry.changes.map((event) => this.serialize(event));

    await this.eventStore.appendToAggregateStream(stream, serialized, registry.streamRevision);

    registry.acknowledgeChanges();
    await this.snapshotter.save(registry);
  }
}
