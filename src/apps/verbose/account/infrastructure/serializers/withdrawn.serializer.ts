import { Withdrawn } from "../../domain/account";

export class WithdrawnSerializer1n {
  serialize(event: Withdrawn) {
    return {
      eventId: event.eventId,
      type: event.type,
      payload: {
        accountId: event.payload.accountId,
        registryId: event.payload.registryId,
        amount: event.payload.amount,
      },
      ...("revision" in event && { revision: event.revision }),
      ...("occurredAt" in event && { occurredAt: event.occurredAt }),
      version: 1,
    };
  }

  deserialize(serialized: ReturnType<this["serialize"]>) {
    return new Withdrawn(
      serialized.eventId,
      serialized.payload.accountId,
      serialized.payload.registryId,
      serialized.payload.amount,
      serialized.revision,
    );
  }
}
