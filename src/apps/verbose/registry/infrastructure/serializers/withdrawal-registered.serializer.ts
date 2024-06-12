import { WithdrawalRegistered } from "../../domain/registry";

export class WithdrawalRegisteredSerializer {
  serialize(event: WithdrawalRegistered) {
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
    return new WithdrawalRegistered(
      serialized.eventId,
      serialized.payload.registryId,
      serialized.payload.accountId,
      serialized.payload.amount,
      serialized.revision,
      serialized.occurredAt,
    );
  }
}
