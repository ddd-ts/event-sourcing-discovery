import { AccountOpened } from "../../../domain/account";

export class AccountOpenedSerializer1n {
  serialize(event: AccountOpened) {
    return {
      ...event.serialize(),
      version: 1,
    } as const;
  }

  deserialize(serialized: ReturnType<this["serialize"]>) {
    return AccountOpened.deserialize(serialized)
  }
}
