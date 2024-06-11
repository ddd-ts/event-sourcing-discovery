import { Deposited } from "../../domain/account";

export class DepositedSerializer1n {
  serialize(event: Deposited) {
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
    return new Deposited(
      serialized.eventId,
      {
        accountId: serialized.payload.accountId,
        registryId: serialized.payload.registryId,
        amount: serialized.payload.amount,
      },
      serialized.revision,
      serialized.occurredAt,
    );
  }
}
