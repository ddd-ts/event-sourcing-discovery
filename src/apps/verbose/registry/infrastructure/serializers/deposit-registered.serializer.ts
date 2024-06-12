import { DepositRegistered } from "../../domain/registry";

export class DepositRegisteredSerializer {
  serialize(event: DepositRegistered) {
    return {
      eventId: event.eventId,
      occurredAt: event.occurredAt,
      payload: {
        registryId: event.registryId,
        accountId: event.accountId,
        amount: event.amount,
      },
      revision: event.revision,
      type: event.type,
      version: 1,
    };
  }

  deserialize(serialized: ReturnType<this["serialize"]>) {
    return new DepositRegistered(
      serialized.eventId,
      serialized.payload.registryId,
      serialized.payload.accountId,
      serialized.payload.amount,
      serialized.revision,
      serialized.occurredAt,
    );
  }
}
