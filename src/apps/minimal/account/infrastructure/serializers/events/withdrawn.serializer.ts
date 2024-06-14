import { Withdrawn } from "../../../domain/account";

export class WithdrawnSerializer1n {
  serialize(event: Withdrawn) {
    return {
      ...event.serialize(),
      version: 1,
    }
  }

  deserialize(serialized: ReturnType<this["serialize"]>) {
    return Withdrawn.deserialize(serialized);
  }
}
