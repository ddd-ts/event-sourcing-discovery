import type { AccountOpened } from "../../../domain/account";

export class AccountOpenedSerializer1n {
  serialize(event: AccountOpened) {
    return {
      eventId: event.eventId,
      type: event.type,
      payload: {
        accountId: event.payload.accountId,
        registryId: event.payload.registryId,
      },
      ...("revision" in event && { revision: event.revision }),
      ...("occurredAt" in event && { occurredAt: event.occurredAt }),
      version: 1,
    } as const;
  }

  deserialize(serialized: ReturnType<this["serialize"]>) {
    return {
      eventId: serialized.eventId,
      type: serialized.type,
      payload: {
        accountId: serialized.payload.accountId,
        registryId: serialized.payload.registryId,
      },
      ...("revision" in serialized && { revision: serialized.revision }),
      ...("occurredAt" in serialized && { occurredAt: serialized.occurredAt }),
    };
  }
}
