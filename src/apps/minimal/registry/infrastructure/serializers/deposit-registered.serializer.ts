import { DepositRegistered } from "../../domain/registry";

export class DepositRegisteredSerializer {
  serialize(event: DepositRegistered) {
    return {
      ...event.serialize(),
      version: 1,
    };
  }

  deserialize(serialized: ReturnType<this["serialize"]>) {
    return DepositRegistered.deserialize(serialized)
  }
}
