import { WithdrawalRegistered } from "../../domain/registry";

export class WithdrawalRegisteredSerializer {
  serialize(event: WithdrawalRegistered) {
    return {
      ...event.serialize(),
      version: 1,
    };
  }

  deserialize(serialized: ReturnType<this["serialize"]>) {
    return WithdrawalRegistered.deserialize(serialized);
  }
}
