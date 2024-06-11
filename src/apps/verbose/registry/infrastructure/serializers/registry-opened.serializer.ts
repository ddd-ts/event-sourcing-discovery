import { RegistryOpened } from "../../domain/registry";

export class RegistryOpenedSerializer1n {
  serialize(event: RegistryOpened) {
    return {
      eventId: event.eventId,
      occurredAt: event.occurredAt,
      payload: {
        registryId: event.registryId,
      },
      revision: event.revision,
      type: event.type,
      version: 1,
    };
  }

  deserialize(serialized: ReturnType<this["serialize"]>): RegistryOpened {
    return new RegistryOpened(
      serialized.eventId,
      serialized.payload.registryId,
      serialized.revision,
      serialized.occurredAt,
    );
  }
}
