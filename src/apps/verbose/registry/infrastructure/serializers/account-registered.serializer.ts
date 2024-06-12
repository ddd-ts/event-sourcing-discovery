import type { Change, Fact } from "../../../framework/es-event";
import { AccountRegistered, RegistryOpened } from "../../domain/registry";

export class AccountRegisteredSerializer {
  serialize(event: AccountRegistered) {
    return {
      eventId: event.eventId,
      occurredAt: event.occurredAt,
      payload: {
        registryId: event.registryId,
        accountId: event.accountId,
      },
      revision: event.revision,
      type: event.type,
      version: 1,
    };
  }

  deserialize(serialized: ReturnType<this["serialize"]>): AccountRegistered {
    return new AccountRegistered(
      serialized.eventId,
      serialized.payload.registryId,
      serialized.payload.accountId,
      serialized.revision,
      serialized.occurredAt,
    );
  }
}
