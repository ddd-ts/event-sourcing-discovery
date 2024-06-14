import type { Change, Fact } from "../../../framework/es-event";
import { AccountRegistered, RegistryOpened } from "../../domain/registry";

export class AccountRegisteredSerializer {
  serialize(event: AccountRegistered) {
    return {
      ...event.serialize(),
      version: 1,
    };
  }

  deserialize(serialized: ReturnType<this["serialize"]>): AccountRegistered {
    return AccountRegistered.deserialize(serialized);
  }
}
