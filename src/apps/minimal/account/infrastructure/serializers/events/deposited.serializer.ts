import { Deposited } from "../../../domain/account";

export class DepositedSerializer1n {
  serialize(event: Deposited) {
    return {
      ...event.serialize(),
      version: 1,
    };
  }

  deserialize(serialized: ReturnType<this["serialize"]>) {
    return Deposited.deserialize(serialized);
  }
}
